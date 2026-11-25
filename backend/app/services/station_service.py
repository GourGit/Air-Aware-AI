"""Monitoring station registry and air quality data provider.

Uses database-persisted stations with live data from OpenAQ (CPCB/SPCB aggregator)
and falls back to seeded reference stations for development/demonstration.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import MonitoringStation
from app.services.aqi_service import calculate_cpcb_aqi, POLLUTANT_UNITS
from app.services.data_ingestion import get_live_air_quality_from_openaq

# Demo mode reference stations with realistic but clearly labeled sample data
# These are used ONLY when live data is unavailable AND demo mode is enabled
INDIAN_STATIONS = [
    {
        "id": "demo-dl-001",
        "name": "Anand Vihar, Delhi - DPCC (Demo)",
        "city": "Delhi",
        "state": "Delhi",
        "agency": "Delhi Pollution Control Committee (DPCC)",
        "latitude": 28.6508,
        "longitude": 77.3152,
        "source": "Official DPCC CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 178.0, "pm10": 292.0, "no2": 68.0, "so2": 19.5, "co": 1.9, "o3": 38.0, "nh3": 35.0},
    },
    {
        "id": "demo-dl-002",
        "name": "R K Puram, Delhi - DPCC (Demo)",
        "city": "Delhi",
        "state": "Delhi",
        "agency": "DPCC",
        "latitude": 28.5633,
        "longitude": 77.1864,
        "source": "Official DPCC CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 142.0, "pm10": 235.0, "no2": 52.0, "so2": 14.0, "co": 1.4, "o3": 44.0, "nh3": 28.0},
    },
    {
        "id": "demo-wb-001",
        "name": "Salt Lake Sector V, Kolkata - WBPCB (Demo)",
        "city": "Kolkata",
        "state": "West Bengal",
        "agency": "West Bengal Pollution Control Board (WBPCB)",
        "latitude": 22.5800,
        "longitude": 88.4370,
        "source": "Official WBPCB CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 88.0, "pm10": 145.0, "no2": 42.0, "so2": 11.2, "co": 0.85, "o3": 32.0, "nh3": 22.0},
    },
    {
        "id": "demo-mh-001",
        "name": "Bandra Kurla Complex (BKC), Mumbai - MPCB (Demo)",
        "city": "Mumbai",
        "state": "Maharashtra",
        "agency": "Maharashtra Pollution Control Board (MPCB)",
        "latitude": 19.0657,
        "longitude": 72.8683,
        "source": "Official MPCB CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 112.0, "pm10": 178.0, "no2": 48.0, "so2": 16.5, "co": 1.2, "o3": 36.0, "nh3": 25.0},
    },
    {
        "id": "demo-ka-001",
        "name": "Silk Board, Bengaluru - KSPCB (Demo)",
        "city": "Bengaluru",
        "state": "Karnataka",
        "agency": "Karnataka State Pollution Control Board",
        "latitude": 12.9172,
        "longitude": 77.6228,
        "source": "Official KSPCB CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 58.0, "pm10": 94.0, "no2": 34.0, "so2": 8.0, "co": 0.65, "o3": 28.0, "nh3": 18.0},
    },
    {
        "id": "demo-tn-001",
        "name": "Alandur, Chennai - TNPCB (Demo)",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "agency": "Tamil Nadu Pollution Control Board",
        "latitude": 13.0033,
        "longitude": 80.2016,
        "source": "Official TNPCB CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 42.0, "pm10": 74.0, "no2": 26.0, "so2": 7.2, "co": 0.52, "o3": 22.0, "nh3": 15.0},
    },
    {
        "id": "demo-up-001",
        "name": "Talkatora, Lucknow - UPPCB (Demo)",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "agency": "Uttar Pradesh Pollution Control Board",
        "latitude": 26.8322,
        "longitude": 80.8988,
        "source": "Official UPPCB CAAQMS (Demo Data)",
        "demo_pollutants": {"pm25": 164.0, "pm10": 265.0, "no2": 59.0, "so2": 18.2, "co": 1.6, "o3": 35.0, "nh3": 30.0},
    },
]


DEMO_STATIONS = INDIAN_STATIONS


async def get_stations_from_db(
    db: AsyncSession,
    city: str | None = None,
) -> list[dict[str, Any]]:
    """Retrieve stations from database."""
    query = select(MonitoringStation).where(MonitoringStation.is_active == True)
    if city:
        query = query.where(MonitoringStation.city.ilike(f"%{city}%"))
    result = await db.execute(query)
    stations = result.scalars().all()

    station_list = []
    for s in stations:
        station_list.append({
            "id": str(s.id),
            "name": s.name,
            "city": s.city,
            "state": s.state,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "source": s.source,
            "station_code": s.station_code,
        })
    return station_list


def get_demo_stations(city: str | None = None) -> list[dict[str, Any]]:
    """Get demo stations (for development/demonstration only)."""
    stations = []
    for s in DEMO_STATIONS:
        if city and city.lower() not in s["city"].lower():
            continue
        cpcb_res = calculate_cpcb_aqi(s["demo_pollutants"])
        stations.append({
            "id": s["id"],
            "name": s["name"],
            "city": s["city"],
            "state": s["state"],
            "agency": s["agency"],
            "latitude": s["latitude"],
            "longitude": s["longitude"],
            "aqi": cpcb_res["aqi"],
            "category": cpcb_res["category"],
            "color": cpcb_res["color"],
            "prominent_pollutant": cpcb_res["prominent_pollutant"],
            "pollutants": s["demo_pollutants"],
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "source": s["source"],
            "is_demo": True,
            "is_authoritative": False,
        })
    return stations


async def get_all_stations(
    db: AsyncSession | None = None,
    city: str | None = None,
    use_demo: bool = False,
) -> list[dict[str, Any]]:
    """Retrieve station list with current air quality status.

    Priority:
    1. Database stations with live OpenAQ data
    2. Demo stations (if use_demo=True)
    """
    stations = []

    # Try database first
    if db is not None:
        db_stations = await get_stations_from_db(db, city)
        for s in db_stations:
            # Try to get live data from OpenAQ
            live_data = await get_live_air_quality_from_openaq(s["latitude"], s["longitude"])
            if live_data and live_data.get("aqi") is not None:
                stations.append({
                    "id": s["id"],
                    "name": s["name"],
                    "city": s["city"],
                    "state": s["state"],
                    "latitude": s["latitude"],
                    "longitude": s["longitude"],
                    "source": s["source"],
                    "aqi": live_data["aqi"],
                    "category": live_data["category"],
                    "color": live_data["color"],
                    "prominent_pollutant": live_data["prominent_pollutant"],
                    "pollutants": {k: v for k, v in live_data["pollutants"].items() if v is not None},
                    "sub_indices": live_data.get("sub_indices", {}),
                    "last_updated": live_data.get("retrieved_at"),
                    "is_demo": False,
                    "is_authoritative": True,
                    "data_source": live_data.get("source", "OpenAQ"),
                    "metadata": live_data.get("metadata", {}),
                })
                continue

            # No live data - mark as unavailable
            stations.append({
                "id": s["id"],
                "name": s["name"],
                "city": s["city"],
                "state": s["state"],
                "latitude": s["latitude"],
                "longitude": s["longitude"],
                "source": s["source"],
                "aqi": None,
                "category": "Unavailable",
                "color": "#71818A",
                "prominent_pollutant": None,
                "pollutants": {},
                "last_updated": None,
                "is_demo": False,
                "is_authoritative": False,
                "data_source": "No live data available",
                "metadata": {},
            })

    # Fallback to demo stations if no DB stations or use_demo enabled
    if not stations or use_demo:
        demo = get_demo_stations(city)
        stations.extend(demo)

    return stations


async def find_best_station(
    db: AsyncSession | None,
    latitude: float | None,
    longitude: float | None,
    city: str | None,
    use_demo: bool = False,
) -> dict[str, Any] | None:
    """Find the best station for given location.

    Selection criteria:
    1. Exact city match preferred
    2. Geographic proximity (within 50km)
    3. Data availability (live > demo > unavailable)
    """
    stations = await get_all_stations(db, city, use_demo)

    if not stations:
        return None

    # Filter by city if specified
    if city:
        city_stations = [s for s in stations if s["city"].lower() == city.lower()]
        if city_stations:
            stations = city_stations

    # If coordinates provided, find nearest
    if latitude is not None and longitude is not None:
        def distance(st: dict) -> float:
            if st["latitude"] is None or st["longitude"] is None:
                return float("inf")
            return math.hypot(st["latitude"] - latitude, st["longitude"] - longitude)

        # Sort by distance and data quality (authoritative first)
        stations.sort(key=lambda s: (
            0 if s.get("is_authoritative") else (1 if s.get("is_demo") else 2),
            distance(s),
        ))
    else:
        # Sort by data quality only
        stations.sort(key=lambda s: (
            0 if s.get("is_authoritative") else (1 if s.get("is_demo") else 2),
        ))

    return stations[0] if stations else None


async def get_current_air_quality(
    db: AsyncSession | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    city: str | None = None,
    use_demo: bool = False,
) -> dict[str, Any]:
    """Get current air quality for a location.

    Returns structured response with full provenance metadata.
    """
    chosen_station = await find_best_station(db, latitude, longitude, city, use_demo)

    if not chosen_station:
        # No stations at all - return unavailable
        return {
            "location": {
                "name": "No Monitoring Station Available",
                "city": city or "Unknown",
                "state": "N/A",
                "latitude": latitude,
                "longitude": longitude,
                "station_id": None,
            },
            "air_quality": {
                "aqi": None,
                "category": "Unavailable",
                "color": "#71818A",
                "prominent_pollutant": None,
                "standard": "IN_CPCB",
                "status": "unavailable",
            },
            "pollutants": {},
            "health_advisory": {
                "summary": f"No CPCB/SPCB monitoring data available for {city or 'this location'}.",
                "precautions": ["Check network connection or select a supported monitoring city."],
            },
            "metadata": {
                "source": "No data source",
                "observed_at": None,
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "data_type": "unavailable",
                "is_stale": True,
                "station_distance_km": None,
            },
        }

    # Build pollutant details with sub-indices
    pollutants = {}
    raw_pollutants = chosen_station.get("pollutants", {})
    sub_indices = chosen_station.get("sub_indices", {})

    for pol, conc in raw_pollutants.items():
        if conc is not None:
            pollutants[pol] = {
                "value": conc,
                "unit": POLLUTANT_UNITS.get(pol, "µg/m³"),
                "sub_index": sub_indices.get(pol),
            }

    # Determine data status
    is_demo = chosen_station.get("is_demo", False)
    is_authoritative = chosen_station.get("is_authoritative", False)
    data_source = chosen_station.get("data_source", "Unknown")

    if is_authoritative:
        status = "live"
        data_type = "observed"
    elif is_demo:
        status = "demo"
        data_type = "demo"
    else:
        status = "unavailable"
        data_type = "unavailable"

    # Calculate station distance if coordinates provided
    station_distance_km = None
    if latitude is not None and longitude is not None and chosen_station.get("latitude") and chosen_station.get("longitude"):
        station_distance_km = round(
            math.hypot(
                chosen_station["latitude"] - latitude,
                chosen_station["longitude"] - longitude
            ) * 111,  # rough km per degree
            1
        )

    # Generate health advisory
    aqi = chosen_station.get("aqi")
    category = chosen_station.get("category", "Unknown")
    if aqi is not None:
        advisory = _generate_health_advisory(aqi, category)
    else:
        advisory = {
            "summary": "Air quality data temporarily unavailable.",
            "precautions": ["Please try again later."],
        }

    return {
        "location": {
            "name": chosen_station["name"],
            "city": chosen_station["city"],
            "state": chosen_station.get("state"),
            "latitude": chosen_station["latitude"],
            "longitude": chosen_station["longitude"],
            "station_id": chosen_station["id"],
        },
        "air_quality": {
            "aqi": aqi,
            "category": category,
            "color": chosen_station.get("color", "#71818A"),
            "prominent_pollutant": chosen_station.get("prominent_pollutant"),
            "standard": "IN_CPCB",
            "status": status,
            "is_standard_met": chosen_station.get("is_standard_met", False),
        },
        "pollutants": pollutants,
        "health_advisory": advisory,
        "metadata": {
            "source": data_source,
            "observed_at": chosen_station.get("last_updated"),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "data_type": data_type,
            "is_stale": not is_authoritative,
            "is_demo": is_demo,
            "station_distance_km": station_distance_km,
            "data_freshness": _calculate_freshness(chosen_station.get("last_updated")),
        },
    }


def _generate_health_advisory(aqi: int, category: str) -> dict[str, Any]:
    """Generate contextual health advisory based on AQI."""
    if aqi <= 50:
        return {
            "summary": "Air quality is good. Ideal for all outdoor activities.",
            "precautions": [
                "No special precautions needed.",
                "Enjoy outdoor exercise and activities.",
            ],
        }
    elif aqi <= 100:
        return {
            "summary": "Air quality is satisfactory. Minor discomfort possible for sensitive individuals.",
            "precautions": [
                "Sensitive individuals should consider reducing prolonged outdoor exertion.",
                "General population can continue normal activities.",
            ],
        }
    elif aqi <= 200:
        return {
            "summary": "Air quality is moderate. Breathing discomfort for sensitive groups.",
            "precautions": [
                "People with respiratory/heart conditions should limit outdoor exertion.",
                "Consider wearing N95 mask during high traffic hours.",
            ],
        }
    elif aqi <= 300:
        return {
            "summary": "Air quality is poor. Discomfort for most people on prolonged exposure.",
            "precautions": [
                "Reduce prolonged outdoor activities.",
                "Wear N95/FFP2 mask when outdoors.",
                "Keep windows closed during peak traffic hours.",
            ],
        }
    elif aqi <= 400:
        return {
            "summary": "Air quality is very poor. Respiratory illness risk on prolonged exposure.",
            "precautions": [
                "Avoid outdoor exercise and strenuous activities.",
                "Wear certified N95/FFP2 respirator when commuting.",
                "Use indoor air purifiers with HEPA filters.",
                "Keep windows and doors closed.",
            ],
        }
    else:
        return {
            "summary": "Air quality is severe. Serious health impacts even for healthy individuals.",
            "precautions": [
                "Stay indoors as much as possible.",
                "Use certified respirator if going outside is necessary.",
                "Run air purifiers continuously.",
                "Seek medical attention if experiencing breathing difficulties.",
            ],
        }


def _calculate_freshness(observed_at: str | None) -> str:
    """Calculate data freshness indicator."""
    if not observed_at:
        return "unknown"

    try:
        obs_time = datetime.fromisoformat(observed_at.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        age_hours = (now - obs_time).total_seconds() / 3600

        if age_hours <= 1:
            return "fresh"
        elif age_hours <= 6:
            return "recent"
        elif age_hours <= 24:
            return "aging"
        else:
            return "stale"
    except Exception:
        return "unknown"


# Synchronous wrappers for backward compatibility with tests and agents
def get_all_stations_sync(city: str | None = None, use_demo: bool = True) -> list[dict[str, Any]]:
    """Synchronous wrapper for get_all_stations using demo data."""
    return get_demo_stations(city)


def find_best_station_sync(
    latitude: float | None = None,
    longitude: float | None = None,
    city: str | None = None,
    use_demo: bool = True,
) -> dict[str, Any] | None:
    """Synchronous wrapper for find_best_station using demo data."""
    stations = get_demo_stations(city)

    if not stations:
        return None

    if city:
        city_stations = [s for s in stations if s["city"].lower() == city.lower()]
        if city_stations:
            stations = city_stations

    if latitude is not None and longitude is not None:
        def distance(st: dict) -> float:
            if st["latitude"] is None or st["longitude"] is None:
                return float("inf")
            return math.hypot(st["latitude"] - latitude, st["longitude"] - longitude)

        stations.sort(key=lambda s: (
            0 if s.get("is_authoritative") else (1 if s.get("is_demo") else 2),
            distance(s),
        ))
    else:
        stations.sort(key=lambda s: (
            0 if s.get("is_authoritative") else (1 if s.get("is_demo") else 2),
        ))

    return stations[0] if stations else None


def get_current_air_quality_sync(
    latitude: float | None = None,
    longitude: float | None = None,
    city: str | None = None,
    use_demo: bool = True,
) -> dict[str, Any]:
    """Synchronous wrapper for get_current_air_quality using demo data."""
    chosen_station = find_best_station_sync(latitude, longitude, city, use_demo)

    if not chosen_station:
        return {
            "location": {
                "name": "No Monitoring Station Available",
                "city": city or "Unknown",
                "state": "N/A",
                "latitude": latitude,
                "longitude": longitude,
                "station_id": None,
            },
            "air_quality": {
                "aqi": None,
                "category": "Unavailable",
                "color": "#71818A",
                "prominent_pollutant": None,
                "standard": "IN_CPCB",
                "status": "unavailable",
            },
            "pollutants": {},
            "health_advisory": {
                "summary": f"No CPCB/SPCB monitoring data available for {city or 'this location'}.",
                "precautions": ["Check network connection or select a supported monitoring city."],
            },
            "metadata": {
                "source": "No data source",
                "observed_at": None,
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "data_type": "unavailable",
                "is_stale": True,
                "station_distance_km": None,
            },
        }

    pollutants = {}
    raw_pollutants = chosen_station.get("pollutants", {})
    sub_indices = chosen_station.get("sub_indices", {})

    for pol, conc in raw_pollutants.items():
        if conc is not None:
            pollutants[pol] = {
                "value": conc,
                "unit": POLLUTANT_UNITS.get(pol, "µg/m³"),
                "sub_index": sub_indices.get(pol),
            }

    is_demo = chosen_station.get("is_demo", False)
    is_authoritative = chosen_station.get("is_authoritative", False)
    data_source = chosen_station.get("data_source", "Unknown")

    if is_authoritative:
        status = "live"
        data_type = "observed"
    elif is_demo:
        status = "demo"
        data_type = "demo"
    else:
        status = "unavailable"
        data_type = "unavailable"

    station_distance_km = None
    if latitude is not None and longitude is not None and chosen_station.get("latitude") and chosen_station.get("longitude"):
        station_distance_km = round(
            math.hypot(
                chosen_station["latitude"] - latitude,
                chosen_station["longitude"] - longitude
            ) * 111,
            1
        )

    aqi = chosen_station.get("aqi")
    category = chosen_station.get("category", "Unknown")
    if aqi is not None:
        advisory = _generate_health_advisory(aqi, category)
    else:
        advisory = {
            "summary": "Air quality data temporarily unavailable.",
            "precautions": ["Please try again later."],
        }

    return {
        "location": {
            "name": chosen_station["name"],
            "city": chosen_station["city"],
            "state": chosen_station.get("state"),
            "latitude": chosen_station["latitude"],
            "longitude": chosen_station["longitude"],
            "station_id": chosen_station["id"],
        },
        "air_quality": {
            "aqi": aqi,
            "category": category,
            "color": chosen_station.get("color", "#71818A"),
            "prominent_pollutant": chosen_station.get("prominent_pollutant"),
            "standard": "IN_CPCB",
            "status": status,
            "is_standard_met": chosen_station.get("is_standard_met", False),
        },
        "pollutants": pollutants,
        "health_advisory": advisory,
        "metadata": {
            "source": data_source,
            "observed_at": chosen_station.get("last_updated"),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "data_type": data_type,
            "is_stale": not is_authoritative,
            "is_demo": is_demo,
            "station_distance_km": station_distance_km,
            "data_freshness": _calculate_freshness(chosen_station.get("last_updated")),
        },
    }