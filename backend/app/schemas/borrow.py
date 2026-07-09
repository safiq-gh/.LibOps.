from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import Status

class BorrowRecordBase(BaseModel):
    user_id: UUID
    book_id: UUID
    due_date: datetime

class BorrowRecordCreate(BaseModel):
    book_id: UUID
    days_to_borrow: int = 14

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

    model_config = ConfigDict(from_attributes=True)
