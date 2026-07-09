from sqlalchemy import Enum as SQLEnum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .borrowrecord import BorrowRecord
from app.db.base import Base
from app.models.mixins import TimeMixin, UUIDMixin
from app.models.enums import UserRole


class User(UUIDMixin, TimeMixin, Base):
    __tablename__ = "users"
    borrow_records: Mapped[list["BorrowRecord"]] = relationship(back_populates="user")
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(index=True, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.MEMBER)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
