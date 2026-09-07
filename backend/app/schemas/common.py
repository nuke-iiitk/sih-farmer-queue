"""Shared/common schemas."""

from __future__ import annotations

from pydantic import BaseModel


class ApiMessage(BaseModel):
    """Simple `{ "message": ... }` response."""

    message: str


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str
