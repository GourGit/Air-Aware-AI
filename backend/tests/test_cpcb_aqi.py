"""Unit tests for the CPCB Indian AQI Calculation Engine."""
import pytest
from app.services.aqi_service import calculate_sub_index, get_cpcb_category, calculate_cpcb_aqi


def test_pm25_sub_indices():
    # Good bracket: 0-30 -> 0-50
    assert calculate_sub_index("pm25", 15.0) == 25
    # Satisfactory: 30.1-60 -> 51-100
    assert calculate_sub_index("pm25", 45.0) == 75
    # Severe bracket: > 250 -> 401-500
    assert calculate_sub_index("pm25", 350.0) == 441


def test_cpcb_categories():
    cat, color, advisory = get_cpcb_category(35)
    assert cat == "Good"
    assert color == "#009966"

    cat, color, advisory = get_cpcb_category(245)
    assert cat == "Poor"
    assert color == "#FF9933"

    cat, color, advisory = get_cpcb_category(420)
    assert cat == "Severe"
    assert color == "#7E0023"


def test_multi_pollutant_cpcb_calculation():
    concentrations = {
        "pm25": 178.0,
        "pm10": 292.0,
        "no2": 68.0,
        "so2": 19.5,
        "co": 1.9,
        "o3": 38.0,
    }
    result = calculate_cpcb_aqi(concentrations)
    assert result["aqi"] is not None
    assert result["aqi"] > 300  # Driven by high PM2.5
    assert result["category"] == "Very Poor"
    assert result["prominent_pollutant"] == "pm25"
    assert result["is_standard_met"] is True
    assert result["standard"] == "IN_CPCB"
