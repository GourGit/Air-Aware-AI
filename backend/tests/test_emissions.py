"""Unit tests for deterministic greenhouse gas emissions calculations."""
import pytest
from app.services.emission_service import calculate_trip_emissions_kg, compare_transport_modes


def test_zero_distance():
    assert calculate_trip_emissions_kg(0.0, "private_car_petrol") == 0.0
    assert calculate_trip_emissions_kg(-5.0, "bus") == 0.0


def test_clean_modes_have_zero_tailpipe():
    assert calculate_trip_emissions_kg(10.0, "walking") == 0.0
    assert calculate_trip_emissions_kg(15.0, "bicycle") == 0.0


def test_metro_vs_car_savings():
    distance = 20.0
    car_kg = calculate_trip_emissions_kg(distance, "private_car_petrol")
    metro_kg = calculate_trip_emissions_kg(distance, "metro")

    assert car_kg > metro_kg
    assert metro_kg < 0.5  # 20km * 15.8g = 316g = 0.316kg


def test_compare_modes_ordering():
    comparisons = compare_transport_modes(10.0, "Point A", "Point B")
    assert len(comparisons) > 0
    # First item should be lowest emissions
    assert comparisons[0]["co2e_emissions_kg"] <= comparisons[-1]["co2e_emissions_kg"]
