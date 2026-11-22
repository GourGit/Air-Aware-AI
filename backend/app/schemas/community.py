"""Community pollution intelligence schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CommunityReportCreate(BaseModel):
    category: str = Field(description="smoke, dust, waste_burning, traffic, industrial, other")
    description: str = Field(min_length=10, max_length=1000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    approx_location_name: str = Field(min_length=2, max_length=255)
    image_url: str | None = None
    observed_at: datetime = Field(default_factory=datetime.utcnow)


class CommunityReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: str
    description: str
    latitude: float
    longitude: float
    approx_location_name: str
    image_url: str | None
    status: str
    observed_at: datetime
    created_at: datetime


class ReportModerationRequest(BaseModel):
    decision: str = Field(description="approved, rejected, flagged")
    notes: str | None = None
