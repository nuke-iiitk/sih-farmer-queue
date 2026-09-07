"""Officer authentication dependency (gated by REQUIRE_OFFICER_AUTH).

When `REQUIRE_OFFICER_AUTH=false` (development/demo default) officer-only
mutations are open so the prototype UI keeps working. Set the flag to true in
production to enforce bearer tokens issued by `POST /api/auth/officer/login`.
"""

from __future__ import annotations

from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings
from .services.errors import AuthError
from .services.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


async def require_officer(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> None:
    if not settings.require_officer_auth:
        return
    if credentials is None:
        raise AuthError("Officer authentication required")
    payload = decode_access_token(credentials.credentials)
    if payload is None or payload.get("role") != "OFFICER":
        raise AuthError("Invalid or expired officer token")
