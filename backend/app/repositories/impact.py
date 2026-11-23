"""Repository for impact tracking models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.impact import ImpactRecord, SustainabilityAction


class ImpactRepository:
    """Data access for impact records and sustainability actions."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_latest_impact_record(self, user_id: UUID) -> Optional[ImpactRecord]:
        """Get the most recent impact record for a user."""
        result = await self.session.execute(
            select(ImpactRecord)
            .where(ImpactRecord.user_id == user_id)
            .order_by(desc(ImpactRecord.period_end))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_impact_records(
        self,
        user_id: UUID,
        period_type: Optional[str] = None,
        limit: int = 10,
    ) -> list[ImpactRecord]:
        """Get impact records for a user."""
        query = select(ImpactRecord).where(ImpactRecord.user_id == user_id)
        if period_type:
            query = query.where(ImpactRecord.period_type == period_type)
        query = query.order_by(desc(ImpactRecord.period_end)).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_impact_record(self, record: ImpactRecord) -> ImpactRecord:
        """Create a new impact record."""
        self.session.add(record)
        await self.session.flush()
        await self.session.refresh(record)
        return record

    async def get_sustainability_actions(
        self,
        user_id: Optional[UUID] = None,
        completed: Optional[bool] = None,
    ) -> list[SustainabilityAction]:
        """Get sustainability actions."""
        query = select(SustainabilityAction)
        if user_id:
            query = query.where(SustainabilityAction.user_id == user_id)
        if completed is not None:
            query = query.where(SustainabilityAction.is_completed == completed)
        query = query.order_by(desc(SustainabilityAction.created_at))
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_completed_actions_count(self, user_id: UUID) -> int:
        """Get count of completed sustainability actions for a user."""
        result = await self.session.execute(
            select(func.count(SustainabilityAction.id)).where(
                SustainabilityAction.user_id == user_id,
                SustainabilityAction.is_completed == True,  # noqa: E712
            )
        )
        return result.scalar() or 0

    async def get_total_co2_saved(self, user_id: UUID) -> float:
        """Get total CO2 saved in grams for a user."""
        result = await self.session.execute(
            select(func.coalesce(func.sum(ImpactRecord.total_co2_grams), 0)).where(
                ImpactRecord.user_id == user_id
            )
        )
        return result.scalar() or 0.0

    async def get_total_sustainable_km(self, user_id: UUID) -> float:
        """Get total sustainable distance in km for a user."""
        result = await self.session.execute(
            select(func.coalesce(func.sum(ImpactRecord.total_distance_km), 0)).where(
                ImpactRecord.user_id == user_id
            )
        )
        return result.scalar() or 0.0

    async def get_total_trips(self, user_id: UUID) -> int:
        """Get total trips logged for a user."""
        result = await self.session.execute(
            select(func.coalesce(func.sum(ImpactRecord.total_trips), 0)).where(
                ImpactRecord.user_id == user_id
            )
        )
        return result.scalar() or 0