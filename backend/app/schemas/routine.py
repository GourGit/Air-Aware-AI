"""Daily routine schemas."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class RoutineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    time_period: str
    title: str
    recommendation: str
    environmental_reason: str
    is_completed: bool = False
    completed_at: datetime | None = None
    order_index: int = 0


class DailyRoutineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    target_date: date
    headline: str
    summary: str
    aqi_context: dict
    status: str
    items: list[RoutineItemResponse] = []
    created_at: datetime
    updated_at: datetime


class GenerateRoutineRequest(BaseModel):
    target_date: date = Field(default_factory=date.today)
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    custom_activities: list[str] = []
