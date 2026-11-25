"""Personal environmental impact routes with real calculations from persisted data."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.models.impact import ImpactRecord, SustainabilityAction
from app.models.mobility import MobilityRecord
from app.repositories import ImpactRepository
from app.schemas.impact import ImpactRecordCreate

router = APIRouter(prefix="/impact", tags=["Environmental Impact"])


def calculate_tier(co2_kg: float) -> str:
    """Calculate user tier based on CO2 saved."""
    if co2_kg >= 100:
        return "Urban Climate Champion (Gold)"
    elif co2_kg >= 50:
        return "Urban Climate Champion (Silver)"
    elif co2_kg >= 20:
        return "Urban Climate Champion (Bronze)"
    else:
        return "Eco Starter"


@router.get("/summary")
async def get_impact_summary(
    user: CurrentUser,
    db: DBSession,
    period_days: int | None = Query(None, description="Filter by last N days"),
):
    """Get aggregated personal greenhouse gas savings and sustainability score from actual logged activities."""
    repo = ImpactRepository(db)

    # Get totals from mobility records (primary source)
    from app.repositories import MobilityRepository
    mobility_repo = MobilityRepository(db)
    
    # Build base query for mobility records
    query = select(
        func.coalesce(func.sum(MobilityRecord.co2_grams), 0),
        func.coalesce(func.sum(MobilityRecord.distance_km), 0),
        func.count(MobilityRecord.id),
    ).where(MobilityRecord.user_id == user.id)

    if period_days:
        since = datetime.now(timezone.utc) - timedelta(days=period_days)
        query = query.where(MobilityRecord.recorded_at >= since)

    result = await db.execute(query)
    total_co2_grams, total_sustainable_km, total_trips = result.first() or (0, 0, 0)

    # Also get impact records (for manual entries)
    impact_co2_query = select(func.coalesce(func.sum(ImpactRecord.total_co2_grams), 0)).where(
        ImpactRecord.user_id == user.id
    )
    if period_days:
        since = datetime.now(timezone.utc) - timedelta(days=period_days)
        impact_co2_query = impact_co2_query.where(ImpactRecord.period_start >= since)
    impact_result = await db.execute(impact_co2_query)
    impact_co2 = impact_result.scalar() or 0

    total_co2_grams = (total_co2_grams or 0) + (impact_co2 or 0)
    total_sustainable_km = total_sustainable_km or 0
    total_trips = total_trips or 0

    # Get completed sustainability actions
    completed_actions = await repo.get_completed_actions_count(user.id)
    if period_days:
        since = datetime.now(timezone.utc) - timedelta(days=period_days)
        actions_query = select(func.count(SustainabilityAction.id)).where(
            SustainabilityAction.user_id == user.id,
            SustainabilityAction.is_completed == True,
            SustainabilityAction.completed_at >= since,
        )
        actions_result = await db.execute(actions_query)
        completed_actions = actions_result.scalar() or 0

    co2_kg = total_co2_grams / 1000.0
    tier = calculate_tier(co2_kg)

    # Get mode distribution from mobility records
    mode_query = select(
        MobilityRecord.transport_mode,
        func.count(MobilityRecord.id),
        func.coalesce(func.sum(MobilityRecord.distance_km), 0),
    ).where(MobilityRecord.user_id == user.id).group_by(MobilityRecord.transport_mode)
    
    if period_days:
        since = datetime.now(timezone.utc) - timedelta(days=period_days)
        mode_query = mode_query.where(MobilityRecord.recorded_at >= since)
    
    mode_result = await db.execute(mode_query)
    mode_distribution = {
        mode: {"count": count, "distance_km": round(dist or 0, 1)}
        for mode, count, dist in mode_result.all()
    }

    # Get weekly savings (last 7 days)
    weekly_query = select(
        func.date(MobilityRecord.recorded_at).label("trip_date"),
        func.coalesce(func.sum(MobilityRecord.co2_grams), 0),
    ).where(
        MobilityRecord.user_id == user.id,
        MobilityRecord.recorded_at >= datetime.now(timezone.utc) - timedelta(days=7),
    ).group_by(func.date(MobilityRecord.recorded_at)).order_by("trip_date")
    
    weekly_result = await db.execute(weekly_query)
    weekly_savings = [
        {"date": row.trip_date.isoformat(), "saved_kg": round((row[1] or 0) / 1000.0, 3)}
        for row in weekly_result.all()
    ]

    return {
        "success": True,
        "data": {
            "total_co2e_saved_kg": round(co2_kg, 1),
            "total_sustainable_km": round(total_sustainable_km, 1),
            "total_trips_logged": total_trips,
            "total_exposure_points": completed_actions * 10,
            "current_tier": tier,
            "mode_distribution": mode_distribution,
            "weekly_savings_kg": weekly_savings,
            "recent_milestones": [],  # Could be computed from thresholds
        },
    }


@router.get("/records")
async def get_impact_records(
    user: CurrentUser,
    db: DBSession,
    period_type: str | None = Query(None, description="daily, weekly, monthly"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    """Get impact records for the user."""
    repo = ImpactRepository(db)
    records = await repo.get_impact_records(user.id, period_type=period_type, limit=limit)

    return {
        "success": True,
        "data": [
            {
                "id": str(r.id),
                "period_type": r.period_type,
                "period_start": r.period_start.isoformat(),
                "period_end": r.period_end.isoformat(),
                "total_co2_grams": r.total_co2_grams,
                "total_distance_km": r.total_distance_km,
                "green_trips": r.green_trips,
                "total_trips": r.total_trips,
                "score": r.score,
            }
            for r in records
        ],
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


@router.post("/actions/{action_id}/complete")
async def complete_sustainability_action(
    action_id: uuid.UUID,
    user: CurrentUser,
    db: DBSession,
):
    """Mark a sustainability action as completed."""
    result = await db.execute(
        select(SustainabilityAction).where(
            SustainabilityAction.id == action_id,
            SustainabilityAction.user_id == user.id,
        )
    )
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.is_completed = True
    action.completed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(action)

    return {
        "success": True,
        "data": {
            "id": str(action.id),
            "title": action.title,
            "completed_at": action.completed_at.isoformat(),
        },
    }


@router.get("/actions")
async def get_sustainability_actions(
    user: CurrentUser,
    db: DBSession,
    completed: bool | None = None,
):
    """Get sustainability actions for the user."""
    repo = ImpactRepository(db)
    actions = await repo.get_sustainability_actions(user.id, completed=completed)

    return {
        "success": True,
        "data": [
            {
                "id": str(a.id),
                "title": a.title,
                "description": a.description,
                "category": a.category,
                "difficulty": a.difficulty,
                "impact_points": a.impact_points,
                "is_completed": a.is_completed,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            }
            for a in actions
        ],
    }