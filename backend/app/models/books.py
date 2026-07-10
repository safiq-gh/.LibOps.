from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint, Text
from app.db.base import Base
from app.models.mixins import UUIDMixin, TimeMixin

if TYPE_CHECKING:
    from app.models.borrowrecord import BorrowRecord


class Book(UUIDMixin, TimeMixin, Base):
    __tablename__ = "books"
    __table_args__ = (
        CheckConstraint(
            "available_copies >= 0 AND available_copies <= total_copies",
            name="ck_available_copies",
        ),
        CheckConstraint("total_copies >= 0", name="ck_total_copies"),
        CheckConstraint(
            "published_year > 0",
            name="ck_published_year",
        ),
    )
    borrow_records: Mapped[list["BorrowRecord"]] = relationship(back_populates="book", cascade="all, delete-orphan")
    isbn: Mapped[str] = mapped_column(nullable=False, unique=True)
    title: Mapped[str] = mapped_column(nullable=False)
    author: Mapped[str] = mapped_column(nullable=False)
    publisher: Mapped[str] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    published_year: Mapped[int] = mapped_column(nullable=False)
    cover_image_url: Mapped[str] = mapped_column(nullable=True)
    total_copies: Mapped[int] = mapped_column(nullable=False)
    available_copies: Mapped[int] = mapped_column(nullable=False)



