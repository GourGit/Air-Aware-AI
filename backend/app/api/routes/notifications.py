"""Notifications & Alert Preferences routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.models.notification import Notification, NotificationPreference
from app.repositories import NotificationRepository
from app.schemas.notification import NotificationPreferenceUpdate

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    user: CurrentUser,
    db: DBSession,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
):
    """Retrieve in-app notifications."""
    repo = NotificationRepository(db)
    notifications = await repo.get_user_notifications(
        user_id=user.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )

    return {
        "success": True,
        "data": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.body,
                "type": n.notification_type,
                "severity": n.payload.get("severity", "info") if n.payload else "info",
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
    }


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    user: CurrentUser,
    db: DBSession,
):
    """Mark alert as read."""
    repo = NotificationRepository(db)
    updated = await repo.mark_as_read(notification_id)
    if not updated or updated.user_id != user.id:
        return {"success": False, "message": "Notification not found"}

    return {
        "success": True,
        "data": {
            "id": str(updated.id),
            "title": updated.title,
            "message": updated.body,
            "type": updated.notification_type,
            "severity": updated.payload.get("severity", "info") if updated.payload else "info",
            "is_read": updated.is_read,
            "created_at": updated.created_at.isoformat(),
        },
    }


@router.get("/preferences")
async def get_notification_preferences(
    user: CurrentUser,
    db: DBSession,
):
    """Get alert thresholds and schedule settings."""
    repo = NotificationRepository(db)
    prefs = await repo.get_user_preferences(user.id)

    # Return defaults if no preferences set
    if not prefs:
        return {
            "success": True,
            "data": {
                "aqi_threshold": 200,
                "daily_summary_time": "07:30",
                "notify_routine": True,
                "notify_indoor_maintenance": True,
            },
        }

    return {
        "success": True,
        "data": {
            p.notification_type: {"channel": p.channel, "enabled": p.is_enabled, "settings": p.settings}
            for p in prefs
        },
    }


@router.put("/preferences")
async def update_notification_preferences(
    req: NotificationPreferenceUpdate,
    user: CurrentUser,
    db: DBSession,
):
    """Update alert thresholds."""
    repo = NotificationRepository(db)

    # Convert request to preference objects
    prefs_data = req.model_dump()
    created = []
    for pref_data in prefs_data.get("preferences", []):
        pref = NotificationPreference(
            user_id=user.id,
            notification_type=pref_data["notification_type"],
            channel=pref_data["channel"],
            is_enabled=pref_data.get("is_enabled", True),
            settings=pref_data.get("settings"),
        )
        saved = await repo.upsert_preference(pref)
        created.append(saved)

    return {"success": True, "data": req.model_dump()}
