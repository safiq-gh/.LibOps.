from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.book import BookCreate, BookResponse, BookUpdate

router = APIRouter()


@router.get("/", response_model=list[BookResponse])
def read_books(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve books.
    """
    books = crud.book.get_multi(db, skip=skip, limit=limit)
    return books


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    *,
    db: Session = Depends(deps.get_db),
    book_in: BookCreate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Create new book. (Admin only)
    """
    book = crud.book.get_by_isbn(db, isbn=book_in.isbn)
    if book:
        raise HTTPException(
            status_code=400,
            detail="A book with this ISBN already exists in the system.",
        )
    book = crud.book.create(db, obj_in=book_in)
    return book


@router.get("/{book_id}", response_model=BookResponse)
def read_book_by_id(
    book_id: UUID,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get a specific book by id.
    """
    book = crud.book.get(db, id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    *,
    db: Session = Depends(deps.get_db),
    book_id: UUID,
    book_in: BookUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a book. (Admin only)
    """
    book = crud.book.get(db, id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book_in.isbn and book_in.isbn != book.isbn:
        existing_book = crud.book.get_by_isbn(db, isbn=book_in.isbn)
        if existing_book:
            raise HTTPException(
                status_code=400,
                detail="A book with this ISBN already exists in the system.",
            )

    book = crud.book.update(db, db_obj=book, obj_in=book_in)
    return book


@router.delete("/{book_id}", response_model=BookResponse)
def delete_book(
    *,
    db: Session = Depends(deps.get_db),
    book_id: UUID,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a book. (Admin only)
    """
    book = crud.book.get(db, id=book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    book = crud.book.remove(db, id=book_id)
    return book
