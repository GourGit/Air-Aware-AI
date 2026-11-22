"""Geographical location schemas."""
from __future__ import annotations

import uuid
from pydantic import BaseModel, ConfigDict, Field


class LocationCreate(BaseModel):
    name: str
    city: str
    state: str
    country: str = "IN"
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    city: str
    state: str
    country: str
    latitude: float
    longitude: float
