from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import Status
from app.schemas.book import BookResponse

class BorrowRecordBase(BaseModel):
    user_id: UUID
    book_id: UUID
    due_date: datetime

class BorrowRecordCreate(BaseModel):
    book_id: UUID
    days_to_borrow: int = Field(14, ge=1, le=90)

class BorrowRecordUpdate(BaseModel):
    status: Optional[Status] = None
    returned_at: Optional[datetime] = None


class BorrowRecordResponse(BorrowRecordBase):
    id: UUID
    borrowed_at: datetime
    returned_at: Optional[datetime] = None
    status: Status
    created_at: datetime
    updated_at: datetime
    book: BookResponse

    model_config = ConfigDict(from_attributes=True)
