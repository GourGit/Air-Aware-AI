"""Redis-backed sliding-window rate limiter."""

from __future__ import annotations

import time
from typing import Any

import redis.asyncio as aioredis

from app.config import get_settings
from app.core.exceptions import RateLimitError

_settings = get_settings()


class RateLimiter:
    """Sliding-window rate limiter backed by Redis sorted sets.

    Usage::

        limiter = RateLimiter(redis)
        await limiter.check("user:123", max_requests=60, window_seconds=60)
    """

    def __init__(self, redis_client: aioredis.Redis) -> None:
        self._redis = redis_client

    async def check(
        self,
        key: str,
        max_requests: int = 60,
        window_seconds: int = 60,
    ) -> dict[str, Any]:
        """Raise ``RateLimitError`` when the caller exceeds their quota.

        Returns a dict with ``remaining`` and ``reset`` for informational
        headers.
        """
        now = time.time()
        window_start = now - window_seconds
        redis_key = f"ratelimit:{key}"

        pipe = self._redis.pipeline()
        # Remove entries outside the current window
        pipe.zremrangebyscore(redis_key, 0, window_start)
        # Add the current request
        pipe.zadd(redis_key, {str(now): now})
        # Count entries in the window
        pipe.zcard(redis_key)
        # Set expiry so keys don't linger forever
        pipe.expire(redis_key, window_seconds + 1)
        results = await pipe.execute()

        request_count: int = results[2]
        remaining = max(0, max_requests - request_count)
        reset_at = now + window_seconds

        if request_count > max_requests:
            raise RateLimitError(
                message="Rate limit exceeded. Try again later.",
                detail={
                    "retry_after_seconds": window_seconds,
                    "limit": max_requests,
                },
            )

        return {"remaining": remaining, "reset": reset_at}
