"""Personal environmental impact routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.models.impact import ImpactRecord
from app.repositories import ImpactRepository
from app.schemas.impact import ImpactRecordCreate

router = APIRouter(prefix="/impact", tags=["Environmental Impact"])


@router.get("/summary")
async def get_impact_summary(
    user: CurrentUser,
    db: DBSession,
):
    """Get aggregated personal greenhouse gas savings and sustainability score."""
    repo = ImpactRepository(db)

    total_co2_grams = await repo.get_total_co2_saved(user.id)
    total_sustainable_km = await repo.get_total_sustainable_km(user.id)
    total_trips = await repo.get_total_trips(user.id)
    completed_actions = await repo.get_completed_actions_count(user.id)

    # Calculate tier based on CO2 saved
    co2_kg = total_co2_grams / 1000.0
    if co2_kg >= 100:
        tier = "Urban Climate Champion (Gold)"
    elif co2_kg >= 50:
        tier = "Urban Climate Champion (Silver)"
    elif co2_kg >= 20:
        tier = "Urban Climate Champion (Bronze)"
    else:
        tier = "Eco Starter"

    return {
        "success": True,
        "data": {
            "total_co2e_saved_kg": round(co2_kg, 1),
            "total_sustainable_km": round(total_sustainable_km, 1),
            "total_trips_logged": total_trips,
            "total_exposure_points": completed_actions * 10,  # Placeholder calculation
            "current_tier": tier,
            "mode_distribution": {},  # Would require additional query
            "weekly_savings_kg": [],  # Would require additional query
            "recent_milestones": [],
        },
    }


@router.post("/records")
async def log_impact_record(
    req: ImpactRecordCreate,
    user: CurrentUser,
    db: DBSession,
):
    """Log an eco-friendly action."""
    record = ImpactRecord(
        id=uuid.uuid4(),
        user_id=user.id,
        period_type="daily",
        period_start=datetime.now(timezone.utc),
        period_end=datetime.now(timezone.utc),
        total_co2_grams=req.co2e_saved_kg * 1000,
        total_distance_km=0,
        green_trips=1 if req.co2e_saved_kg > 0 else 0,
        total_trips=1,
        impact_data={
            "category": req.category,
            "action_name": req.action_name,
            "exposure_points": req.exposure_points,
        },
    )
    repo = ImpactRepository(db)
    saved = await repo.create_impact_record(record)

    return {
        "success": True,
        "data": {
            "id": str(saved.id),
            "category": req.category,
            "action_name": req.action_name,
            "co2e_saved_kg": req.co2e_saved_kg,
            "exposure_points": req.exposure_points,
            "logged_at": datetime.now(timezone.utc).isoformat(),
        },
    }
