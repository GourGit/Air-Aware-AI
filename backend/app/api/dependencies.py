"""Re-usable FastAPI dependencies shared across all routes."""

from __future__ import annotations

from typing import Annotated, Any, AsyncGenerator

import redis.asyncio as aioredis
from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.security import get_current_user, get_current_user_optional
from app.database.session import get_db as _get_db

# ── Database session ──────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async DB session."""
    async for session in _get_db():
        yield session


# ── Redis ─────────────────────────────────────────────────────

_redis_pool: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis:
    """Initialise the global Redis connection pool (called at startup)."""
    global _redis_pool
    settings = get_settings()
    _redis_pool = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    return _redis_pool


async def close_redis() -> None:
    """Shut down the Redis pool (called at shutdown)."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency — returns the shared Redis client."""
    if _redis_pool is None:
        raise RuntimeError("Redis is not initialised")
    return _redis_pool


# ── Pagination ────────────────────────────────────────────────

class PaginationParams:
    """Standard page + size query parameters."""

    def __init__(
        self,
        page: Annotated[int, Query(ge=1, description="Page number")] = 1,
        size: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
    ) -> None:
        self.page = page
        self.size = size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size

    @property
    def limit(self) -> int:
        return self.size


# ── Type aliases for concise route signatures ─────────────────

DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[Any, Depends(get_current_user)]
OptionalUser = Annotated[Any | None, Depends(get_current_user_optional)]
RedisClient = Annotated[aioredis.Redis, Depends(get_redis)]
Pagination = Annotated[PaginationParams, Depends()]
