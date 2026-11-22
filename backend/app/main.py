"""AirAware AI — FastAPI application entry point.

Provides:
- Lifespan handler (database + Redis startup / shutdown)
- CORS, request-logging, timing middleware
- Global exception handlers
- API v1 router mounting
- Root health check
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.dependencies import close_redis, init_redis
from app.api.middleware import LoggingMiddleware, RequestIDMiddleware, TimingMiddleware
from app.api.routes import api_router
from app.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import get_logger, setup_logging
from app.database.session import engine

logger = get_logger(__name__)


# ── Lifespan ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle events."""
    # Startup
    setup_logging()
    logger.info("Starting AirAware AI API …")

    # Initialise Redis pool
    try:
        await init_redis()
        logger.info("Redis connection pool established")
    except Exception:
        logger.warning("Redis unavailable — features that need it will degrade gracefully")

    logger.info("AirAware AI API ready ✓")
    yield

    # Shutdown
    logger.info("Shutting down AirAware AI API …")
    await close_redis()
    await engine.dispose()
    logger.info("Cleanup complete, goodbye.")


# ── App factory ───────────────────────────────────────────────

def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="AirAware AI API",
        description=(
            "Intelligent air-quality monitoring and sustainability platform. "
            "Uses Indian CPCB AQI standards."
        ),
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── Middleware (order matters: outermost first) ────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(TimingMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # ── Exception handlers ────────────────────────────────────
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status_code": exc.status_code,
                "message": exc.message,
                "detail": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "message": "Internal server error",
                "detail": str(exc) if settings.debug else None,
            },
        )

    # ── Routes ────────────────────────────────────────────────
    app.include_router(api_router, prefix="/api/v1")

    # Root health probe (no prefix)
    @app.get("/", tags=["root"])
    async def root() -> dict[str, str]:
        return {
            "service": "AirAware AI API",
            "status": "healthy",
            "version": "1.0.0",
        }

    return app


app = create_app()
