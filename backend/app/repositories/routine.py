"""Routine repository for database operations."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.routine import DailyRoutine, RoutineItem


class RoutineRepository:
    """Data access for routines and routine items."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_routine(self, routine: DailyRoutine) -> DailyRoutine:
        """Create a new routine with items."""
        self.session.add(routine)
        await self.session.flush()
        await self.session.refresh(routine)
        return routine

    async def get_routine_by_id(self, routine_id: UUID, user_id: UUID) -> Optional[DailyRoutine]:
        """Get routine by ID with ownership check."""
        result = await self.session.execute(
            select(DailyRoutine).where(
                DailyRoutine.id == routine_id,
                DailyRoutine.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_today_routine(self, user_id: UUID, target_date: date) -> Optional[DailyRoutine]:
        """Get active routine for a specific date."""
        result = await self.session.execute(
            select(DailyRoutine).where(
                DailyRoutine.user_id == user_id,
                DailyRoutine.is_active == True,
            ).order_by(desc(DailyRoutine.created_at)).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_user_routines(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[DailyRoutine]:
        """Get all routines for a user."""
        result = await self.session.execute(
            select(DailyRoutine)
            .where(DailyRoutine.user_id == user_id)
            .order_by(desc(DailyRoutine.created_at))
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def update_routine(self, routine: DailyRoutine) -> DailyRoutine:
        """Update a routine."""
        await self.session.flush()
        await self.session.refresh(routine)
        return routine

    async def delete_routine(self, routine: DailyRoutine) -> None:
        """Delete a routine (cascades to items)."""
        await self.session.delete(routine)
        await self.session.flush()

    async def create_routine_item(self, item: RoutineItem) -> RoutineItem:
        """Create a routine item."""
        self.session.add(item)
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def update_routine_item(self, item: RoutineItem) -> RoutineItem:
        """Update a routine item."""
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def toggle_item_completion(
        self, item_id: UUID, user_id: UUID, completed: bool
    ) -> Optional[RoutineItem]:
        """Toggle completion status of a routine item with ownership check."""
        # Join through routine to verify ownership
        result = await self.session.execute(
            select(RoutineItem)
            .join(DailyRoutine)
            .where(
                RoutineItem.id == item_id,
                DailyRoutine.user_id == user_id,
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            return None
        
        # Update completion status - store in notes or add a completed_at field
        if completed:
            item.notes = (item.notes or "") + f"\n[COMPLETED: {datetime.now().isoformat()}]"
        await self.session.flush()
        await self.session.refresh(item)
        return item


from datetime import datetime