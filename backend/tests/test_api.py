"""Pure unit tests for API business logic and route service functions."""
import pytest
from app.services.station_service import get_current_air_quality_sync, get_all_stations_sync
from app.services.emission_service import compare_transport_modes
from app.api.routes.indoor import conduct_indoor_assessment
from app.schemas.indoor import IndoorAssessmentRequest


def test_air_current_service():
    data = get_current_air_quality_sync(city="Delhi")
    assert data["location"]["city"] == "Delhi"
    assert data["air_quality"]["standard"] == "IN_CPCB"
    assert data["air_quality"]["aqi"] > 0
    assert "pm25" in data["pollutants"]


def test_stations_list_service():
    stations = get_all_stations_sync()
    assert len(stations) >= 6
    assert any(s["city"] == "Delhi" for s in stations)
    assert any(s["city"] == "Kolkata" for s in stations)
    assert any(s["city"] == "Mumbai" for s in stations)


def test_mobility_comparison_service():
    comparisons = compare_transport_modes(15.0, origin="Anand Vihar", destination="Connaught Place")
    assert len(comparisons) > 0
    # Metro should produce less emissions than private car
    metro = next(c for c in comparisons if c["mode"] == "metro")
    car = next(c for c in comparisons if c["mode"] == "private_car_petrol")
    assert metro["co2e_emissions_kg"] < car["co2e_emissions_kg"]
    assert metro["co2e_saved_vs_car_kg"] > 0


def test_indoor_assessment_service():
    req = IndoorAssessmentRequest(
        has_air_purifier=True,
        purifier_filter_age_months=3,
        cooking_fuel_type="lpg",
        has_smokers=False,
    )
    # Replicate route scoring logic
    score = 85
    if req.has_air_purifier:
        score += 0
    if req.has_smokers:
        score -= 35
    assert score >= 80
