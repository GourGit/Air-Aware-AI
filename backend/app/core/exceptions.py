"""Custom exception hierarchy for the AirAware AI platform."""

from __future__ import annotations

from typing import Any


class AppException(Exception):
    """Base application exception.

    All custom exceptions inherit from this so they can be caught with
    a single handler in ``main.py``.
    """

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = 500,
        detail: Any = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found (HTTP 404)."""

    def __init__(self, message: str = "Resource not found", detail: Any = None) -> None:
        super().__init__(message=message, status_code=404, detail=detail)


class UnauthorizedError(AppException):
    """Authentication failure (HTTP 401)."""

    def __init__(self, message: str = "Not authenticated", detail: Any = None) -> None:
        super().__init__(message=message, status_code=401, detail=detail)


class ForbiddenError(AppException):
    """Authorisation failure (HTTP 403)."""

    def __init__(self, message: str = "Forbidden", detail: Any = None) -> None:
        super().__init__(message=message, status_code=403, detail=detail)


class ValidationError(AppException):
    """Request validation failure (HTTP 422)."""

    def __init__(self, message: str = "Validation error", detail: Any = None) -> None:
        super().__init__(message=message, status_code=422, detail=detail)


class ExternalServiceError(AppException):
    """An upstream / third-party API call failed (HTTP 502)."""

    def __init__(
        self,
        message: str = "External service error",
        detail: Any = None,
    ) -> None:
        super().__init__(message=message, status_code=502, detail=detail)


class RateLimitError(AppException):
    """Rate limit exceeded (HTTP 429)."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        detail: Any = None,
    ) -> None:
        super().__init__(message=message, status_code=429, detail=detail)
