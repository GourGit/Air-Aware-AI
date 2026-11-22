"""Common / shared Pydantic v2 schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ErrorResponse(BaseModel):
    """Standard error envelope."""

    model_config = ConfigDict(from_attributes=True)

    status_code: int
    message: str
    detail: Any | None = None


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str
    timestamp: datetime
    version: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""

    items: list[T]
    total: int
    page: int
    size: int
    pages: int
