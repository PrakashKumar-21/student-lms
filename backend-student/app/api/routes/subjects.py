import logging
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from PIL import Image
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.celery_client import celery_client
from app.core.config import get_settings
from app.models.catalog import Board, ClassLevel, Subject, SubjectChunk, SubjectFile
from app.models.user import User
from app.models.job import IngestionJob
from app.schemas.subject import (
    SubjectCreate,
    SubjectOut,
    SubjectStatusUpdate,
    SubjectNameUpdate,
)
from app.schemas.subject_file import SubjectFileOut, SubjectFileUploadOut
from app.services.storage import delete_from_spaces, delete_many_from_spaces
from app.services.storage_backend import save_upload, use_spaces_backend

router = APIRouter(prefix="/subjects", tags=["catalog"])
logger = logging.getLogger("uvicorn.error")
settings = get_settings()
UPLOAD_BASE = Path(settings.upload_dir) / "subjects"
UPLOAD_TMP = Path(settings.upload_tmp_dir)


def _validate_upload(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required.",
        )
    allowed_mime = {m.strip().lower() for m in settings.upload_allowed_mime.split(",")}
    allowed_ext = {e.strip().lower() for e in settings.upload_allowed_ext.split(",")}
    content_type = (file.content_type or "").lower()
    ext = Path(file.filename).suffix.lower()
    if content_type not in allowed_mime or ext not in allowed_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type.",
        )


def _validate_file_content(path: Path) -> str:
    with path.open("rb") as f:
        head = f.read(8)
    if head.startswith(b"%PDF-"):
        return "application/pdf"
    try:
        with Image.open(path) as img:
            img.verify()
            format_map = {
                "PNG": "image/png",
                "JPEG": "image/jpeg",
                "JPG": "image/jpeg",
                "WEBP": "image/webp",
            }
            return format_map.get(img.format or "", "")
    except Exception:
        return ""

@router.get("", response_model=list[SubjectOut])
def list_subjects(
    board: str | None = Query(default=None),
    class_level: str | None = Query(default=None, alias="class"),
    board_id: UUID | None = Query(default=None),
    class_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[SubjectOut]:

    query = (
        db.query(
            Subject,
            func.count(SubjectFile.id).label("file_count"),
            func.coalesce(func.sum(SubjectFile.size_bytes), 0).label("total_size_bytes"),
        )
        .outerjoin(SubjectFile, SubjectFile.subject_id == Subject.id)
        .group_by(Subject.id)
    )
    if class_id:
        query = query.filter(Subject.class_level_id == class_id)
    elif class_level:
        normalized_board = "RBSE" if board == "RBSC" else board
        board_obj = db.query(Board).filter(Board.name == normalized_board).first()
        if not board_obj:
            return []
        class_obj = (
            db.query(ClassLevel)
            .filter(ClassLevel.board_id == board_obj.id, ClassLevel.name == class_level)
            .first()
        )
        if not class_obj:
            return []
        query = query.filter(Subject.class_level_id == class_obj.id)
    if board_id:
        query = query.filter(Subject.board_id == board_id)
    rows = query.order_by(Subject.name.asc()).all()
    return [
        SubjectOut(
            id=subject.id,
            name=subject.name,
            status=subject.status,
            board_id=subject.board_id,
            class_level_id=subject.class_level_id,
            file_count=file_count,
            total_size_bytes=total_size_bytes,
        )
        for subject, file_count, total_size_bytes in rows
    ]


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(subject_id: UUID, db: Session = Depends(get_db)) -> SubjectOut:
    subject_row = (
        db.query(
            Subject,
            func.count(SubjectFile.id).label("file_count"),
            func.coalesce(func.sum(SubjectFile.size_bytes), 0).label("total_size_bytes"),
        )
        .outerjoin(SubjectFile, SubjectFile.subject_id == Subject.id)
        .filter(Subject.id == subject_id)
        .group_by(Subject.id)
        .first()
    )
    if not subject_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )
    subject, file_count, total_size_bytes = subject_row
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        status=subject.status,
        board_id=subject.board_id,
        class_level_id=subject.class_level_id,
        file_count=file_count,
        total_size_bytes=total_size_bytes,
    )


@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SubjectOut:
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject name is required.",
        )
    board = db.query(Board).filter(Board.id == payload.board_id).first()
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found.",
        )
    class_level = db.query(ClassLevel).filter(ClassLevel.id == payload.class_id).first()
    if not class_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found.",
        )
    if class_level.board_id != board.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class does not belong to the board.",
        )
    existing = (
        db.query(Subject)
        .filter(Subject.class_level_id == payload.class_id, Subject.name == name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subject already exists.",
        )
    status = payload.status.strip() or "Draft"
    subject = Subject(
        name=name,
        status=status,
        board_id=payload.board_id,
        class_level_id=payload.class_id,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.post(
    "/{subject_id}/files",
    response_model=SubjectFileUploadOut,
    status_code=status.HTTP_201_CREATED,
)
def upload_subject_file(
    subject_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SubjectFileUploadOut:
    
    # 1. Check subject
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )
        
    # 2. Validate filename
    _validate_upload(file)
    safe_name = file.filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    
    # 3. Stream file to disk with size limit
    subject_dir = UPLOAD_BASE / str(subject_id)
    subject_dir.mkdir(parents=True, exist_ok=True)
    UPLOAD_TMP.mkdir(parents=True, exist_ok=True)
    tmp_path = UPLOAD_TMP / stored_name
    size_bytes = 0
    chunk_size = 1024 * 1024
    try:
        with tmp_path.open("wb") as out_file:
            while True:
                chunk = file.file.read(chunk_size)
                if not chunk:
                    break
                size_bytes += len(chunk)
                if size_bytes > settings.upload_max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File too large.",
                    )
                out_file.write(chunk)
        if size_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
    finally:
        try:
            file.file.close()
        except Exception:
            pass

    detected_mime = _validate_file_content(tmp_path)
    allowed_mime = {m.strip().lower() for m in settings.upload_allowed_mime.split(",")}
    if not detected_mime or detected_mime not in allowed_mime:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content.",
        )

    file_obj = None
    try:
        if use_spaces_backend():
            file_obj = tmp_path.open("rb")
        storage_backend, storage_path = save_upload(
            subject_id=str(subject_id),
            filename=stored_name,
            file_obj=file_obj,
            content_type=detected_mime,
            tmp_path=tmp_path,
            local_path=subject_dir / stored_name,
        )
    finally:
        if file_obj:
            file_obj.close()
    if tmp_path.exists():
        tmp_path.unlink(missing_ok=True)

    # 4. Save file metadata in DB
    record = SubjectFile(
        subject_id=subject_id,
        original_name=safe_name,
        stored_name=stored_name,
        content_type=detected_mime,
        size_bytes=size_bytes,
        storage_path=storage_path,
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)

    # 5. Create ingestion job and enqueue
    job = IngestionJob(
        subject_id=subject_id,
        file_id=record.id,
        status="PENDING",
        storage_backend=storage_backend,
        file_path=storage_path,
        content_type=detected_mime,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        celery_client.send_task(
            "ingest_subject_file",
            args=[str(job.id)],
            queue=settings.celery_task_queue,
        )
    except Exception as exc:
        job.status = "FAILED"
        job.error = f"Failed to enqueue job: {exc}"[:2000]
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enqueue ingestion job.",
        )

    return SubjectFileUploadOut(
        job_id=job.id,
        file=SubjectFileOut.model_validate(record),
    )


@router.get("/{subject_id}/files", response_model=list[SubjectFileOut])
def list_subject_files(
    subject_id: UUID,
    db: Session = Depends(get_db),
) -> list[SubjectFileOut]:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )
    return (
        db.query(SubjectFile)
        .filter(SubjectFile.subject_id == subject_id)
        .order_by(SubjectFile.uploaded_at.desc())
        .all()
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )
    file_records = (
        db.query(SubjectFile).filter(SubjectFile.subject_id == subject_id).all()
    )
    object_keys = [record.storage_path for record in file_records if record.storage_path]
    db.query(SubjectChunk).filter(SubjectChunk.subject_id == subject_id).delete()
    db.query(SubjectFile).filter(SubjectFile.subject_id == subject_id).delete()
    db.delete(subject)
    db.commit()
    if use_spaces_backend():
        if object_keys:
            try:
                delete_many_from_spaces(object_keys)
            except Exception as exc:
                logger.warning("Failed to delete subject files from Spaces: %s", exc)
    else:
        for key in object_keys:
            try:
                Path(key).unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("Failed to delete local file: %s", exc)


@router.delete("/{subject_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject_file(
    subject_id: UUID,
    file_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    file_record = (
        db.query(SubjectFile)
        .filter(SubjectFile.id == file_id, SubjectFile.subject_id == subject_id)
        .first()
    )
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found.",
        )
    db.query(SubjectChunk).filter(SubjectChunk.file_id == file_id).delete()
    storage_path = file_record.storage_path

    db.delete(file_record)
    db.commit()
    if storage_path:
        if use_spaces_backend():
            try:
                logger.info("Deleting object from Spaces: %s", storage_path)
                delete_from_spaces(storage_path)
            except Exception as exc:
                logger.warning("Failed to delete object from Spaces: %s", exc)
        else:
            try:
                Path(storage_path).unlink(missing_ok=True)
            except Exception as exc:
                logger.warning("Failed to delete local file: %s", exc)
    else:
        logger.warning("No storage_path for file_id=%s; nothing to delete in Spaces.", file_id)


@router.patch("/{subject_id}/status", response_model=SubjectOut)
def update_subject_status(
    subject_id: UUID,
    payload: SubjectStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SubjectOut:
    status_value = payload.status.strip().lower()
    if status_value not in {"active", "draft"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'draft'.",
        )
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )
    subject.status = status_value
    db.commit()
    db.refresh(subject)
    return subject


@router.patch("/{subject_id}/name", response_model=SubjectOut)
def update_subject_name(
    subject_id: UUID,
    payload: SubjectNameUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SubjectOut:
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject name is required.",
        )
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )
    existing = (
        db.query(Subject)
        .filter(
            Subject.class_level_id == subject.class_level_id,
            Subject.name == name,
            Subject.id != subject_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subject already exists.",
        )
    subject.name = name
    db.commit()
    db.refresh(subject)
    return subject

