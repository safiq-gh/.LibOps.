from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional
from uuid import UUID
from datetime import datetime

class BookBase(BaseModel):
    isbn: str
    title: str
    author: str
    publisher: str
    category: str
    description: Optional[str] = None
    published_year: int = Field(gt=0)
    cover_image_url: Optional[str] = None
    total_copies: int = Field(ge=0)
    available_copies: int = Field(ge=0)

class BookCreate(BookBase):
    @model_validator(mode='after')
    def check_available_copies(self) -> 'BookCreate':
        if self.available_copies > self.total_copies:
            raise ValueError('available_copies cannot exceed total_copies')
        return self

class BookUpdate(BaseModel):
    isbn: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    published_year: Optional[int] = Field(None, gt=0)
    cover_image_url: Optional[str] = None
    total_copies: Optional[int] = Field(None, ge=0)
    available_copies: Optional[int] = Field(None, ge=0)

class BookResponse(BookBase):
    id: UUID

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
