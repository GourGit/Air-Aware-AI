"""Notifications schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    message: str
    type: str
    severity: str
    is_read: bool
    created_at: datetime


class NotificationPreferenceUpdate(BaseModel):
    aqi_threshold: int = Field(default=200, ge=50, le=500)
    daily_summary_time: str = Field(default="07:30", pattern=r"^\d{2}:\d{2}$")
    notify_routine: bool = True
    notify_indoor_maintenance: bool = True


class NotificationPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    aqi_threshold: int
    daily_summary_time: str
    notify_routine: bool
    notify_indoor_maintenance: bool
