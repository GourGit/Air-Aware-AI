"""AirAware AI — FastAPI application entry point.

Provides:
- Lifespan handler (database + Redis startup / shutdown)
- CORS, request-logging, timing middleware
- Rate limiting
- Security headers
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
from app.api.rate_limit import create_rate_limiter
from app.api.security_headers import SecurityHeadersMiddleware
from app.api.routes import api_router
from app.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import get_logger, setup_logging
from app.database.session import engine

logger = get_logger(__name__)

# ── Request size limit middleware ──────────────────────────────
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Limit request body size to prevent DoS."""
    
    def __init__(self, app, max_size: int = 1_048_576):  # 1MB default
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_size:
            return JSONResponse(
                status_code=413,
                content={
                    "status_code": 413,
                    "message": "Request entity too large",
                    "detail": f"Maximum request size is {self.max_size} bytes",
                },
            )
        return await call_next(request)


# ── Lifespan ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle events."""
    setup_logging()
    logger.info("Starting AirAware AI API …")

    # Initialise Redis pool with graceful fallback
    try:
        await init_redis()
        logger.info("Redis connection pool established")
    except Exception:
        logger.warning("Redis unavailable — running in local memory mode without caching")

    # Check Database connection with graceful fallback
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL connection established")
    except Exception as exc:
        logger.warning("PostgreSQL not detected or still booting (%s). Backend running in local resilient mode.", exc)

    logger.info("AirAware AI API ready on http://localhost:8000 ✓")
    yield

    # Shutdown
    logger.info("Shutting down AirAware AI API …")
    try:
        await close_redis()
    except Exception:
        pass
    try:
        await engine.dispose()
    except Exception:
        pass
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
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time", "X-RateLimit-*"],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(BodySizeLimitMiddleware, max_size=1_048_576)  # 1MB
    app.add_middleware(create_rate_limiter(
        default_requests=100,
        default_window=60,
        endpoint_limits={
            "/api/v1/auth/login": (5, 300),
            "/api/v1/auth/register": (3, 300),
            "/api/v1/auth/refresh": (10, 60),
            "/api/v1/assistant/chat": (20, 60),
        }
    ))
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
