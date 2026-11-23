"""Repository for mobility tracking models."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mobility import EmissionFactor, MobilityRecord


class MobilityRepository:
    """Data access for mobility records and emission factors."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_mobility_records(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MobilityRecord]:
        """Get mobility records for a user."""
        result = await self.session.execute(
            select(MobilityRecord)
            .where(MobilityRecord.user_id == user_id)
            .order_by(desc(MobilityRecord.recorded_at))
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_mobility_records_count(self, user_id: UUID) -> int:
        """Get total count of mobility records for a user."""
        result = await self.session.execute(
            select(func.count(MobilityRecord.id)).where(MobilityRecord.user_id == user_id)
        )
        return result.scalar() or 0

    async def create_mobility_record(self, record: MobilityRecord) -> MobilityRecord:
        """Create a new mobility record."""
        self.session.add(record)
        await self.session.flush()
        await self.session.refresh(record)
        return record

    async def get_emission_factors(self) -> list[EmissionFactor]:
        """Get all emission factors."""
        result = await self.session.execute(select(EmissionFactor).order_by(EmissionFactor.transport_mode))
        return list(result.scalars().all())

    async def get_emission_factor(self, transport_mode: str) -> Optional[EmissionFactor]:
        """Get emission factor for a specific transport mode."""
        result = await self.session.execute(
            select(EmissionFactor).where(EmissionFactor.transport_mode == transport_mode)
        )
        return result.scalar_one_or_none()

    async def create_emission_factor(self, factor: EmissionFactor) -> EmissionFactor:
        """Create or update an emission factor."""
        existing = await self.get_emission_factor(factor.transport_mode)
        if existing:
            existing.co2_per_km = factor.co2_per_km
            existing.unit = factor.unit
            existing.source = factor.source
            existing.notes = factor.notes
            await self.session.flush()
            await self.session.refresh(existing)
            return existing
        self.session.add(factor)
        await self.session.flush()
        await self.session.refresh(factor)
        return factor