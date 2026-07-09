from typing import Any, Dict, Optional, Union

from sqlalchemy.orm import Session
from uuid import UUID

from app.models.books import Book
from app.schemas.book import BookCreate, BookUpdate

def get(db: Session, id: UUID) -> Optional[Book]:
    return db.query(Book).filter(Book.id == id).first()

def get_by_isbn(db: Session, *, isbn: str) -> Optional[Book]:
    return db.query(Book).filter(Book.isbn == isbn).first()

def create(db: Session, *, obj_in: BookCreate) -> Book:
    db_obj = Book(
        isbn=obj_in.isbn,
        title=obj_in.title,
        author=obj_in.author,
        publisher=obj_in.publisher,
        category=obj_in.category,
        description=obj_in.description,
        published_year=obj_in.published_year,
        cover_image_url=obj_in.cover_image_url,
        total_copies=obj_in.total_copies,
        available_copies=obj_in.available_copies,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(
    db: Session, *, db_obj: Book, obj_in: Union[BookUpdate, Dict[str, Any]]
) -> Book:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
        
    for field in update_data:
        setattr(db_obj, field, update_data[field])
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: UUID) -> Book:
    obj = db.query(Book).get(id)
    db.delete(obj)
    db.commit()
    return obj

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Book]:
    return db.query(Book).offset(skip).limit(limit).all()
