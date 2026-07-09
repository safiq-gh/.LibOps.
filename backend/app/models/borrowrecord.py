from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum, CheckConstraint, ForeignKey, func, Uuid
from datetime import datetime
from uuid import UUID
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .books import Book

from app.models.mixins import TimeMixin, UUIDMixin
from app.db.base import Base
from app.models.enums import Status


class BorrowRecord(TimeMixin, UUIDMixin, Base):
    __tablename__ = "borrow_records"
    __table_args__ = (CheckConstraint("due_date >= borrowed_at", name="ck_due_date"),)

    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    book_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("books.id"), nullable=False
    )
    borrowed_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    due_date: Mapped[datetime] = mapped_column(nullable=False)
    returned_at: Mapped[datetime] = mapped_column(nullable=True)
    status: Mapped[Status] = mapped_column(
        SQLEnum(Status), nullable=False, default=Status.BORROWED
    )
    user: Mapped["User"] = relationship(back_populates="borrow_records")
    book: Mapped["Book"] = relationship(back_populates="borrow_records")
