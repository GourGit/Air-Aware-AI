"""Air quality endpoints: current AQI, stations, and multi-day forecast."""

from __future__ import annotations

import json
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, _redis_pool
from app.services.station_service import get_all_stations, get_current_air_quality
from app.services.forecast_service import get_air_forecast, get_forecast_quality_assessment
from app.services.historical_service import get_historical_measurements
from app.config import get_settings

router = APIRouter(prefix="/air", tags=["Air Quality"])


@router.get("/current")
async def get_current_air(
    lat: float | None = Query(None, description="Latitude"),
    lng: float | None = Query(None, description="Longitude"),
    city: str | None = Query(None, description="Target city name"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve verified CPCB air quality and all active pollutant concentrations.

    Returns live data from OpenAQ (aggregating CPCB/SPCB stations) when available.
    In development/demo mode, returns clearly labeled demo data when live data unavailable.
    """
    settings = get_settings()
    use_demo = settings.is_development

    cache_key = f"air:current:{city or 'default'}:{lat}:{lng}"
    if _redis_pool is not None:
        try:
            cached = await _redis_pool.get(cache_key)
            if cached:
                cached_data = json.loads(cached) if isinstance(cached, str) else json.loads(cached.decode("utf-8"))
                cached_data["_from_cache"] = True
                return {"success": True, "data": cached_data}
        except Exception:
            pass

    data = await get_current_air_quality(
        db=db,
        latitude=lat,
        longitude=lng,
        city=city,
        use_demo=use_demo,
    )

    if _redis_pool is not None:
        try:
            await _redis_pool.set(cache_key, json.dumps(data), ex=60)
        except Exception:
            pass

    return {"success": True, "data": data}


@router.get("/stations")
async def list_monitoring_stations(
    city: str | None = Query(None, description="Filter by city"),
    db: AsyncSession = Depends(get_db),
):
    """List all monitoring stations with current status.

    Returns stations from database with live OpenAQ data when available.
    In development mode, includes clearly labeled demo stations.
    """
    settings = get_settings()
    use_demo = settings.is_development

    stations = await get_all_stations(db, city=city, use_demo=use_demo)
    return {"success": True, "data": stations, "count": len(stations)}


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(28.6508, description="Latitude"),
    lng: float = Query(77.3152, description="Longitude"),
    days: int = Query(3, ge=1, le=5, description="Forecast days"),
):
    """Get hourly forecasted air quality trends and meteorological context.

    Returns PREDICTED values only - clearly marked as forecasts.
    Uses Open-Meteo CAMS European air quality forecast model.
    """
    forecast = await get_air_forecast(latitude=lat, longitude=lng, days=days)
    quality = get_forecast_quality_assessment(forecast)

    return {
        "success": True,
        "data": {
            "forecast": forecast,
            "quality_assessment": quality,
            "note": "Forecast data is predictive and should not be treated as observed measurements",
        },
    }


@router.get("/health")
async def air_quality_health_check():
    """Health check for air quality data pipeline."""
    settings = get_settings()
    return {
        "success": True,
        "data": {
            "demo_mode": settings.is_development,
            "data_sources": {
                "live": "OpenAQ (aggregates CPCB/SPCB/other)",
                "forecast": "Open-Meteo CAMS",
            },
            "cpcb_standard": "IN_CPCB",
        },
    }


@router.get("/history/{station_id}")
async def get_station_history(
    station_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours of history"),
    db: AsyncSession = Depends(get_db),
):
    """Get historical measurements for a specific station."""
    history = await get_historical_measurements(db, station_id, hours)
    return {"success": True, "data": history, "count": len(history)}