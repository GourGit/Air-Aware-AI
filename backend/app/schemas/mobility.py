"""Sustainable mobility schemas."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class TransportComparisonItem(BaseModel):
    mode: str
    mode_name: str
    distance_km: float
    travel_time_est_mins: int
    co2e_emissions_kg: float
    co2e_saved_vs_car_kg: float
    health_exposure_rating: str  # Low, Medium, High
    caloric_burn_kcal: int = 0


class MobilityCompareRequest(BaseModel):
    origin: str
    destination: str
    distance_km: float = Field(gt=0)
    passengers: int = Field(default=1, ge=1)


class MobilityCompareResponse(BaseModel):
    origin: str
    destination: str
    distance_km: float
    comparisons: list[TransportComparisonItem]
    recommendation: str
    emission_factors_source: str = "IPCC & ARAI India 2024"


class MobilityRecordCreate(BaseModel):
    origin: str
    destination: str
    distance_km: float
    mode_chosen: str
    mode_baseline: str = "private_car_petrol"
    trip_date: date = Field(default_factory=date.today)


class MobilityRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    origin: str
    destination: str
    distance_km: float
    mode_chosen: str
    emissions_actual_kg: float
    emissions_saved_kg: float
    trip_date: date
    created_at: datetime
