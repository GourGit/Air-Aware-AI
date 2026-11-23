"""Repository for notification models."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationPreference


class NotificationRepository:
    """Data access for notifications and preferences."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_notifications(
        self,
        user_id: UUID,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Notification]:
        """Get notifications for a user."""
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)  # noqa: E712
        query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_notification_by_id(self, notification_id: UUID) -> Optional[Notification]:
        """Get a notification by ID."""
        result = await self.session.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        return result.scalar_one_or_none()

    async def mark_as_read(self, notification_id: UUID) -> Optional[Notification]:
        """Mark a notification as read."""
        notification = await self.get_notification_by_id(notification_id)
        if not notification:
            return None
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await self.session.flush()
        await self.session.refresh(notification)
        return notification

    async def create_notification(self, notification: Notification) -> Notification:
        """Create a new notification."""
        self.session.add(notification)
        await self.session.flush()
        await self.session.refresh(notification)
        return notification

    async def get_user_preferences(self, user_id: UUID) -> list[NotificationPreference]:
        """Get notification preferences for a user."""
        result = await self.session.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        )
        return list(result.scalars().all())

    async def upsert_preference(self, preference: NotificationPreference) -> NotificationPreference:
        """Create or update a notification preference."""
        existing = await self.session.execute(
            select(NotificationPreference).where(
                NotificationPreference.user_id == preference.user_id,
                NotificationPreference.notification_type == preference.notification_type,
                NotificationPreference.channel == preference.channel,
            )
        )
        existing_pref = existing.scalar_one_or_none()
        if existing_pref:
            existing_pref.is_enabled = preference.is_enabled
            existing_pref.settings = preference.settings
            await self.session.flush()
            await self.session.refresh(existing_pref)
            return existing_pref
        self.session.add(preference)
        await self.session.flush()
        await self.session.refresh(preference)
        return preference