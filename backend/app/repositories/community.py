"""Repository for community reporting models."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import CommunityReport, ReportModeration


class CommunityRepository:
    """Data access for community reports and moderation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_approved_reports(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[CommunityReport]:
        """Get approved community reports."""
        result = await self.session.execute(
            select(CommunityReport)
            .where(CommunityReport.status == "approved")
            .order_by(desc(CommunityReport.reported_at))
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_reports_count(self, status: Optional[str] = None) -> int:
        """Get count of reports."""
        query = select(func.count(CommunityReport.id))
        if status:
            query = query.where(CommunityReport.status == status)
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def create_report(self, report: CommunityReport) -> CommunityReport:
        """Create a new community report."""
        self.session.add(report)
        await self.session.flush()
        await self.session.refresh(report)
        return report

    async def get_report_by_id(self, report_id: UUID) -> Optional[CommunityReport]:
        """Get a report by ID."""
        result = await self.session.execute(
            select(CommunityReport).where(CommunityReport.id == report_id)
        )
        return result.scalar_one_or_none()

    async def update_report_status(
        self,
        report_id: UUID,
        status: str,
        moderator_id: Optional[UUID] = None,
        reason: Optional[str] = None,
    ) -> Optional[CommunityReport]:
        """Update report status and create moderation record."""
        report = await self.get_report_by_id(report_id)
        if not report:
            return None

        report.status = status

        moderation = ReportModeration(
            report_id=report_id,
            moderator_id=moderator_id,
            action=status,
            reason=reason,
        )
        self.session.add(moderation)
        await self.session.flush()
        await self.session.refresh(report)
        return report