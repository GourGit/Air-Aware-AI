"""Health-check and system status endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.dependencies import get_redis
from app.database.session import engine
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic liveness probe."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
    )


@router.get("/health/ready")
async def readiness_check() -> JSONResponse:
    """Deep readiness check — verifies database and Redis connectivity.
    
    Returns HTTP 200 when all core infrastructure is connected and ready.
    Returns HTTP 503 if the database or required services are unavailable.
    """
    checks: dict[str, str] = {}
    is_ready = True

    # Database readiness check
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        is_ready = False
        checks["database"] = f"unavailable: {str(exc)}"

    # Redis readiness check (optional / cache)
    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"unavailable: {str(exc)}"

    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    content = {
        "status": "ready" if is_ready else "not_ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }
    return JSONResponse(status_code=status_code, content=content)


@router.get("/system/status")
async def system_status() -> dict[str, Any]:
    """Public system status overview."""
    return {
        "service": "AirAware AI API",
        "version": "1.0.0",
        "environment": "running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
