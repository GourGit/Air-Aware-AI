"""Repository for user profile models."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import UserProfile
from app.models.user import User


class UserRepository:
    """Data access for users and profiles."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID."""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        result = await self.session.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_user_profile(self, user_id: UUID) -> Optional[UserProfile]:
        """Get a user's profile."""
        result = await self.session.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_user_profile(self, profile: UserProfile) -> UserProfile:
        """Create a user profile."""
        self.session.add(profile)
        await self.session.flush()
        await self.session.refresh(profile)
        return profile

    async def update_user_profile(self, profile: UserProfile) -> UserProfile:
        """Update a user profile."""
        await self.session.flush()
        await self.session.refresh(profile)
        return profile