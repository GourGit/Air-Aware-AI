"""FastAPI middleware: request ID injection, timing, and logging."""

from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger, request_id_ctx, user_id_ctx

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique ``X-Request-ID`` header to every request/response."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_ctx.set(rid)
        request.state.request_id = rid

        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


class TimingMiddleware(BaseHTTPMiddleware):
    """Add ``X-Process-Time`` header to every response."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log every request/response pair with method, path, and status."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        logger.info(
            "→ %s %s",
            request.method,
            request.url.path,
        )
        response = await call_next(request)
        process_time = response.headers.get("X-Process-Time", "?")
        logger.info(
            "← %s %s %s (%s)",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
        )
        return response
