"""Tool implementations for LangGraph agents.

These connect agents to actual backend services.
"""

from __future__ import annotations

from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.station_service import (
    get_current_air_quality,
    find_best_station,
)
from app.services.forecast_service import get_air_forecast
from app.services.historical_service import get_historical_measurements
from app.services.emission_service import compare_transport_modes
from app.repositories import ImpactRepository, UserRepository
from app.models.user import User


async def get_current_aqi_tool(
    db: AsyncSession,
    latitude: float | None = None,
    longitude: float | None = None,
    city: str | None = None,
) -> dict[str, Any]:
    """Fetch current air quality from live data sources."""
    return await get_current_air_quality(
        db=db,
        latitude=latitude,
        longitude=longitude,
        city=city,
        use_demo=True,  # Will use demo data if live unavailable
    )


async def get_historical_aqi_tool(
    db: AsyncSession,
    station_id: str,
    hours: int = 24,
) -> list[dict[str, Any]]:
    """Fetch historical measurements for a station."""
    return await get_historical_measurements(db, station_id, hours)


async def get_forecast_aqi_tool(
    latitude: float,
    longitude: float,
    days: int = 3,
) -> list[dict[str, Any]]:
    """Fetch forecast from Open-Meteo."""
    return await get_air_forecast(latitude, longitude, days)


async def get_emission_comparison_tool(
    distance_km: float,
    origin: str,
    destination: str,
    passengers: int = 1,
) -> list[dict[str, Any]]:
    """Calculate deterministic emission comparisons."""
    return compare_transport_modes(
        distance_km=distance_km,
        origin=origin,
        destination=destination,
        passengers=passengers,
    )


async def calculate_user_impact_tool(
    db: AsyncSession,
    user_id: str,
    period_days: int | None = None,
) -> dict[str, Any]:
    """Calculate user's actual environmental impact from logged activities."""
    repo = ImpactRepository(db)
    
    total_co2 = await repo.get_total_co2_saved(user_id)
    total_km = await repo.get_total_sustainable_km(user_id)
    total_trips = await repo.get_total_trips(user_id)
    completed_actions = await repo.get_completed_actions_count(user_id)
    
    co2_kg = total_co2 / 1000.0
    
    if co2_kg >= 100:
        tier = "Urban Climate Champion (Gold)"
    elif co2_kg >= 50:
        tier = "Urban Climate Champion (Silver)"
    elif co2_kg >= 20:
        tier = "Urban Climate Champion (Bronze)"
    else:
        tier = "Eco Starter"
    
    return {
        "total_co2e_saved_kg": round(co2_kg, 1),
        "total_sustainable_km": round(total_km, 1),
        "total_trips_logged": total_trips,
        "tier": tier,
        "methodology": "ARAI & CEA 2024 Passenger Grid Baseline",
        "data_coverage": "All logged sustainable trips",
        "assumptions": [
            "Baseline comparison uses single-occupant petrol car",
            "Metro emissions use Indian grid average (CEA)",
            "Walking/cycling assumed zero tailpipe emissions",
        ],
    }


async def get_user_profile_tool(
    db: AsyncSession,
    user_id: str,
) -> dict[str, Any] | None:
    """Fetch user profile for personalization."""
    repo = UserRepository(db)
    profile = await repo.get_user_profile(user_id)
    user = await repo.get_user_by_id(user_id)
    
    if not profile and not user:
        return None
    
    return {
        "user_id": str(user.id) if user else user_id,
        "city": profile.city if profile else None,
        "preferred_location": {
            "lat": profile.preferred_location_lat if profile else None,
            "lng": profile.preferred_location_lng if profile else None,
        } if profile else None,
        "occupation": profile.occupation if profile else None,
        "commute_type": profile.commute_type if profile else None,
        "commute_duration": profile.commute_duration if profile else None,
        "outdoor_activity": profile.outdoor_activity if profile else None,
        "household_context": profile.household_context if profile else {},
    }


async def find_station_tool(
    db: AsyncSession,
    latitude: float | None = None,
    longitude: float | None = None,
    city: str | None = None,
) -> dict[str, Any] | None:
    """Find best monitoring station for location."""
    return await find_best_station(db, latitude, longitude, city, use_demo=True)