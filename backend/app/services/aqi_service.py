"""Official Indian Central Pollution Control Board (CPCB) AQI calculation engine.

Implements the National Air Quality Index (NAQI) standard approved by MoEFCC & CPCB.

Reference: CPCB NAQI Guidelines, Central Pollution Control Board, Ministry of Environment,
Forest and Climate Change, Government of India.
"""

from __future__ import annotations

from typing import Any


# Official CPCB Breakpoints for 24-hour average concentrations (µg/m³)
# except CO (8-hour, mg/m³) and O3 (8-hour, µg/m³)
# Format: (B_low, B_high, I_low, I_high)
# Source: CPCB NAQI Technical Document
# Note: B_high is exclusive, B_low is inclusive for boundary handling
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

# Pollutant units for CPCB standard
POLLUTANT_UNITS: dict[str, str] = {
    "pm25": "µg/m³",
    "pm10": "µg/m³",
    "no2": "µg/m³",
    "so2": "µg/m³",
    "co": "mg/m³",
    "o3": "µg/m³",
    "nh3": "µg/m³",
}

# Averaging periods for CPCB standard (in hours)
AVERAGING_PERIODS: dict[str, int] = {
    "pm25": 24,
    "pm10": 24,
    "no2": 24,
    "so2": 24,
    "co": 8,
    "o3": 8,
    "nh3": 24,
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
        "health_advisory": "Breathing discomfort to people with lungs, asthma and heart diseases.",
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

# Minimum pollutants required for official CPCB AQI
REQUIRED_POLLUTANT_COUNT = 3
REQUIRED_PARTICULATE_POLLUTANTS = {"pm25", "pm10"}


def calculate_sub_index(pollutant: str, concentration: float) -> int | None:
    """Calculate sub-index for a single pollutant based on CPCB linear interpolation.

    Formula: I = I_low + ((I_high - I_low) / (B_high - B_low)) * (C - B_low)

    Where:
    - I = sub-index
    - C = pollutant concentration
    - B_low, B_high = concentration breakpoints
    - I_low, I_high = AQI breakpoints corresponding to B_low, B_high

    Args:
        pollutant: Pollutant name (pm25, pm10, no2, so2, co, o3, nh3)
        concentration: 24-hour average concentration (8-hr for CO, O3)

    Returns:
        Sub-index (0-500) or None if pollutant not recognized
    """
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
    """Get CPCB Category Name, Hex Color, and Standard Health Advisory.

    Args:
        aqi: Overall AQI value (0-500)

    Returns:
        Tuple of (category_name, hex_color, health_advisory)
    """
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


def calculate_cpcb_aqi(
    pollutant_concentrations: dict[str, float],
    require_standard: bool = True,
) -> dict[str, Any]:
    """Compute overall CPCB AQI requiring >=3 pollutants (with PM2.5 or PM10).

    CPCB Rules:
    - Minimum 3 pollutants required
    - At least one must be PM2.5 or PM10
    - Sub-indices calculated for each pollutant
    - Overall AQI = maximum sub-index
    - If requirements not met, AQI is "estimated" not "official"

    Args:
        pollutant_concentrations: Dict of pollutant -> concentration
        require_standard: If True, enforce CPCB minimum requirements

    Returns:
        Structured calculation result including sub-indices and validation status
    """
    sub_indices: dict[str, int] = {}
    has_particulate = False

    for pol, conc in pollutant_concentrations.items():
        if conc is None or conc < 0:
            continue
        sub_idx = calculate_sub_index(pol, conc)
        if sub_idx is not None:
            sub_indices[pol.lower()] = sub_idx
            if pol.lower() in REQUIRED_PARTICULATE_POLLUTANTS:
                has_particulate = True

    # CPCB Rule Check: Minimum 3 pollutants with at least one particulate (PM2.5 or PM10)
    is_standard_met = len(sub_indices) >= REQUIRED_POLLUTANT_COUNT and has_particulate

    if not sub_indices:
        return {
            "aqi": None,
            "category": "Unavailable",
            "color": "#71818A",
            "prominent_pollutant": None,
            "sub_indices": {},
            "is_standard_met": False,
            "status": "insufficient_data",
            "missing_requirements": {
                "min_pollutants": REQUIRED_POLLUTANT_COUNT,
                "has_particulate": False,
            },
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
        "is_standard_met": is_standard_met if require_standard else True,
        "standard": "IN_CPCB",
        "status": "valid" if is_standard_met else "estimated_incomplete_data",
        "missing_requirements": {
            "min_pollutants": REQUIRED_POLLUTANT_COUNT if len(sub_indices) < REQUIRED_POLLUTANT_COUNT else None,
            "has_particulate": has_particulate,
        },
    }


def validate_breakpoint_boundaries() -> list[str]:
    """Validate breakpoint table for consistency and gaps.

    Returns:
        List of validation warnings/errors
    """
    issues = []
    for pollutant, brackets in BREAKPOINTS.items():
        for i, (b_low, b_high, i_low, i_high) in enumerate(brackets):
            if i > 0:
                prev_b_high = brackets[i - 1][1]
                if abs(b_low - prev_b_high) > 0.001:
                    issues.append(
                        f"{pollutant}: Gap between brackets {i-1} and {i}: "
                        f"prev_high={prev_b_high}, curr_low={b_low}"
                    )
            if b_low >= b_high:
                issues.append(f"{pollutant}: Invalid bracket {i}: low={b_low} >= high={b_high}")
            if i_low >= i_high:
                issues.append(f"{pollutant}: Invalid AQI range {i}: low={i_low} >= high={i_high}")
    return issues