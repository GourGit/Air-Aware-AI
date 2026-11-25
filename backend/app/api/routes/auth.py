"""Authentication routes — register, login, refresh, logout, me."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import DBSession, CurrentUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token,
    _bearer_scheme,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.token_blacklist import add_token_to_blacklist

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
async def register(body: RegisterRequest, db: DBSession) -> UserResponse:
    """Register a new user with email and password."""
    # Check for existing email
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse, summary="Authenticate and get tokens")
async def login(body: LoginRequest, db: DBSession) -> TokenResponse:
    """Authenticate with email + password and receive JWT tokens."""
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh(body: RefreshRequest, db: DBSession) -> TokenResponse:
    """Exchange a valid refresh token for a new access + refresh pair."""
    payload = verify_token(body.refresh_token, expected_type="refresh")
    user_id = payload["sub"]

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Blacklist the old refresh token
    await add_token_to_blacklist(body.refresh_token)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Log out")
async def logout(
    user: CurrentUser,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> None:
    """Log out the current user by blacklisting their tokens."""
    # Blacklist the access token
    await add_token_to_blacklist(credentials.credentials)
    return None


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT, summary="Delete account")
async def delete_account(
    user: CurrentUser,
    db: DBSession,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> None:
    """Permanently delete the current user's account and all associated data."""
    # Blacklist current tokens
    await add_token_to_blacklist(credentials.credentials)
    
    # Delete user (cascades to related data via FK)
    await db.delete(user)
    await db.flush()
    return None


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def me(user: CurrentUser) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )
