from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid, func
from datetime import datetime
from uuid import uuid4, UUID


class UUIDMixin:
    id: Mapped[UUID] = mapped_column(Uuid, default=uuid4, primary_key=True)


class TimeMixin:
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )
