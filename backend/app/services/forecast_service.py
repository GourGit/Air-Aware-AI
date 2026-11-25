"""Open-Meteo Air Quality & Weather API Integration Service.

Fetches 5-day predictive forecasts and hourly meteorological dispersion context.

Forecast data is CLEARLY SEPARATED from observed measurements.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
import httpx

from app.services.aqi_service import calculate_cpcb_aqi, POLLUTANT_UNITS, AVERAGING_PERIODS

logger = logging.getLogger(__name__)

OPEN_METEO_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


async def get_air_forecast(
    latitude: float,
    longitude: float,
    days: int = 3,
) -> list[dict[str, Any]]:
    """Fetch hourly pollutant forecast and map into projected CPCB AQI.

    Returns FORECAST data only - clearly marked as predictions, not observations.

    Args:
        latitude: Target latitude
        longitude: Target longitude
        days: Number of forecast days (1-5)

    Returns:
        List of hourly forecast points with predicted AQI
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
        "forecast_days": min(days, 5),
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(OPEN_METEO_AIR_QUALITY_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        pm25_vals = hourly.get("pm2_5", [])
        pm10_vals = hourly.get("pm10", [])
        no2_vals = hourly.get("nitrogen_dioxide", [])
        so2_vals = hourly.get("sulphur_dioxide", [])
        co_vals = hourly.get("carbon_monoxide", [])
        o3_vals = hourly.get("ozone", [])

        if not times:
            logger.warning("Open-Meteo returned empty forecast data")
            return []

        forecast_points = []
        retrieval_time = datetime.now(timezone.utc).isoformat()

        # Sample every 3 hours for readable dashboard trends
        for idx in range(0, len(times), 3):
            time_str = times[idx]
            pol_map = {
                "pm25": pm25_vals[idx] if idx < len(pm25_vals) else None,
                "pm10": pm10_vals[idx] if idx < len(pm10_vals) else None,
                "no2": no2_vals[idx] if idx < len(no2_vals) else None,
                "so2": so2_vals[idx] if idx < len(so2_vals) else None,
                "co": (co_vals[idx] / 1000.0) if idx < len(co_vals) and co_vals[idx] is not None else None,  # µg/m³ to mg/m³
                "o3": o3_vals[idx] if idx < len(o3_vals) else None,
            }

            # Filter None values for AQI calculation
            valid_pol = {k: v for k, v in pol_map.items() if v is not None}
            cpcb_res = calculate_cpcb_aqi(valid_pol)

            forecast_points.append({
                "time": time_str,
                "predicted_aqi": cpcb_res["aqi"],
                "predicted_category": cpcb_res["category"],
                "color": cpcb_res["color"],
                "prominent_pollutant": cpcb_res["prominent_pollutant"],
                "is_standard_met": cpcb_res["is_standard_met"],
                "pm25": pol_map.get("pm25"),
                "pm10": pol_map.get("pm10"),
                "no2": pol_map.get("no2"),
                "so2": pol_map.get("so2"),
                "co": pol_map.get("co"),
                "o3": pol_map.get("o3"),
                "source": "Open-Meteo European CAMS / ECMWF Ensemble",
                "data_type": "forecast",
                "model": "CAMS-European-AQ-Forecast",
                "retrieved_at": retrieval_time,
                "forecast_valid_at": time_str,
                "averaging_period_hours": AVERAGING_PERIODS,
                "pollutant_units": POLLUTANT_UNITS,
            })

        return forecast_points

    except httpx.HTTPStatusError as e:
        logger.warning("Open-Meteo HTTP error: %s", e.response.status_code)
        return []
    except Exception as exc:
        logger.warning("Failed to fetch Open-Meteo forecast: %s", exc)
        return []


async def get_weather_forecast(
    latitude: float,
    longitude: float,
    days: int = 3,
) -> list[dict[str, Any]]:
    """Fetch meteorological forecast for dispersion context.

    Returns wind, temperature, humidity, precipitation forecasts.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl",
        "forecast_days": min(days, 7),
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])

        weather_points = []
        for idx in range(0, len(times), 3):  # Every 3 hours
            weather_points.append({
                "time": times[idx] if idx < len(times) else None,
                "temperature_c": hourly.get("temperature_2m", [None])[idx] if idx < len(hourly.get("temperature_2m", [])) else None,
                "humidity_percent": hourly.get("relative_humidity_2m", [None])[idx] if idx < len(hourly.get("relative_humidity_2m", [])) else None,
                "wind_speed_kmh": hourly.get("wind_speed_10m", [None])[idx] if idx < len(hourly.get("wind_speed_10m", [])) else None,
                "wind_direction_deg": hourly.get("wind_direction_10m", [None])[idx] if idx < len(hourly.get("wind_direction_10m", [])) else None,
                "precipitation_mm": hourly.get("precipitation", [None])[idx] if idx < len(hourly.get("precipitation", [])) else None,
                "pressure_hpa": hourly.get("pressure_msl", [None])[idx] if idx < len(hourly.get("pressure_msl", [])) else None,
                "data_type": "weather_forecast",
                "source": "Open-Meteo ECMWF IFS",
            })

        return weather_points

    except Exception as exc:
        logger.warning("Failed to fetch weather forecast: %s", exc)
        return []


def get_forecast_quality_assessment(forecast_points: list[dict]) -> dict[str, Any]:
    """Assess forecast quality and provide limitations."""
    if not forecast_points:
        return {
            "available": False,
            "reason": "No forecast data available from provider",
            "limitation": "Cannot provide air quality forecast at this time",
        }

    # Check how many hours have valid data
    valid_count = sum(1 for p in forecast_points if p.get("predicted_aqi") is not None)
    total_count = len(forecast_points)

    return {
        "available": True,
        "data_points": total_count,
        "valid_predictions": valid_count,
        "coverage_ratio": round(valid_count / total_count, 2) if total_count > 0 else 0,
        "model": "CAMS-European-AQ-Forecast",
        "limitations": [
            "Forecasts are predictions, not observations",
            "Accuracy decreases beyond 48 hours",
            "Local microclimate effects not captured",
            "Model resolution ~10km, may not reflect street-level conditions",
        ],
    }