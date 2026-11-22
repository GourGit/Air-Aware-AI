"""Auth request / response schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

try:
    import email_validator
    from pydantic import EmailStr
except ImportError:
    EmailStr = str

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    """Payload for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="At least 8 characters")
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """Payload for email/password login."""

    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    """Payload for token refresh."""

    refresh_token: str


class TokenResponse(BaseModel):
    """JWT token pair returned on login / refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public representation of a user."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    display_name: str | None = None
    is_active: bool
    created_at: datetime
