"""Air quality data schemas (CPCB AQI standard)."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PollutantData(BaseModel):
    """Individual pollutant reading."""

    pollutant: str = Field(description="e.g. PM2.5, PM10, NO2, SO2, O3, CO")
    value: float
    unit: str = "µg/m³"
    sub_index: int | None = Field(None, description="CPCB sub-index for this pollutant")


class StationResponse(BaseModel):
    """Monitoring station metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    city: str
    state: str | None = None
    latitude: float
    longitude: float
    source: str | None = None
    is_active: bool = True


class AirQualityResponse(BaseModel):
    """Current or historical AQI reading."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    station_id: uuid.UUID
    aqi: int = Field(description="Overall CPCB AQI value")
    category: str = Field(description="e.g. Good, Satisfactory, Moderate, Poor, Very Poor, Severe")
    dominant_pollutant: str | None = None
    pollutants: list[PollutantData] = []
    measured_at: datetime
    created_at: datetime


class ForecastResponse(BaseModel):
    """Predicted AQI for a future time window."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    location_id: uuid.UUID
    forecast_date: datetime
    predicted_aqi: int
    predicted_category: str
    confidence: float = Field(ge=0, le=1, description="Model confidence 0-1")
    model_version: str | None = None
    created_at: datetime
