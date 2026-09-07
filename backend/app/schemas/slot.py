"""Slot schemas."""

from __future__ import annotations

from datetime import date, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _hhmm(value: time | str) -> str:
    if isinstance(value, str):
        return value[:5]
    return f"{value.hour:02d}:{value.minute:02d}"


def parse_hhmm(value: str) -> time:
    """`"10:30"` -> `time(10, 30)`."""
    parts = value.split(":")
    hour, minute = int(parts[0]), int(parts[1])
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"Invalid time of day: {value!r}")
    return time(hour=hour, minute=minute)


def iso_date(value: date | str | None) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat() if not isinstance(value, str) else value


class SlotCreate(BaseModel):
    date: date
    start_time: str
    end_time: str
    capacity: int = Field(default=12, ge=1, le=200)

    @field_validator("start_time", "end_time")
    @classmethod
    def _valid_time(cls, value: str) -> str:
        parse_hhmm(value)
        return value


class SlotUpdate(BaseModel):
    capacity: Optional[int] = Field(default=None, ge=1, le=200)
    closed: Optional[bool] = None


class SlotOut(BaseModel):
    """Shape mirrors the frontend `Slot` type (date/start/end as strings)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    centre_id: int
    date: str
    start: str
    end: str
    capacity: int
    booked: int
    closed: bool
    remaining: int

    @classmethod
    def from_model(cls, slot: object) -> "SlotOut":
        return cls(
            id=str(slot.id),  # type: ignore[attr-defined]
            centre_id=slot.centre_id,  # type: ignore[attr-defined]
            date=slot.date.isoformat(),  # type: ignore[attr-defined]
            start=_hhmm(slot.start_time),  # type: ignore[attr-defined]
            end=_hhmm(slot.end_time),  # type: ignore[attr-defined]
            capacity=slot.capacity,  # type: ignore[attr-defined]
            booked=slot.booked_count,  # type: ignore[attr-defined]
            closed=slot.is_closed,  # type: ignore[attr-defined]
            remaining=slot.remaining,  # type: ignore[attr-defined]
        )


__all__ = ["SlotCreate", "SlotOut", "SlotUpdate", "_hhmm", "iso_date", "parse_hhmm"]
