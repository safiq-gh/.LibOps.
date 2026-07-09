from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.borrowrecord import BorrowRecord
from app.models.books import Book
from app.models.enums import Status
from app.schemas.borrow import BorrowRecordCreate

def get(db: Session, id: UUID) -> Optional[BorrowRecord]:
    return db.query(BorrowRecord).filter(BorrowRecord.id == id).first()

def get_multi_by_user(db: Session, *, user_id: UUID, skip: int = 0, limit: int = 100) -> List[BorrowRecord]:
    return db.query(BorrowRecord).filter(BorrowRecord.user_id == user_id).offset(skip).limit(limit).all()

def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> List[BorrowRecord]:
    return db.query(BorrowRecord).offset(skip).limit(limit).all()

def borrow_book(db: Session, *, user_id: UUID, obj_in: BorrowRecordCreate) -> BorrowRecord:
    # Transactional
    book = db.query(Book).filter(Book.id == obj_in.book_id).with_for_update().first()
    
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        
    if book.available_copies <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No available copies left to borrow.")
        
    # Check if user already borrowed this book and hasn't returned it
    existing_record = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == user_id,
        BorrowRecord.book_id == obj_in.book_id,
        BorrowRecord.status == Status.BORROWED
    ).first()
    
    if existing_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already borrowed this book.")

    # Decrease available copies
    book.available_copies -= 1
    
    due_date = datetime.now(timezone.utc) + timedelta(days=obj_in.days_to_borrow)
    
    db_obj = BorrowRecord(
        user_id=user_id,
        book_id=obj_in.book_id,
        due_date=due_date,
        status=Status.BORROWED
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def return_book(db: Session, *, record_id: UUID, user_id: UUID) -> BorrowRecord:
    record = db.query(BorrowRecord).filter(
        BorrowRecord.id == record_id, 
        BorrowRecord.user_id == user_id
    ).with_for_update().first()
    
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Borrow record not found.")
        
    if record.status == Status.RETURNED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book is already returned.")
        
    book = db.query(Book).filter(Book.id == record.book_id).with_for_update().first()
    if book:
        book.available_copies += 1
        
    record.status = Status.RETURNED
    record.returned_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(record)
    return record
