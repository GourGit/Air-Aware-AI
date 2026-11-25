"""Personalized daily routine planning routes with database persistence."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.models.routine import DailyRoutine, RoutineItem
from app.repositories import RoutineRepository
from app.schemas.routine import GenerateRoutineRequest, DailyRoutineResponse, RoutineItemResponse
from app.services.station_service import get_current_air_quality_sync

router = APIRouter(prefix="/routines", tags=["Daily Routines"])


def generate_routine_items(aqi_data: dict, target_date: date) -> list[RoutineItem]:
    """Generate routine items based on AQI data."""
    aqi = aqi_data["air_quality"]["aqi"]
    cat = aqi_data["air_quality"]["category"]
    pm25_val = aqi_data.get("pollutants", {}).get("pm25", {}).get("value")

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

    items_data = [
        {
            "activity": "Morning Activity",
            "location_type": "indoor" if aqi > 200 else "outdoor",
            "start_time": "06:00",
            "end_time": "09:00",
            "duration_minutes": 180,
            "sort_order": 1,
            "notes": morning_text,
        },
        {
            "activity": "Office / Study Commute",
            "location_type": "outdoor",
            "start_time": "08:00",
            "end_time": "09:30",
            "duration_minutes": 90,
            "sort_order": 2,
            "notes": travel_text,
        },
        {
            "activity": "Indoor Ventilation & Rest",
            "location_type": "indoor",
            "start_time": "12:00",
            "end_time": "15:00",
            "duration_minutes": 180,
            "sort_order": 3,
            "notes": afternoon_text,
        },
        {
            "activity": "Evening Outdoor Activity",
            "location_type": "outdoor" if aqi <= 150 else "indoor",
            "start_time": "17:00",
            "end_time": "19:00",
            "duration_minutes": 120,
            "sort_order": 4,
            "notes": evening_text,
        },
    ]

    items = []
    for idx, data in enumerate(items_data):
        item = RoutineItem(
            id=uuid.uuid4(),
            activity=data["activity"],
            location_type=data["location_type"],
            start_time=data["start_time"],
            end_time=data["end_time"],
            duration_minutes=data["duration_minutes"],
            sort_order=data["sort_order"],
            notes=data["notes"],
        )
        items.append(item)
    return items


@router.post("/generate")
async def generate_routine(
    req: GenerateRoutineRequest,
    user: CurrentUser,
    db: DBSession,
):
    """Generate and persist a pollution-aware daily routine based on target location air quality."""
    # Get AQI data
    aqi_data = get_current_air_quality_sync(
        latitude=req.latitude,
        longitude=req.longitude,
        city=req.city,
    )
    aqi = aqi_data["air_quality"]["aqi"]
    cat = aqi_data["air_quality"]["category"]

    # Create routine
    routine = DailyRoutine(
        id=uuid.uuid4(),
        user_id=user.id,
        name=f"Pollution-Aware Plan for {cat} ({aqi} AQI)",
        description=f"Based on live CAAQMS data from {aqi_data['location']['name']}, schedule outdoor exposure during optimal dispersion windows.",
        is_active=True,
        metadata_json={
            "aqi_context": aqi_data["air_quality"],
            "source": aqi_data["metadata"]["source"],
            "observed_at": aqi_data["metadata"]["observed_at"],
            "target_date": req.target_date.isoformat(),
        },
    )

    # Generate and attach items
    items = generate_routine_items(aqi_data, req.target_date)
    routine.items = items

    # Persist
    repo = RoutineRepository(db)
    saved = await repo.create_routine(routine)

    # Build response
    response_data = {
        "id": str(saved.id),
        "user_id": str(saved.user_id),
        "target_date": req.target_date.isoformat(),
        "headline": saved.name,
        "summary": saved.description,
        "aqi_context": aqi_data["air_quality"],
        "status": "active",
        "items": [
            {
                "id": str(item.id),
                "time_period": item.activity.lower().split()[0],
                "title": item.activity,
                "recommendation": item.notes,
                "environmental_reason": item.notes,
                "is_completed": False,
                "order_index": item.sort_order,
            }
            for item in saved.items
        ],
        "created_at": saved.created_at.isoformat(),
        "updated_at": saved.updated_at.isoformat(),
    }

    return {"success": True, "data": response_data}


@router.get("/today")
async def get_today_routine(
    user: CurrentUser,
    db: DBSession,
    target_date: date | None = None,
):
    """Retrieve today's active routine or generate one if none exists."""
    if target_date is None:
        target_date = date.today()

    repo = RoutineRepository(db)
    routine = await repo.get_today_routine(user.id, target_date)

    if not routine:
        # Generate new routine
        from app.schemas.routine import GenerateRoutineRequest
        req = GenerateRoutineRequest(target_date=target_date)
        return await generate_routine(req, user, db)

    # Build response
    response_data = {
        "id": str(routine.id),
        "user_id": str(routine.user_id),
        "target_date": target_date.isoformat(),
        "headline": routine.name,
        "summary": routine.description,
        "aqi_context": routine.metadata_json.get("aqi_context", {}) if routine.metadata_json else {},
        "status": "active" if routine.is_active else "inactive",
        "items": [
            {
                "id": str(item.id),
                "time_period": item.activity.lower().split()[0],
                "title": item.activity,
                "recommendation": item.notes,
                "environmental_reason": item.notes,
                "is_completed": "[COMPLETED:" in (item.notes or ""),
                "completed_at": None,  # Could parse from notes
                "order_index": item.sort_order,
            }
            for item in routine.items
        ],
        "created_at": routine.created_at.isoformat(),
        "updated_at": routine.updated_at.isoformat(),
    }

    return {"success": True, "data": response_data}


@router.get("/history")
async def get_routine_history(
    user: CurrentUser,
    db: DBSession,
    limit: int = 50,
    offset: int = 0,
):
    """Retrieve routine history for the user."""
    repo = RoutineRepository(db)
    routines = await repo.get_user_routines(user.id, limit=limit, offset=offset)

    return {
        "success": True,
        "data": [
            {
                "id": str(r.id),
                "target_date": r.metadata_json.get("target_date") if r.metadata_json else None,
                "headline": r.name,
                "summary": r.description,
                "status": "active" if r.is_active else "inactive",
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
            }
            for r in routines
        ],
    }


@router.get("/{routine_id}")
async def get_routine_by_id(
    routine_id: uuid.UUID,
    user: CurrentUser,
    db: DBSession,
):
    """Retrieve a specific routine by ID."""
    repo = RoutineRepository(db)
    routine = await repo.get_routine_by_id(routine_id, user.id)

    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    response_data = {
        "id": str(routine.id),
        "user_id": str(routine.user_id),
        "target_date": routine.metadata_json.get("target_date") if routine.metadata_json else None,
        "headline": routine.name,
        "summary": routine.description,
        "aqi_context": routine.metadata_json.get("aqi_context", {}) if routine.metadata_json else {},
        "status": "active" if routine.is_active else "inactive",
        "items": [
            {
                "id": str(item.id),
                "time_period": item.activity.lower().split()[0],
                "title": item.activity,
                "recommendation": item.notes,
                "environmental_reason": item.notes,
                "is_completed": "[COMPLETED:" in (item.notes or ""),
                "completed_at": None,
                "order_index": item.sort_order,
            }
            for item in routine.items
        ],
        "created_at": routine.created_at.isoformat(),
        "updated_at": routine.updated_at.isoformat(),
    }

    return {"success": True, "data": response_data}


@router.post("/{routine_id}/items/{item_id}/complete")
async def toggle_item_complete(
    routine_id: uuid.UUID,
    item_id: uuid.UUID,
    user: CurrentUser,
    db: DBSession,
    completed: bool = True,
):
    """Mark a routine activity complete/incomplete."""
    repo = RoutineRepository(db)
    item = await repo.toggle_item_completion(item_id, user.id, completed)

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine item not found")

    return {"success": True, "message": f"Activity marked {'complete' if completed else 'incomplete'}"}


@router.post("/{routine_id}/regenerate")
async def regenerate_routine(
    routine_id: uuid.UUID,
    user: CurrentUser,
    db: DBSession,
):
    """Regenerate an existing routine with current air quality data."""
    repo = RoutineRepository(db)
    routine = await repo.get_routine_by_id(routine_id, user.id)

    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    # Deactivate old routine
    routine.is_active = False
    await db.flush()

    # Generate new routine with same target date
    target_date_str = routine.metadata_json.get("target_date") if routine.metadata_json else None
    target_date = date.fromisoformat(target_date_str) if target_date_str else date.today()

    from app.schemas.routine import GenerateRoutineRequest
    req = GenerateRoutineRequest(target_date=target_date)
    return await generate_routine(req, user, db)


@router.delete("/{routine_id}")
async def delete_routine(
    routine_id: uuid.UUID,
    user: CurrentUser,
    db: DBSession,
):
    """Delete a routine."""
    repo = RoutineRepository(db)
    routine = await repo.get_routine_by_id(routine_id, user.id)

    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    await repo.delete_routine(routine)
    return {"success": True, "message": "Routine deleted"}