"""Personal environmental impact routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.impact import ImpactRecordCreate

router = APIRouter(prefix="/impact", tags=["Environmental Impact"])


@router.get("/summary")
async def get_impact_summary():
    """Get aggregated personal greenhouse gas savings and sustainability score."""
    return {
        "success": True,
        "data": {
            "total_co2e_saved_kg": 54.8,
            "total_sustainable_km": 360.5,
            "total_trips_logged": 28,
            "total_exposure_points": 340,
            "current_tier": "Urban Climate Champion (Silver)",
            "mode_distribution": {
                "Metro": 65.0,
                "Bicycle": 15.0,
                "Bus": 12.0,
                "Walking": 8.0,
            },
            "weekly_savings_kg": [
                {"day": "Mon", "saved_kg": 2.4},
                {"day": "Tue", "saved_kg": 3.1},
                {"day": "Wed", "saved_kg": 1.8},
                {"day": "Thu", "saved_kg": 2.9},
                {"day": "Fri", "saved_kg": 3.5},
                {"day": "Sat", "saved_kg": 0.8},
                {"day": "Sun", "saved_kg": 1.2},
            ],
            "recent_milestones": [
                "Achieved 50 kg CO2e Avoidance",
                "Logged 20 Clean Transit Trips",
                "7-Day Air Purifier Hygiene Streak",
            ],
        },
    }


@router.post("/records")
async def log_impact_record(req: ImpactRecordCreate):
    """Log an eco-friendly action."""
    record = {
        "id": str(uuid.uuid4()),
        "category": req.category,
        "action_name": req.action_name,
        "co2e_saved_kg": req.co2e_saved_kg,
        "exposure_points": req.exposure_points,
        "logged_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"success": True, "data": record}
