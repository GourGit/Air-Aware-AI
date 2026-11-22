"""Location search and indexing routes."""
from __future__ import annotations

from fastapi import APIRouter, Query
from app.services.station_service import INDIAN_STATIONS

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/search")
async def search_locations(q: str = Query("", min_length=1)):
    """Search known Indian urban locations, neighborhoods, and monitoring stations."""
    results = []
    query = q.lower()
    for st in INDIAN_STATIONS:
        if query in st["name"].lower() or query in st["city"].lower() or query in st["state"].lower():
            results.append({
                "name": st["name"],
                "city": st["city"],
                "state": st["state"],
                "latitude": st["latitude"],
                "longitude": st["longitude"],
                "station_id": st["id"],
            })
    return {"success": True, "data": results, "count": len(results)}
