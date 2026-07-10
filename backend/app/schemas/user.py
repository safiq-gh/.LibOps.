from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.enums import UserRole

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.MEMBER
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    role: UserRole
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
