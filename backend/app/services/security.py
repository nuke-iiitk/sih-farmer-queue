"""Password hashing, Aadhaar hashing and signed auth tokens.

Deliberately dependency-free: PBKDF2-HMAC-SHA256 (stdlib) for passwords and an
HMAC-SHA256 signed token for sessions. Passwords and Aadhaar numbers are never
stored in plaintext or reversible form.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from ..config import settings

_PBKDF2_ITERATIONS = 240_000


# ----------------------------------------------------------------- passwords
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: Optional[str]) -> bool:
    if not stored:
        return False
    try:
        algorithm, iterations, salt_hex, digest_hex = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


# ------------------------------------------------------------------- aadhaar
def hash_aadhaar(aadhaar: str) -> str:
    """Salted HMAC — lets us detect duplicate registrations without storing
    the (sensitive) Aadhaar number itself."""
    return hmac.new(
        settings.secret_key.encode("utf-8"), aadhaar.encode("utf-8"), hashlib.sha256
    ).hexdigest()


# -------------------------------------------------------------------- tokens
def _sign(payload: bytes) -> str:
    return hmac.new(settings.secret_key.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def create_access_token(*, subject: str, role: str) -> tuple[str, datetime]:
    """Returns `(token, expires_at)`; token = base64(payload) + '.' + hmac."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.token_ttl_minutes)
    payload = json.dumps(
        {"sub": subject, "role": role, "exp": int(expires_at.timestamp())},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    return f"{encoded}.{_sign(payload)}", expires_at


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Returns the payload dict, or None when invalid/expired."""
    try:
        encoded, signature = token.split(".", 1)
        payload = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        if not hmac.compare_digest(_sign(payload), signature):
            return None
        data = json.loads(payload)
        if int(data.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return data
    except (ValueError, TypeError, json.JSONDecodeError):
        return None
