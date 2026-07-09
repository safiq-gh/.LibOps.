from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.borrow import BorrowRecordCreate, BorrowRecordResponse

router = APIRouter()


@router.post("/", response_model=BorrowRecordResponse)
def borrow_book(
    *,
    db: Session = Depends(deps.get_db),
    borrow_in: BorrowRecordCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Borrow a book. Decreases the available copies of the book.
    """
    record = crud.borrow.borrow_book(db=db, user_id=current_user.id, obj_in=borrow_in)
    return record


@router.post("/{record_id}/return", response_model=BorrowRecordResponse)
def return_book(
    *,
    db: Session = Depends(deps.get_db),
    record_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Return a borrowed book. Increases the available copies of the book.
    """
    record = crud.borrow.return_book(db=db, record_id=record_id, user_id=current_user.id)
    return record


@router.get("/me", response_model=list[BorrowRecordResponse])
def read_my_borrow_history(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve current user's borrow history.
    """
    records = crud.borrow.get_multi_by_user(db=db, user_id=current_user.id, skip=skip, limit=limit)
    return records


@router.get("/", response_model=list[BorrowRecordResponse])
def read_all_borrow_history(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve all borrow records. (Admin only)
    """
    records = crud.borrow.get_multi(db=db, skip=skip, limit=limit)
    return records
