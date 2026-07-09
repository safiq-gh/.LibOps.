from pydantic import BaseModel, Field, ConfigDict
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
    pass

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
    available_quantity: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
