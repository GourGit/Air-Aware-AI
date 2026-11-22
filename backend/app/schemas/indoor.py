"""Indoor air advisor schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class IndoorGuidanceResponse(BaseModel):
    ventilation_status: str
    ventilation_advice: str
    air_purifier_guidance: str
    cooking_advice: str
    dust_control_advice: str
    outdoor_aqi_comparison: dict
    limitations: str


class IndoorAssessmentRequest(BaseModel):
    rooms_count: int = Field(default=2, ge=1)
    has_air_purifier: bool = False
    purifier_filter_age_months: int | None = None
    cooking_fuel_type: str = "lpg"  # lpg, induction, biomass
    has_smokers: bool = False
    has_pets: bool = False
    has_children_or_elderly: bool = False
    natural_ventilation_frequency: str = "daily"  # rare, daily, continuous


class IndoorAssessmentResponse(BaseModel):
    overall_indoor_score: int = Field(ge=0, le=100)
    risk_level: str  # Low, Moderate, Elevated, High
    strengths: list[str]
    vulnerabilities: list[str]
    actionable_checklist: list[dict]
    filter_replacement_due: bool = False
