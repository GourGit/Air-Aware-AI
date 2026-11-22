"""Daily routine and routine-item models."""

from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DailyRoutine(Base):
    """A user's named daily routine template."""

    __tablename__ = "daily_routines"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    items: Mapped[list["RoutineItem"]] = relationship(
        "RoutineItem", back_populates="routine", lazy="selectin",
        cascade="all, delete-orphan",
    )


class RoutineItem(Base):
    """Individual activity within a daily routine."""

    __tablename__ = "routine_items"

    routine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("daily_routines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activity: Mapped[str] = mapped_column(String(200), nullable=False)
    location_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # indoor / outdoor
    start_time: Mapped[str | None] = mapped_column(String(10), nullable=True)  # HH:MM
    end_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    routine: Mapped["DailyRoutine"] = relationship("DailyRoutine", back_populates="items")
