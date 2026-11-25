"""Rate limiting middleware with configurable limits."""
from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable, Awaitable

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.core.exceptions import RateLimitError
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for a rate limit bucket."""
    requests: int = 100
    window_seconds: int = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Token bucket rate limiting per IP address."""
    
    def __init__(
        self,
        app,
        default_config: RateLimitConfig = None,
        endpoint_configs: dict[str, RateLimitConfig] = None,
        exempt_paths: list[str] = None,
    ):
        super().__init__(app)
        self.default_config = default_config or RateLimitConfig(requests=100, window_seconds=60)
        self.endpoint_configs = endpoint_configs or {
            "/api/v1/auth/login": RateLimitConfig(requests=5, window_seconds=300),
            "/api/v1/auth/register": RateLimitConfig(requests=3, window_seconds=300),
            "/api/v1/auth/refresh": RateLimitConfig(requests=10, window_seconds=60),
            "/api/v1/assistant/chat": RateLimitConfig(requests=20, window_seconds=60),
        }
        self.exempt_paths = exempt_paths or ["/", "/docs", "/redoc", "/openapi.json", "/health"]
        
        # In-memory store (use Redis in production for multi-instance)
        self._buckets: dict[str, list[float]] = defaultdict(list)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, handling proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _get_config_for_path(self, path: str) -> RateLimitConfig:
        """Get rate limit config for a path, falling back to default."""
        for pattern, config in self.endpoint_configs.items():
            if path.startswith(pattern):
                return config
        return self.default_config
    
    def _is_exempt(self, path: str) -> bool:
        """Check if path is exempt from rate limiting."""
        return any(path.startswith(exempt) for exempt in self.exempt_paths)
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        
        if self._is_exempt(path):
            return await call_next(request)
        
        client_ip = self._get_client_ip(request)
        config = self._get_config_for_path(path)
        key = f"{client_ip}:{path}"
        
        now = time.time()
        window_start = now - config.window_seconds
        
        # Clean old requests
        self._buckets[key] = [ts for ts in self._buckets[key] if ts > window_start]
        
        if len(self._buckets[key]) >= config.requests:
            logger.warning(
                "Rate limit exceeded",
                extra_data={"client_ip": client_ip, "path": path, "limit": config.requests}
            )
            return JSONResponse(
                status_code=429,
                content={
                    "status_code": 429,
                    "message": "Rate limit exceeded",
                    "detail": f"Maximum {config.requests} requests per {config.window_seconds}s",
                    "retry_after": int(config.window_seconds),
                },
                headers={"Retry-After": str(int(config.window_seconds))},
            )
        
        self._buckets[key].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(config.requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, config.requests - len(self._buckets[key])))
        response.headers["X-RateLimit-Reset"] = str(int(now + config.window_seconds))
        return response


def create_rate_limiter(
    default_requests: int = 100,
    default_window: int = 60,
    endpoint_limits: dict[str, tuple[int, int]] = None,
) -> RateLimitMiddleware:
    """Factory to create rate limit middleware with custom config."""
    endpoint_configs = {}
    if endpoint_limits:
        for path, (reqs, window) in endpoint_limits.items():
            endpoint_configs[path] = RateLimitConfig(requests=reqs, window_seconds=window)
    
    def middleware(app):
        return RateLimitMiddleware(
            app,
            default_config=RateLimitConfig(requests=default_requests, window_seconds=default_window),
            endpoint_configs=endpoint_configs,
        )
    return middleware