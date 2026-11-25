"""Historical air quality data service."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.air_quality import AirMeasurement, AirQualitySummary


async def get_historical_measurements(
    db: AsyncSession,
    station_id: str,
    hours: int = 24,
) -> list[dict[str, Any]]:
    """Get historical measurements for a station.

    Args:
        db: Database session
        station_id: Station UUID
        hours: Number of hours of history to retrieve

    Returns:
        List of hourly measurement points
    """
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    query = select(AirMeasurement).where(
        AirMeasurement.station_id == station_id,
        AirMeasurement.measured_at >= since,
    ).order_by(AirMeasurement.measured_at)

    result = await db.execute(query)
    measurements = result.scalars().all()

    return [
        {
            "time": m.measured_at.isoformat(),
            "aqi": m.aqi,
            "category": m.category,
            "pm25": m.pm25,
            "pm10": m.pm10,
            "no2": m.no2,
            "so2": m.so2,
            "co": m.co,
            "o3": m.o3,
            "dominant_pollutant": m.dominant_pollutant,
        }
        for m in measurements
    ]


async def get_historical_summary(
    db: AsyncSession,
    location_id: str,
    period_type: str = "hourly",
    days: int = 7,
) -> list[dict[str, Any]]:
    """Get historical daily/hourly summaries for a location."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    query = select(AirQualitySummary).where(
        AirQualitySummary.location_id == location_id,
        AirQualitySummary.period_type == period_type,
        AirQualitySummary.period_start >= since,
    ).order_by(AirQualitySummary.period_start)

    result = await db.execute(query)
    summaries = result.scalars().all()

    return [
        {
            "period_start": s.period_start.isoformat(),
            "period_end": s.period_end.isoformat(),
            "avg_aqi": s.avg_aqi,
            "min_aqi": s.min_aqi,
            "max_aqi": s.max_aqi,
            "dominant_pollutant": s.dominant_pollutant,
            "category": s.category,
        }
        for s in summaries
    ]


async def store_measurement(
    db: AsyncSession,
    station_id: str,
    aqi: int,
    category: str,
    dominant_pollutant: str | None,
    pollutants: dict[str, float],
) -> AirMeasurement:
    """Store a new air quality measurement."""
    measurement = AirMeasurement(
        station_id=station_id,
        aqi=aqi,
        category=category,
        dominant_pollutant=dominant_pollutant,
        pm25=pollutants.get("pm25"),
        pm10=pollutants.get("pm10"),
        no2=pollutants.get("no2"),
        so2=pollutants.get("so2"),
        co=pollutants.get("co"),
        o3=pollutants.get("o3"),
        nh3=pollutants.get("nh3"),
        pollutant_data=pollutants,
        measured_at=datetime.now(timezone.utc),
    )
    db.add(measurement)
    await db.flush()
    await db.refresh(measurement)
    return measurement