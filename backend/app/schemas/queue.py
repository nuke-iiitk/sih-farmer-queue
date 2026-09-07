"""Queue schemas."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from ..models.enums import QueueEntryStatus


class SlotBrief(BaseModel):
    id: str
    date: str
    start_time: str
    end_time: str


class CentreBrief(BaseModel):
    id: int
    centre_code: str
    name: str
    state: str
    district: str
    address: str


class FarmerBrief(BaseModel):
    id: str
    farmer_code: str
    name: str
    phone: str


class QueueJoinRequest(BaseModel):
    farmer_id: str = Field(min_length=3, max_length=64)  # uuid or farmer_code
    centre_id: str = Field(min_length=1, max_length=32)  # numeric id or centre_code
    slot_id: Optional[str] = None  # preferred: exact slot uuid
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    produce: str = Field(default="Paddy", min_length=1, max_length=64)
    quantity_kg: float = Field(gt=0, le=1_000_000)


class QueueStatusUpdate(BaseModel):
    status: QueueEntryStatus


class QueueSlotMoveRequest(BaseModel):
    slot_id: str


class QueueEntryOut(BaseModel):
    """Full queue-entry/booking view (also drives the frontend Booking type)."""

    id: str
    token_number: int
    token: str
    status: QueueEntryStatus
    booking_status: str  # Upcoming | Waiting | Your Turn | Processing | Completed | Cancelled
    position: Optional[int] = None  # 1-based rank in the live queue (None when finished)
    farmers_ahead: int
    estimated_wait_minutes: int
    arrived: bool
    produce: str
    quantity_kg: float
    joined_at: datetime
    called_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    slot: SlotBrief
    centre: CentreBrief
    farmer: FarmerBrief


class QueueCounts(BaseModel):
    waiting: int
    called: int
    in_progress: int
    on_hold: int
    completed: int
    total_active: int


class QueueCentreResponse(BaseModel):
    centre_id: int
    centre_code: str
    date: str
    entries: list[QueueEntryOut]
    counts: QueueCounts
    last_updated: datetime


class AdvanceResponse(BaseModel):
    completed: Optional[QueueEntryOut] = None
    now_serving: Optional[QueueEntryOut] = None


def quantity(value: Decimal | float | int) -> float:
    return float(value)
