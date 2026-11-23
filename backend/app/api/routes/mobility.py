"""Sustainable mobility routes: deterministic emissions comparison and trip logging."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.models.mobility import MobilityRecord
from app.repositories import MobilityRepository
from app.schemas.mobility import MobilityCompareRequest, MobilityRecordCreate
from app.services.emission_service import compare_transport_modes, calculate_trip_emissions_kg

router = APIRouter(prefix="/mobility", tags=["Sustainable Mobility"])


@router.post("/compare")
async def compare_modes(req: MobilityCompareRequest):
    """Compare travel times, emissions, and health exposure for multiple transport choices."""
    results = compare_transport_modes(
        distance_km=req.distance_km,
        origin=req.origin,
        destination=req.destination,
        passengers=req.passengers,
    )

    return {
        "success": True,
        "data": {
            "origin": req.origin,
            "destination": req.destination,
            "distance_km": req.distance_km,
            "comparisons": results,
            "recommendation": "Taking the Metro rail achieves maximum carbon savings while eliminating direct road exhaust exposure.",
            "emission_factors_source": "India CEA Grid Factor & ARAI 2024 Automotive Standards",
        },
    }


@router.post("/records")
async def log_mobility_record(
    req: MobilityRecordCreate,
    user: CurrentUser,
    db: DBSession,
):
    """Log a completed trip with deterministic carbon savings."""
    actual_kg = calculate_trip_emissions_kg(req.distance_km, req.mode_chosen)
    baseline_kg = calculate_trip_emissions_kg(req.distance_km, req.mode_baseline)
    saved_kg = max(0.0, round(baseline_kg - actual_kg, 3))

    record = MobilityRecord(
        id=uuid.uuid4(),
        user_id=user.id,
        transport_mode=req.mode_chosen,
        distance_km=req.distance_km,
        duration_minutes=req.duration_minutes,
        origin=req.origin,
        destination=req.destination,
        origin_lat=req.origin_lat,
        origin_lng=req.origin_lng,
        dest_lat=req.dest_lat,
        dest_lng=req.dest_lng,
        co2_grams=actual_kg * 1000,
        recorded_at=req.trip_date,
        metadata_json={"baseline_mode": req.mode_baseline, "saved_kg": saved_kg},
    )
    repo = MobilityRepository(db)
    saved = await repo.create_mobility_record(record)

    return {
        "success": True,
        "data": {
            "id": str(saved.id),
            "origin": req.origin,
            "destination": req.destination,
            "distance_km": req.distance_km,
            "mode_chosen": req.mode_chosen,
            "emissions_actual_kg": actual_kg,
            "emissions_saved_kg": saved_kg,
            "trip_date": req.trip_date.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    }


@router.get("/history")
async def get_mobility_history(
    user: CurrentUser,
    db: DBSession,
    limit: int = 50,
    offset: int = 0,
):
    """Retrieve logged sustainable trips."""
    repo = MobilityRepository(db)
    records = await repo.get_mobility_records(user.id, limit=limit, offset=offset)

    return {
        "success": True,
        "data": [
            {
                "id": str(r.id),
                "origin": r.origin,
                "destination": r.destination,
                "distance_km": r.distance_km,
                "mode_chosen": r.transport_mode,
                "emissions_actual_kg": (r.co2_grams or 0) / 1000.0,
                "emissions_saved_kg": (r.metadata_json or {}).get("saved_kg", 0),
                "trip_date": r.recorded_at.date().isoformat(),
            }
            for r in records
        ],
    }
