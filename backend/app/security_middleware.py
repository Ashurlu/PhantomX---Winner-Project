"""Lightweight, dependency-free protections for a single-process deployment.

Not a substitute for a real WAF/reverse-proxy limiter in front of a
multi-worker deployment, but stops trivial brute-force / signup-spam
scripts from hammering this instance, and adds the response headers
browsers use to prevent MIME-sniffing and clickjacking.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

_WINDOW_SECONDS = 60
_LIMITS = {
    "/api/v1/auth/login": 10,
    "/api/v1/auth/signup": 5,
}

_hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Behind Vercel/App Service every request arrives from a proxy IP, so key on the
    # originating client. App Service appends ":port" to it, which must be stripped or
    # every new connection would get a fresh bucket.
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not ip:
        return request.client.host if request.client else "unknown"
    if ip.startswith("["):
        return ip[1 : ip.find("]")]
    if ip.count(":") == 1:
        return ip.split(":")[0]
    return ip


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP sliding-window limit on login/signup to slow brute-force attempts."""

    async def dispatch(self, request: Request, call_next):
        limit = _LIMITS.get(request.url.path)
        if limit is not None and request.method == "POST":
            key = (_client_ip(request), request.url.path)
            now = time.monotonic()
            bucket = _hits[key]
            while bucket and now - bucket[0] > _WINDOW_SECONDS:
                bucket.popleft()
            if len(bucket) >= limit:
                return JSONResponse(
                    {"detail": "Too many attempts. Please wait a minute and try again."},
                    status_code=429,
                )
            bucket.append(now)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Standard hardening headers (defense in depth; app is also behind HTTPS at the edge)."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response
