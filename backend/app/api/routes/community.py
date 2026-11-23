"""Community pollution reporting routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser, OptionalUser
from app.models.community import CommunityReport
from app.repositories import CommunityRepository
from app.schemas.community import CommunityReportCreate, ReportModerationRequest

router = APIRouter(prefix="/community", tags=["Community Reports"])


@router.get("/reports")
async def list_community_reports(
    db: DBSession,
    limit: int = 50,
    offset: int = 0,
):
    """List approved community pollution reports with location coordinates."""
    repo = CommunityRepository(db)
    reports = await repo.get_approved_reports(limit=limit, offset=offset)

    return {
        "success": True,
        "data": [
            {
                "id": str(r.id),
                "category": r.report_type,
                "description": r.description,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "approx_location_name": r.address,
                "image_url": (r.image_urls or {}).get("url") if r.image_urls else None,
                "status": r.status,
                "observed_at": r.reported_at.isoformat(),
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ],
        "count": len(reports),
    }


@router.post("/reports")
async def create_community_report(
    req: CommunityReportCreate,
    user: OptionalUser,
    db: DBSession,
):
    """Submit a citizen pollution observation report."""
    if user is None:
        # Allow anonymous reports for development, but require auth in production
        from app.config import get_settings
        settings = get_settings()
        if settings.is_production:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to submit reports",
            )
        # Use a placeholder user ID for anonymous reports in development
        user_id = uuid.UUID("00000000-0000-0000-0000-000000000000")
    else:
        user_id = user.id

    report = CommunityReport(
        id=uuid.uuid4(),
        user_id=user_id,
        report_type=req.category,
        title=req.description[:100] if req.description else "Community Report",
        description=req.description,
        latitude=round(req.latitude, 4),
        longitude=round(req.longitude, 4),
        address=req.approx_location_name,
        severity=1,
        status="pending",
        upvotes=0,
        image_urls={"url": req.image_url} if req.image_url else None,
        reported_at=req.observed_at,
    )
    repo = CommunityRepository(db)
    saved = await repo.create_report(report)

    return {
        "success": True,
        "data": {
            "id": str(saved.id),
            "category": saved.report_type,
            "description": saved.description,
            "latitude": saved.latitude,
            "longitude": saved.longitude,
            "approx_location_name": saved.address,
            "image_url": (saved.image_urls or {}).get("url") if saved.image_urls else None,
            "status": saved.status,
            "observed_at": saved.reported_at.isoformat(),
            "created_at": saved.created_at.isoformat(),
        },
    }


@router.post("/reports/{report_id}/moderate")
async def moderate_report(
    report_id: uuid.UUID,
    req: ReportModerationRequest,
    db: DBSession,
):
    """Moderate report status (Admin / Moderator)."""
    repo = CommunityRepository(db)
    updated = await repo.update_report_status(
        report_id=report_id,
        status=req.decision,
        reason=req.reason,
    )
    if not updated:
        return {"success": False, "message": "Report not found"}

    return {
        "success": True,
        "data": {
            "id": str(updated.id),
            "category": updated.report_type,
            "description": updated.description,
            "latitude": updated.latitude,
            "longitude": updated.longitude,
            "approx_location_name": updated.address,
            "image_url": (updated.image_urls or {}).get("url") if updated.image_urls else None,
            "status": updated.status,
            "observed_at": updated.reported_at.isoformat(),
            "created_at": updated.created_at.isoformat(),
        },
    }
