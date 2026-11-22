"""Official Indian Central Pollution Control Board (CPCB) AQI calculation engine.

Implements the National Air Quality Index (NAQI) standard approved by MoEFCC & CPCB.
"""

from __future__ import annotations

from typing import Any


# Breakpoints for 24-hr average (except CO and O3 which are 8-hr)
# (B_low, B_high, I_low, I_high)
BREAKPOINTS: dict[str, list[tuple[float, float, int, int]]] = {
    "pm25": [
        (0.0, 30.0, 0, 50),
        (30.1, 60.0, 51, 100),
        (60.1, 90.0, 101, 200),
        (90.1, 120.0, 201, 300),
        (120.1, 250.0, 301, 400),
        (250.1, 500.0, 401, 500),
    ],
    "pm10": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 250.0, 101, 200),
        (250.1, 350.0, 201, 300),
        (350.1, 430.0, 301, 400),
        (430.1, 600.0, 401, 500),
    ],
    "no2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 180.0, 101, 200),
        (180.1, 280.0, 201, 300),
        (280.1, 400.0, 301, 400),
        (400.1, 600.0, 401, 500),
    ],
    "so2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 380.0, 101, 200),
        (380.1, 800.0, 201, 300),
        (800.1, 1600.0, 301, 400),
        (1600.1, 2000.0, 401, 500),
    ],
    "co": [
        (0.0, 1.0, 0, 50),
        (1.01, 2.0, 51, 100),
        (2.01, 10.0, 101, 200),
        (10.01, 17.0, 201, 300),
        (17.01, 34.0, 301, 400),
        (34.01, 50.0, 401, 500),
    ],
    "o3": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 168.0, 101, 200),
        (168.1, 208.0, 201, 300),
        (208.1, 748.0, 301, 400),
        (748.1, 1000.0, 401, 500),
    ],
    "nh3": [
        (0.0, 200.0, 0, 50),
        (200.1, 400.0, 51, 100),
        (400.1, 800.0, 101, 200),
        (800.1, 1200.0, 201, 300),
        (1200.1, 1800.0, 301, 400),
        (1800.1, 2400.0, 401, 500),
    ],
}

CATEGORY_INFO = {
    "Good": {
        "range": (0, 50),
        "color": "#009966",
        "health_advisory": "Minimal impact. Clean air ideal for all outdoor activities.",
    },
    "Satisfactory": {
        "range": (51, 100),
        "color": "#99CC33",
        "health_advisory": "Minor breathing discomfort to sensitive people.",
    },
    "Moderate": {
        "range": (101, 200),
        "color": "#FFCC00",
        "health_advisory": "Breathing discomfort to the people with lungs, asthma and heart diseases.",
    },
    "Poor": {
        "range": (201, 300),
        "color": "#FF9933",
        "health_advisory": "Breathing discomfort to most people on prolonged exposure.",
    },
    "Very Poor": {
        "range": (301, 400),
        "color": "#CC0033",
        "health_advisory": "Respiratory illness on prolonged exposure. Pronounced effect on people with lung and heart diseases.",
    },
    "Severe": {
        "range": (401, 500),
        "color": "#7E0023",
        "health_advisory": "Affects healthy people and seriously impacts those with existing diseases.",
    },
}


def calculate_sub_index(pollutant: str, concentration: float) -> int | None:
    """Calculate sub-index for a single pollutant based on CPCB linear interpolation."""
    p = pollutant.lower().replace(".", "").replace(" ", "")
    if p not in BREAKPOINTS:
        return None

    brackets = BREAKPOINTS[p]
    for b_low, b_high, i_low, i_high in brackets:
        if b_low <= concentration <= b_high:
            # Linear interpolation formula
            sub_index = i_low + ((i_high - i_low) / (b_high - b_low)) * (concentration - b_low)
            return round(sub_index)

    # If concentration exceeds upper bound of highest bracket, clamp to 500
    if concentration > brackets[-1][1]:
        return 500
    return 0


def get_cpcb_category(aqi: int) -> tuple[str, str, str]:
    """Get CPCB Category Name, Hex Color, and Standard Health Advisory."""
    if aqi <= 50:
        cat = "Good"
    elif aqi <= 100:
        cat = "Satisfactory"
    elif aqi <= 200:
        cat = "Moderate"
    elif aqi <= 300:
        cat = "Poor"
    elif aqi <= 400:
        cat = "Very Poor"
    else:
        cat = "Severe"

    info = CATEGORY_INFO[cat]
    return cat, info["color"], info["health_advisory"]


def calculate_cpcb_aqi(pollutant_concentrations: dict[str, float]) -> dict[str, Any]:
    """Compute overall CPCB AQI requiring >=3 pollutants (with PM2.5 or PM10).

    Returns structured calculation result including sub-indices and validation status.
    """
    sub_indices: dict[str, int] = {}
    has_particulate = False

    for pol, conc in pollutant_concentrations.items():
        if conc is None or conc < 0:
            continue
        sub_idx = calculate_sub_index(pol, conc)
        if sub_idx is not None:
            sub_indices[pol.lower()] = sub_idx
            if pol.lower() in ("pm25", "pm2.5", "pm10"):
                has_particulate = True

    # CPCB Rule Check: Minimum 3 pollutants with at least one particulate (PM2.5 or PM10)
    # For resilient software experience, if insufficient data, we calculate estimated max
    # but explicitly flag is_official_standard_met = False.
    is_standard_met = len(sub_indices) >= 3 and has_particulate

    if not sub_indices:
        return {
            "aqi": None,
            "category": "Unavailable",
            "color": "#71818A",
            "prominent_pollutant": None,
            "sub_indices": {},
            "is_standard_met": False,
            "status": "insufficient_data",
        }

    max_pollutant = max(sub_indices, key=sub_indices.get)  # type: ignore
    overall_aqi = sub_indices[max_pollutant]
    category, color, advisory = get_cpcb_category(overall_aqi)

    return {
        "aqi": overall_aqi,
        "category": category,
        "color": color,
        "health_advisory": advisory,
        "prominent_pollutant": max_pollutant,
        "sub_indices": sub_indices,
        "is_standard_met": is_standard_met,
        "standard": "IN_CPCB",
        "status": "valid" if is_standard_met else "estimated_incomplete_data",
    }
