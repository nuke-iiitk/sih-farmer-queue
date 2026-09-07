"""Procurement centre schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


def centre_status_title(value: str) -> str:
    """`OPEN` -> `Open` (matches the frontend's CentreStatus union)."""
    return value.capitalize()


class CentreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    centre_code: str
    name: str
    state: str
    district: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    opening_hours: Optional[str] = None
    capacity_per_day: int
    crops: list[str]
    status: str
    distance_km: Optional[float] = None
    created_at: datetime
    updated_at: datetime
