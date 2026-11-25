"""Air quality data ingestion and provider integrations."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
import httpx

from app.services.aqi_service import calculate_cpcb_aqi, POLLUTANT_UNITS, AVERAGING_PERIODS

logger = logging.getLogger(__name__)

# OpenAQ API Configuration
OPENAQ_API_URL = "https://api.openaq.org/v2"
OPENAQ_API_KEY = ""  # Set via environment variable if available

# CPCB does not have a public API; we rely on OpenAQ which aggregates CPCB/SPCB data
# and Open-Meteo for forecasts


async def fetch_openaq_measurements(
    latitude: float,
    longitude: float,
    radius_km: float = 50,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Fetch latest measurements from OpenAQ for given coordinates.

    OpenAQ aggregates data from multiple sources including CPCB, SPCBs, US EPA, etc.
    We filter for Indian stations and CPCB/SPCB sources.

    Args:
        latitude: Latitude of target location
        longitude: Longitude of target location
        radius_km: Search radius in kilometers
        limit: Maximum number of locations to return

    Returns:
        List of measurement data from OpenAQ
    """
    params = {
        "coordinates": f"{latitude},{longitude}",
        "radius": radius_km * 1000,  # OpenAQ uses meters
        "limit": limit,
        "order_by": "lastUpdated",
        "sort": "desc",
        "country": "IN",  # India only
    }

    headers = {}
    if OPENAQ_API_KEY:
        headers["X-API-Key"] = OPENAQ_API_KEY

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{OPENAQ_API_URL}/latest", params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        logger.info("Fetched %d locations from OpenAQ near %.4f,%.4f", len(results), latitude, longitude)
        return results

    except httpx.HTTPStatusError as e:
        logger.warning("OpenAQ HTTP error: %s", e.response.status_code)
        return []
    except Exception as e:
        logger.warning("Failed to fetch OpenAQ measurements: %s", e)
        return []


def transform_openaq_to_cpcb(openaq_data: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Transform OpenAQ measurements to CPCB-compatible pollutant concentrations.

    Args:
        openaq_data: Raw OpenAQ latest measurements response

    Returns:
        Dict with pollutant concentrations and metadata, or None if insufficient data
    """
    if not openaq_data:
        return None

    # Find the most recent measurement with sufficient pollutants
    for location in openaq_data:
        measurements = location.get("measurements", [])
        if not measurements:
            continue

        # Extract pollutant values
        conc: dict[str, float] = {}
        measurement_meta: dict[str, dict] = {}

        for m in measurements:
            param = m.get("parameter", "").lower()
            value = m.get("value")
            unit = m.get("unit", "")
            last_updated = m.get("lastUpdated")

            if value is None:
                continue

            # Map OpenAQ parameter names to CPCB pollutant keys
            param_map = {
                "pm25": "pm25",
                "pm10": "pm10",
                "no2": "no2",
                "so2": "so2",
                "co": "co",
                "o3": "o3",
                "nh3": "nh3",
            }

            cpcb_param = param_map.get(param)
            if cpcb_param and isinstance(value, (int, float)):
                # Convert units if needed (OpenAQ typically uses µg/m³ for particulates, ppm for gases)
                if cpcb_param == "co" and unit == "ppm":
                    # 1 ppm CO ≈ 1.145 mg/m³ at 25°C
                    value = value * 1.145
                elif cpcb_param in ("no2", "so2", "o3") and unit == "ppm":
                    # 1 ppm ≈ 1880 µg/m³ for NO2, 2620 µg/m³ for SO2, 1960 µg/m³ for O3 (at 25°C)
                    # OpenAQ usually provides in µg/m³ already, but handle ppm just in case
                    pass

                conc[cpcb_param] = float(value)
                measurement_meta[cpcb_param] = {
                    "value": float(value),
                    "unit": POLLUTANT_UNITS.get(cpcb_param, unit),
                    "source": location.get("sourceName", "OpenAQ"),
                    "location": location.get("name", "Unknown"),
                    "coordinates": location.get("coordinates", {}),
                    "last_updated": last_updated,
                    "averaging_period_hours": AVERAGING_PERIODS.get(cpcb_param),
                }

        if len(conc) >= 2:  # At least 2 pollutants to attempt calculation
            cpcb_result = calculate_cpcb_aqi(conc)
            return {
                "pollutants": conc,
                "sub_indices": cpcb_result.get("sub_indices", {}),
                "aqi": cpcb_result.get("aqi"),
                "category": cpcb_result.get("category"),
                "color": cpcb_result.get("color"),
                "prominent_pollutant": cpcb_result.get("prominent_pollutant"),
                "is_standard_met": cpcb_result.get("is_standard_met"),
                "status": cpcb_result.get("status"),
                "metadata": measurement_meta,
                "source": "OpenAQ (aggregated CPCB/SPCB/other)",
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
            }

    return None


async def get_live_air_quality_from_openaq(
    latitude: float,
    longitude: float,
) -> dict[str, Any] | None:
    """Get live air quality from OpenAQ for given coordinates.

    This is the primary production data source when CPCB direct API is unavailable.

    Returns:
        Air quality data dict or None if unavailable
    """
    openaq_data = await fetch_openaq_measurements(latitude, longitude)
    return transform_openaq_to_cpcb(openaq_data)


async def get_air_quality_for_city(
    city: str,
    known_coordinates: dict[str, tuple[float, float]],
) -> dict[str, Any] | None:
    """Get air quality for a known city using its coordinates."""
    coords = known_coordinates.get(city.lower())
    if not coords:
        return None
    return await get_live_air_quality_from_openaq(coords[0], coords[1])