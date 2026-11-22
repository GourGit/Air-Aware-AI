"""Personal environmental impact schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ImpactSummaryResponse(BaseModel):
    total_co2e_saved_kg: float
    total_sustainable_km: float
    total_trips_logged: int
    total_exposure_points: int
    current_tier: str
    mode_distribution: dict[str, float]
    weekly_savings_kg: list[dict]
    recent_milestones: list[str]


class ImpactRecordCreate(BaseModel):
    category: str
    action_name: str
    co2e_saved_kg: float = 0.0
    exposure_points: int = 10


class ImpactRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: str
    action_name: str
    co2e_saved_kg: float
    exposure_points: int
    logged_at: datetime
