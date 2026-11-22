"""User profile schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UserProfileUpdate(BaseModel):
    """Fields a user may update on their profile."""

    city: str | None = None
    preferred_location_lat: float | None = Field(None, ge=-90, le=90)
    preferred_location_lng: float | None = Field(None, ge=-180, le=180)
    occupation: str | None = None
    commute_type: str | None = None
    commute_duration: int | None = Field(None, ge=0, description="Minutes")
    outdoor_activity: str | None = None
    notification_prefs: dict[str, Any] | None = None
    household_context: dict[str, Any] | None = None


class UserProfileResponse(BaseModel):
    """Full profile read-back."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    city: str | None = None
    preferred_location_lat: float | None = None
    preferred_location_lng: float | None = None
    occupation: str | None = None
    commute_type: str | None = None
    commute_duration: int | None = None
    outdoor_activity: str | None = None
    notification_prefs: dict[str, Any] | None = None
    household_context: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime
