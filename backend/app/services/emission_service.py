"""Deterministic greenhouse gas emissions calculation engine.

Based on ARAI (Automotive Research Association of India) & CEA (Central Electricity Authority) 
CO2 baseline metrics for urban passenger mobility in India.
"""

from __future__ import annotations

# Emission factors in grams of CO2-equivalent per passenger-kilometer (g CO2e / pkm)
EMISSION_FACTORS_G_PER_PKM: dict[str, float] = {
    "walking": 0.0,
    "bicycle": 0.0,
    "metro": 15.8,  # Based on CEA Indian Grid Average & Metro Rail efficiency
    "electric_bus": 25.0,
    "cng_bus": 40.2,
    "bus": 52.0,  # Average Indian urban municipal diesel/cng bus fleet
    "motorcycle": 68.5,  # 100-150cc typical two-wheeler single occupant
    "electric_car": 62.0,  # Life-cycle charging from standard Indian coal-heavy grid
    "private_car_cng": 125.0,
    "private_car_diesel": 155.0,
    "private_car_petrol": 162.0,  # Baseline standard single-occupant hatchback/sedan
    "auto_rickshaw": 72.0,
}

MODE_LABELS: dict[str, str] = {
    "walking": "Walking",
    "bicycle": "Bicycle",
    "metro": "Metro Rail",
    "electric_bus": "Electric Bus",
    "bus": "City Bus",
    "motorcycle": "Motorcycle / Scooter",
    "electric_car": "Electric Car (EV)",
    "private_car_petrol": "Private Petrol Car",
    "private_car_diesel": "Private Diesel Car",
    "auto_rickshaw": "Auto Rickshaw",
}


def calculate_trip_emissions_kg(distance_km: float, mode: str, passengers: int = 1) -> float:
    """Calculate actual greenhouse gas emissions in kilograms of CO2e."""
    if distance_km <= 0:
        return 0.0
    factor = EMISSION_FACTORS_G_PER_PKM.get(mode, EMISSION_FACTORS_G_PER_PKM["private_car_petrol"])
    # If mode is a private car, total car emissions are divided among passengers
    if "private_car" in mode or mode == "electric_car":
        total_grams = (factor * distance_km) / max(passengers, 1)
    else:
        # Transit or active modes are inherently per-passenger
        total_grams = factor * distance_km

    return round(total_grams / 1000.0, 3)


def compare_transport_modes(
    distance_km: float,
    origin: str,
    destination: str,
    passengers: int = 1,
) -> list[dict]:
    """Provide deterministic comparative emission metrics for all available urban transport modes."""
    baseline_car_kg = calculate_trip_emissions_kg(distance_km, "private_car_petrol", passengers=1)

    modes_to_evaluate = [
        ("metro", 32, "Low", 0),  # mode, avg speed kmh, exposure, kcal/km
        ("bus", 18, "Medium", 0),
        ("electric_car", 25, "Low", 0),
        ("motorcycle", 28, "High", 10),
        ("bicycle", 14, "Medium", 35),
        ("walking", 4.5, "Medium", 55),
        ("private_car_petrol", 25, "Low", 0),
    ]

    results = []
    for mode, avg_speed, exposure, kcal_per_km in modes_to_evaluate:
        # Skip walking/cycling for long distances
        if mode == "walking" and distance_km > 5.0:
            continue
        if mode == "bicycle" and distance_km > 15.0:
            continue

        emissions_kg = calculate_trip_emissions_kg(distance_km, mode, passengers)
        saved_kg = max(0.0, round(baseline_car_kg - emissions_kg, 3))
        travel_time_mins = max(1, round((distance_km / avg_speed) * 60))
        total_kcal = round(kcal_per_km * distance_km)

        results.append({
            "mode": mode,
            "mode_name": MODE_LABELS.get(mode, mode.title()),
            "distance_km": round(distance_km, 2),
            "travel_time_est_mins": travel_time_mins,
            "co2e_emissions_kg": emissions_kg,
            "co2e_saved_vs_car_kg": saved_kg,
            "health_exposure_rating": exposure,
            "caloric_burn_kcal": total_kcal,
        })

    # Sort primarily by lowest carbon footprint
    results.sort(key=lambda x: x["co2e_emissions_kg"])
    return results
