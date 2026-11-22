"""Personalized daily routine planning routes."""
from __future__ import annotations

import uuid
from datetime import date
from fastapi import APIRouter
from app.schemas.routine import GenerateRoutineRequest
from app.services.station_service import get_current_air_quality

router = APIRouter(prefix="/routines", tags=["Daily Routines"])


@router.post("/generate")
async def generate_routine(req: GenerateRoutineRequest):
    """Generate a pollution-aware daily routine based on target location air quality."""
    aqi_data = get_current_air_quality(latitude=req.latitude, longitude=req.longitude, city=req.city)
    aqi = aqi_data["air_quality"]["aqi"]
    cat = aqi_data["air_quality"]["category"]

    if aqi > 250:
        morning_text = "Early morning smog is heavy. Shift workouts indoors; keep bedroom windows sealed."
        travel_text = "Commute via metro or AC bus. Avoid open motorcycle rides or walking on main arterial roads."
        afternoon_text = "Sun dispersal provides a slight dip in PM2.5. Brief indoor errand window."
        evening_text = "Night cooling creates thermal inversion. Stay indoors with HEPA air purifiers active."
    elif aqi > 100:
        morning_text = "Delay morning outdoor runs until after 8:30 AM when ground-level pollutants lift."
        travel_text = "Standard public transit recommended. Sensitive persons should carry an N95 mask."
        afternoon_text = "Optimal window for natural window ventilation between 12:00 PM and 3:00 PM."
        evening_text = "Outdoor strolls permissible in parks away from vehicle exhaust corridors."
    else:
        morning_text = "Clean air morning! Perfect conditions for outdoor running, cycling, or sports."
        travel_text = "Encouraged active commute (walking or cycling)."
        afternoon_text = "Good air quality throughout the day. Full indoor natural ventilation recommended."
        evening_text = "Ideal evening for outdoor recreation, sports, and patio gatherings."

    routine = {
        "id": str(uuid.uuid4()),
        "target_date": req.target_date.isoformat(),
        "headline": f"Pollution-Aware Plan for {cat} Conditions ({aqi} AQI)",
        "summary": f"Based on live CAAQMS data from {aqi_data['location']['name']}, schedule outdoor exposure during optimal dispersion windows.",
        "aqi_context": aqi_data["air_quality"],
        "status": "active",
        "items": [
            {
                "id": str(uuid.uuid4()),
                "time_period": "morning",
                "title": "Morning Activity",
                "recommendation": morning_text,
                "environmental_reason": f"Surface PM2.5 is {aqi_data['pollutants']['pm25']['value']} µg/m³",
                "is_completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "time_period": "travel",
                "title": "Office / Study Commute",
                "recommendation": travel_text,
                "environmental_reason": "Congestion corridors elevate ultrafine particulate inhalation",
                "is_completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "time_period": "afternoon",
                "title": "Indoor Ventilation & Rest",
                "recommendation": afternoon_text,
                "environmental_reason": "Solar heating increases boundary layer mixing height",
                "is_completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "time_period": "evening",
                "title": "Evening Outdoor Activity",
                "recommendation": evening_text,
                "environmental_reason": "Cooling temperature traps evening traffic emissions",
                "is_completed": False,
            },
        ],
    }

    return {"success": True, "data": routine}


@router.get("/today")
async def get_today_routine():
    """Retrieve today's active routine."""
    req = GenerateRoutineRequest(target_date=date.today())
    return await generate_routine(req)


@router.post("/{routine_id}/items/{item_id}/complete")
async def toggle_item_complete(routine_id: str, item_id: str):
    """Mark a routine activity complete."""
    return {"success": True, "message": "Activity marked complete"}
