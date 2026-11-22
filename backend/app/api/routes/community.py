"""Community pollution reporting routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.community import CommunityReportCreate, ReportModerationRequest

router = APIRouter(prefix="/community", tags=["Community Reports"])

# In-memory store for demonstration / development resilience
_COMMUNITY_REPORTS = [
    {
        "id": "rep-001",
        "category": "waste_burning",
        "description": "Open plastic and leaf burning in vacant plot near Anand Vihar bus terminus. Thick black smoke spreading across residential colony.",
        "latitude": 28.6520,
        "longitude": 77.3160,
        "approx_location_name": "Anand Vihar Sector 4",
        "image_url": None,
        "status": "approved",
        "observed_at": "2026-11-22T04:15:00Z",
        "created_at": "2026-11-22T04:20:00Z",
    },
    {
        "id": "rep-002",
        "category": "construction_dust",
        "description": "Uncovered sand and demolition debris on main road without water sprinkling or green netting.",
        "latitude": 22.5820,
        "longitude": 88.4350,
        "approx_location_name": "Salt Lake Sector V Ring Road",
        "image_url": None,
        "status": "approved",
        "observed_at": "2026-11-22T03:30:00Z",
        "created_at": "2026-11-22T03:35:00Z",
    },
]


@router.get("/reports")
async def list_community_reports():
    """List approved community pollution reports with location coordinates."""
    return {"success": True, "data": _COMMUNITY_REPORTS, "count": len(_COMMUNITY_REPORTS)}


@router.post("/reports")
async def create_community_report(req: CommunityReportCreate):
    """Submit a citizen pollution observation report."""
    report = {
        "id": f"rep-{uuid.uuid4().hex[:6]}",
        "category": req.category,
        "description": req.description,
        "latitude": round(req.latitude, 4),  # Geoprivacy rounding
        "longitude": round(req.longitude, 4),
        "approx_location_name": req.approx_location_name,
        "image_url": req.image_url,
        "status": "approved",  # auto-approve for dev testing
        "observed_at": req.observed_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _COMMUNITY_REPORTS.insert(0, report)
    return {"success": True, "data": report}


@router.post("/reports/{report_id}/moderate")
async def moderate_report(report_id: str, req: ReportModerationRequest):
    """Moderate report status (Admin / Moderator)."""
    for r in _COMMUNITY_REPORTS:
        if r["id"] == report_id:
            r["status"] = req.decision
            return {"success": True, "data": r}
    return {"success": False, "message": "Report not found"}
