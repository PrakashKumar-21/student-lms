import logging
import random
from datetime import datetime, timezone

from celery.exceptions import Ignore, SoftTimeLimitExceeded
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.catalog import SubjectChunk
from app.models.job import IngestionJob
from app.services.chunking import chunk_text
from app.services.embeddings import embed_texts
from app.services.pdf_text import extract_text_from_path
from app.services.storage_backend import cleanup_source, cleanup_temp_file, open_for_processing
from worker.celery_app import celery_app


logger = logging.getLogger("uvicorn.error")
settings = get_settings()


def _get_db() -> Session:
    return SessionLocal()


@celery_app.task(
    bind=True,
    name="ingest_subject_file",
)
def ingest_subject_file(self, job_id: str) -> None:
    db = _get_db()
    local_path = None
    job_file_path = None
    max_retries = settings.celery_task_max_retries
    try:
        job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
        if not job:
            logger.warning("job_not_found job_id=%s", job_id)
            return
        if job.status == "DONE":
            logger.info("job_already_done job_id=%s", job_id)
            return
        job_file_path = job.file_path

        job.status = "PROCESSING"
        job.error = None
        job.attempts += 1
        # Idempotency: remove any prior chunks for this file before reprocessing.
        db.query(SubjectChunk).filter(SubjectChunk.file_id == job.file_id).delete()
        db.commit()

        local_path = open_for_processing(job.storage_backend, job.file_path)
        pages = extract_text_from_path(
            file_path=local_path,
            content_type=job.content_type,
        )

        chunks: list[tuple[int | None, str]] = []
        for page_num, text in pages:
            for chunk in chunk_text(text):
                chunks.append((page_num, chunk))

        if chunks:
            embeddings = embed_texts([item[1] for item in chunks])
            for idx, (page_num, content) in enumerate(chunks):
                db.add(
                    SubjectChunk(
                        subject_id=job.subject_id,
                        file_id=job.file_id,
                        chunk_index=idx,
                        page=page_num,
                        content=content,
                        embedding=embeddings[idx],
                    )
                )
            db.commit()

        job.status = "DONE"
        job.updated_at = datetime.now(timezone.utc)
        db.commit()
        cleanup_source(job.storage_backend, job.file_path)

    except SoftTimeLimitExceeded:
        db.rollback()
        _mark_failed(db, job_id, "Task timed out.")
        logger.exception("job_timeout job_id=%s", job_id)
        raise Ignore()

    except Exception as exc:
        db.rollback()
        if self.request.retries >= max_retries:
            _mark_failed(db, job_id, str(exc))
            logger.exception("job_failed_final job_id=%s", job_id)
            raise Ignore()
        _mark_retrying(db, job_id, str(exc))
        logger.exception("job_retrying job_id=%s", job_id)
        raise self.retry(
            exc=exc,
            countdown=_retry_delay(self.request.retries),
            max_retries=max_retries,
        )

    finally:
        if local_path and job_file_path and local_path != job_file_path:
            cleanup_temp_file(local_path)
        db.close()


def _mark_retrying(db: Session, job_id: str, error: str) -> None:
    job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
    if not job:
        return
    job.status = "RETRYING"
    job.error = _truncate_error(error)
    db.commit()


def _mark_failed(db: Session, job_id: str, error: str) -> None:
    job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
    if not job:
        return
    job.status = "FAILED"
    job.error = _truncate_error(error)
    db.commit()


def _truncate_error(error: str) -> str:
    if not error:
        return "Unknown error"
    return error[:2000]


def _retry_delay(retries: int) -> int:
    base = max(settings.celery_task_retry_backoff_base, 1)
    cap = max(settings.celery_task_retry_backoff_max, base)
    delay = min(base ** (retries + 1), cap)
    if settings.celery_task_retry_jitter:
        delay = int(delay * (0.5 + random.random()))
    return delay
