"""Air quality endpoints: current AQI, stations, and multi-day forecast."""
from __future__ import annotations

from fastapi import APIRouter, Query
from app.services.station_service import get_all_stations, get_current_air_quality
from app.services.forecast_service import get_air_forecast

router = APIRouter(prefix="/air", tags=["Air Quality"])


@router.get("/current")
async def get_current_air(
    lat: float | None = Query(None, description="Latitude"),
    lng: float | None = Query(None, description="Longitude"),
    city: str | None = Query(None, description="Target city name"),
):
    """Retrieve verified CPCB air quality and all active pollutant concentrations."""
    data = get_current_air_quality(latitude=lat, longitude=lng, city=city)
    return {"success": True, "data": data}


@router.get("/stations")
async def list_monitoring_stations(
    city: str | None = Query(None, description="Filter by city"),
):
    """List all official CPCB / State PCB monitoring stations."""
    stations = get_all_stations(city=city)
    return {"success": True, "data": stations, "count": len(stations)}


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(28.6508, description="Latitude"),
    lng: float = Query(77.3152, description="Longitude"),
    days: int = Query(3, ge=1, le=5, description="Forecast days"),
):
    """Get hourly forecasted air quality trends and meteorological context."""
    forecast = await get_air_forecast(latitude=lat, longitude=lng, days=days)
    return {"success": True, "data": forecast}
