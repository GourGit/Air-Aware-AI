"""Token blacklist service for JWT revocation."""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Optional

from app.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_settings = get_settings()

# In-memory fallback when Redis is unavailable
_token_blacklist: set[str] = set()


class TokenBlacklist:
    """Manages revoked JWT tokens with Redis backend and in-memory fallback."""
    
    def __init__(self):
        self._redis = None
        self._use_fallback = False
    
    async def _get_redis(self):
        """Get Redis client, falling back to in-memory if unavailable.
        Uses lazy import to avoid circular dependency."""
        if self._use_fallback:
            return None
        try:
            if self._redis is None:
                # Lazy import to avoid circular dependency
                from app.api.dependencies import get_redis
                self._redis = await get_redis()
            return self._redis
        except Exception:
            logger.warning("Redis unavailable for token blacklist, using in-memory fallback")
            self._use_fallback = True
            return None
    
    def _get_key(self, token: str) -> str:
        """Generate Redis key for a token."""
        return f"token_blacklist:{token}"
    
    def _get_ttl(self, token: str) -> int:
        """Calculate TTL based on token expiration."""
        try:
            from jose import jwt
            payload = jwt.decode(
                token,
                _settings.JWT_SECRET_KEY,
                algorithms=[_settings.JWT_ALGORITHM],
                options={"verify_signature": False}
            )
            exp = payload.get("exp", 0)
            ttl = max(1, int(exp - time.time()))
            return min(ttl, _settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400)
        except Exception:
            return _settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400
    
    async def add(self, token: str) -> bool:
        """Add token to blacklist."""
        redis = await self._get_redis()
        ttl = self._get_ttl(token)
        key = self._get_key(token)
        
        if redis:
            try:
                await redis.setex(key, ttl, "1")
                return True
            except Exception as e:
                logger.warning(f"Failed to add token to Redis blacklist: {e}")
        
        # Fallback to in-memory
        _token_blacklist.add(token)
        return True
    
    async def is_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted."""
        redis = await self._get_redis()
        key = self._get_key(token)
        
        if redis:
            try:
                result = await redis.get(key)
                if result is not None:
                    return True
            except Exception as e:
                logger.warning(f"Failed to check token blacklist in Redis: {e}")
        
        # Check in-memory fallback
        return token in _token_blacklist
    
    async def cleanup_expired(self) -> int:
        """Clean up expired in-memory tokens (call periodically)."""
        import time
        from jose import jwt
        
        current_time = time.time()
        expired = set()
        
        for token in _token_blacklist:
            try:
                payload = jwt.decode(
                    token,
                    _settings.JWT_SECRET_KEY,
                    algorithms=[_settings.JWT_ALGORITHM],
                    options={"verify_signature": False}
                )
                if payload.get("exp", 0) < current_time:
                    expired.add(token)
            except Exception:
                expired.add(token)
        
        for token in expired:
            _token_blacklist.discard(token)
        
        return len(expired)


# Global instance
token_blacklist = TokenBlacklist()


async def add_token_to_blacklist(token: str) -> bool:
    """Add a token to the blacklist."""
    return await token_blacklist.add(token)


async def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted."""
    return await token_blacklist.is_blacklisted(token)


async def revoke_user_tokens(user_id: str) -> int:
    """Revoke all tokens for a user (call on password change/logout all).
    
    Note: This is a placeholder. Full implementation would require
    storing user_id in token metadata or maintaining a user->tokens index.
    """
    # This would require additional infrastructure
    # For now, return 0
    return 0


import time