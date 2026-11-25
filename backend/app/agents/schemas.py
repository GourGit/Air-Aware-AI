"""Pydantic schemas for LangGraph agent inputs and outputs.

These define the structured contracts between agents and tools.
"""

from __future__ import annotations

from typing import Any, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ─── Intent Classification ────────────────────────────────────────────

class IntentClassification(BaseModel):
    """Orchestrator intent classification output."""
    intent: Literal[
        "air_quality_inquiry",
        "routine_planning", 
        "indoor_air_advice",
        "mobility_guidance",
        "impact_inquiry",
        "general_environmental_query"
    ]
    confidence: float = Field(ge=0.0, le=1.0)
    required_agents: list[str]
    reasoning: str


# ─── AQI Agent Schemas ──────────────────────────────────────────────

class AQIAgentInput(BaseModel):
    """Input for AQI agent."""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    include_historical: bool = False
    include_forecast: bool = False
    historical_hours: int = 24
    forecast_days: int = 3


class PollutantData(BaseModel):
    value: Optional[float] = None
    unit: str
    sub_index: Optional[int] = None


class AQIAgentOutput(BaseModel):
    """Structured AQI agent output."""
    aqi: Optional[int] = None
    category: str
    color: str
    prominent_pollutant: Optional[str] = None
    station_name: str
    station_distance_km: Optional[float] = None
    is_standard_met: bool
    status: Literal["live", "demo", "unavailable", "estimated_incomplete_data"]
    health_summary: str
    pollutants: dict[str, PollutantData] = Field(default_factory=dict)
    data_source: str
    observed_at: Optional[str] = None
    retrieved_at: str
    data_freshness: Literal["fresh", "recent", "aging", "stale", "unknown"]
    is_demo: bool
    historical_data: Optional[list[dict[str, Any]]] = None
    forecast_data: Optional[list[dict[str, Any]]] = None


# ─── Routine Agent Schemas ──────────────────────────────────────────

class RoutineItem(BaseModel):
    period: Literal["morning", "commute", "work", "afternoon", "evening", "night"]
    title: str
    recommendation: str
    reason: str
    aqi_context: Optional[int] = None


class RoutineAgentInput(BaseModel):
    """Input for routine planning agent."""
    aqi: Optional[int]
    category: str
    user_preferences: Optional[dict[str, Any]] = None
    location_context: Optional[dict[str, Any]] = None


class RoutineAgentOutput(BaseModel):
    headline: str
    schedule: list[RoutineItem]
    aqi_at_planning: Optional[int]
    disclaimer: str = "Recommendations based on ambient outdoor AQI; personal exposure may vary."


# ─── Indoor Agent Schemas ───────────────────────────────────────────

class IndoorAgentInput(BaseModel):
    """Input for indoor air agent."""
    outdoor_aqi: Optional[int]
    outdoor_category: str
    user_context: Optional[dict[str, Any]] = None  # has_purifier, cooking_type, etc.


class IndoorAgentOutput(BaseModel):
    ventilation_status: Literal["Restricted", "Recommended", "Conditional"]
    ventilation_advice: str
    purifier_guidance: str
    cooking_advice: str
    dust_advice: str
    humidity_advice: Optional[str] = None
    filtration_advice: Optional[str] = None
    data_source: str = "General guidance based on outdoor AQI; not from indoor sensors"


# ─── Mobility Agent Schemas ─────────────────────────────────────────

class MobilityComparison(BaseModel):
    mode: str
    mode_name: str
    distance_km: float
    travel_time_est_mins: int
    co2e_emissions_kg: float
    co2e_saved_vs_car_kg: float
    health_exposure_rating: Literal["Low", "Medium", "High"]
    caloric_burn_kcal: int


class MobilityAgentInput(BaseModel):
    """Input for mobility agent."""
    distance_km: float
    origin: str
    destination: str
    passengers: int = 1
    user_preferences: Optional[dict[str, Any]] = None


class MobilityAgentOutput(BaseModel):
    comparisons: list[MobilityComparison]
    top_sustainable_choice: str
    co2e_saved_potential_kg: float
    distance_analyzed_km: float
    baseline_mode: str = "private_car_petrol"
    emission_factors_source: str = "ARAI & CEA 2024 Passenger Grid Baseline"
    limitations: str = "Calculations are deterministic estimates; actual emissions vary by vehicle, occupancy, traffic, and grid mix."


# ─── Impact Agent Schemas ───────────────────────────────────────────

class ImpactAgentInput(BaseModel):
    """Input for impact agent."""
    user_id: str
    period_days: Optional[int] = None


class ImpactAgentOutput(BaseModel):
    total_co2e_saved_kg: float
    total_sustainable_km: float
    total_trips_logged: int
    tier: str
    methodology: str
    data_coverage: str
    assumptions: list[str] = Field(default_factory=list)
    calculation_date: str = Field(default_factory=lambda: datetime.now().isoformat())


# ─── Safety Agent Schemas ───────────────────────────────────────────

class SafetyValidation(BaseModel):
    is_safe: bool
    contains_medical_query: bool
    disclaimer_applied: bool
    data_provenance_verified: bool
    data_freshness_ok: bool
    numerical_consistency_ok: bool
    unsupported_claims: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class SafetyAgentInput(BaseModel):
    """Input for safety validation agent."""
    user_message: str
    agent_outputs: dict[str, Any]
    environmental_context: dict[str, Any]


class SafetyAgentOutput(BaseModel):
    validation: SafetyValidation
    disclaimer: str


# ─── Synthesizer Schemas ────────────────────────────────────────────

class SynthesizerInput(BaseModel):
    """Input for response synthesizer."""
    intent: str
    user_message: str
    aqi_output: Optional[AQIAgentOutput] = None
    routine_output: Optional[RoutineAgentOutput] = None
    indoor_output: Optional[IndoorAgentOutput] = None
    mobility_output: Optional[MobilityAgentOutput] = None
    impact_output: Optional[ImpactAgentOutput] = None
    safety_output: Optional[SafetyAgentOutput] = None
    source_references: list[str] = Field(default_factory=list)
    executed_agents: list[str] = Field(default_factory=list)


class SynthesizerOutput(BaseModel):
    answer: str
    intent: str
    supporting_data: dict[str, Any]
    recommendations: list[str]
    limitations: str
    sources: list[str]
    observed_at: str
    agents_used: list[str]


# ─── Tool Schemas ───────────────────────────────────────────────────

class CurrentAQIToolInput(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None


class HistoricalAQIToolInput(BaseModel):
    station_id: str
    hours: int = 24


class ForecastAQIToolInput(BaseModel):
    latitude: float
    longitude: float
    days: int = 3


class LocationLookupToolInput(BaseModel):
    query: str


class UserProfileToolInput(BaseModel):
    user_id: str


class EmissionComparisonToolInput(BaseModel):
    distance_km: float
    origin: str
    destination: str
    passengers: int = 1


class ImpactCalculationToolInput(BaseModel):
    user_id: str
    period_days: Optional[int] = None