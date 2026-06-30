from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.models.catalog import Board, ClassLevel
from app.models.user import User
from app.schemas.class_level import (
    ClassLevelCreate,
    ClassLevelOut,
    ClassLevelStatusUpdate,
)

router = APIRouter(prefix="/classes", tags=["catalog"])

@router.get("", response_model=list[ClassLevelOut])
def list_classes(
    board: str | None = Query(default=None),
    board_id: UUID | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[ClassLevelOut]:
    query = db.query(ClassLevel).join(Board)
    if not include_inactive:
        query = query.filter(
            ClassLevel.status == "active",
            Board.status == "active",
        )
    if board_id:
        query = query.filter(ClassLevel.board_id == board_id)
    elif board:
        board_name = "RBSE" if board == "RBSC" else board
        board_obj = db.query(Board).filter(Board.name == board_name).first()
        if board_obj:
            query = query.filter(ClassLevel.board_id == board_obj.id)
        else:
            return []
    results = query.all()
    # Sort numerically when possible (e.g., 5, 8, 10, 12), otherwise fallback to name.
    def _sort_key(item: ClassLevel) -> tuple[int, int | str]:
        try:
            return (0, int(item.name))
        except ValueError:
            return (1, item.name.lower())

    results.sort(key=_sort_key)
    return results


@router.post("", response_model=ClassLevelOut, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassLevelCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ClassLevelOut:
    board = db.query(Board).filter(Board.id == payload.board_id).first()
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found.",
        )
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class name is required.",
        )
    existing = (
        db.query(ClassLevel)
        .filter(ClassLevel.board_id == payload.board_id, ClassLevel.name == name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Class already exists.",
        )
    class_level = ClassLevel(name=name, board_id=payload.board_id, status="inactive")
    db.add(class_level)
    db.commit()
    db.refresh(class_level)
    return class_level


@router.patch("/{class_id}/status", response_model=ClassLevelOut)
def update_class_status(
    class_id: UUID,
    payload: ClassLevelStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ClassLevelOut:
    status_value = payload.status.strip().lower()
    if status_value not in {"active", "inactive"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'inactive'.",
        )
    class_level = db.query(ClassLevel).filter(ClassLevel.id == class_id).first()
    if not class_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found.",
        )
    class_level.status = status_value
    db.commit()
    db.refresh(class_level)
    return class_level


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    class_level = db.query(ClassLevel).filter(ClassLevel.id == class_id).first()
    if not class_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found.",
        )
    db.delete(class_level)
    db.commit()
