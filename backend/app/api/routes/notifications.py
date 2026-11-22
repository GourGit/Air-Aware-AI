"""Notifications & Alert Preferences routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.notification import NotificationPreferenceUpdate

router = APIRouter(prefix="/notifications", tags=["Notifications"])

_USER_NOTIFICATIONS = [
    {
        "id": "notif-001",
        "title": "Severe Air Quality Spike Detected",
        "message": "AQI in Anand Vihar has reached 342 (Very Poor). Outdoor aerobic activity is not recommended.",
        "type": "aqi_spike",
        "severity": "critical",
        "is_read": False,
        "created_at": "2026-11-22T05:30:00Z",
    },
    {
        "id": "notif-002",
        "title": "Daily Air Quality Brief",
        "message": "Today's forecasted peak dispersion is between 1:00 PM and 3:30 PM. Plan outdoor errands accordingly.",
        "type": "daily_summary",
        "severity": "info",
        "is_read": True,
        "created_at": "2026-11-22T02:00:00Z",
    },
    {
        "id": "notif-003",
        "title": "Air Purifier Filter Check",
        "message": "It has been 30 days since your last pre-filter cleaning reminder. Inspect mesh for dust buildup.",
        "type": "maintenance",
        "severity": "warning",
        "is_read": False,
        "created_at": "2026-11-21T10:00:00Z",
    },
]


@router.get("")
async def get_notifications():
    """Retrieve in-app notifications."""
    return {"success": True, "data": _USER_NOTIFICATIONS}


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark alert as read."""
    for n in _USER_NOTIFICATIONS:
        if n["id"] == notification_id:
            n["is_read"] = True
            return {"success": True, "data": n}
    return {"success": True, "message": "Updated"}


@router.get("/preferences")
async def get_notification_preferences():
    """Get alert thresholds and schedule settings."""
    return {
        "success": True,
        "data": {
            "aqi_threshold": 200,
            "daily_summary_time": "07:30",
            "notify_routine": True,
            "notify_indoor_maintenance": True,
        },
    }


@router.put("/preferences")
async def update_notification_preferences(req: NotificationPreferenceUpdate):
    """Update alert thresholds."""
    return {"success": True, "data": req.model_dump()}
