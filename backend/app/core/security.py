"""Password hashing, JWT creation / verification, and auth dependencies."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database.session import get_db

_settings = get_settings()
_bearer_scheme = HTTPBearer(auto_error=True)
_bearer_scheme_optional = HTTPBearer(auto_error=False)

# ── Password hashing ─────────────────────────────────────────
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


# ── JWT helpers ───────────────────────────────────────────────

def create_access_token(
    subject: str | uuid.UUID,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Create a short-lived access token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=_settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, _settings.JWT_SECRET_KEY, algorithm=_settings.JWT_ALGORITHM)


def create_refresh_token(subject: str | uuid.UUID) -> str:
    """Create a long-lived refresh token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=_settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, _settings.JWT_SECRET_KEY, algorithm=_settings.JWT_ALGORITHM)


def verify_token(token: str, expected_type: str = "access") -> dict[str, Any]:
    """Decode and validate a JWT, returning its payload.

    Raises ``HTTPException(401)`` on any failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            _settings.JWT_SECRET_KEY,
            algorithms=[_settings.JWT_ALGORITHM],
        )
        token_type = payload.get("type")
        if token_type != expected_type:
            raise credentials_exception
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exception
        return payload
    except JWTError as exc:
        raise credentials_exception from exc


# ── FastAPI dependencies ──────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return the authenticated ``User`` or raise 401."""
    from app.models.user import User  # local import to avoid circular deps

    payload = verify_token(credentials.credentials, expected_type="access")
    user_id = payload["sub"]

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme_optional),
    db: AsyncSession = Depends(get_db),
) -> Any | None:
    """Return the authenticated ``User`` or ``None`` (no error)."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
