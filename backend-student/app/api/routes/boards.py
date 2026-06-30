from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.models.catalog import Board
from app.models.user import User
from app.schemas.board import BoardCreate, BoardOut, BoardStatusUpdate

router = APIRouter(prefix="/boards", tags=["catalog"])

@router.get("", response_model=list[BoardOut])
def list_boards(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[BoardOut]:
    query = db.query(Board)
    if not include_inactive:
        query = query.filter(Board.status == "active")
    return query.order_by(Board.name.asc()).all()


@router.post("", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(
    payload: BoardCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> BoardOut:
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Board name is required.",
        )
    existing = db.query(Board).filter(Board.name == name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Board already exists.",
        )
    board = Board(name=name, status="inactive")
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.patch("/{board_id}/status", response_model=BoardOut)
def update_board_status(
    board_id: UUID,
    payload: BoardStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> BoardOut:
    status_value = payload.status.strip().lower()
    if status_value not in {"active", "inactive"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'inactive'.",
        )
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found.",
        )
    board.status = status_value
    db.commit()
    db.refresh(board)
    return board


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found.",
        )
    db.delete(board)
    db.commit()
