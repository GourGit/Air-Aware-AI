"""User profile model — extended personal & commute info."""

from __future__ import annotations

import uuid

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserProfile(Base):
    """Extended user profile (one-to-one with User)."""

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_location_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    preferred_location_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    commute_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    commute_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    outdoor_activity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notification_prefs: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)
    household_context: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=dict)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")  # type: ignore[name-defined]
