"""Slot model — a bookable time window at a centre."""

from __future__ import annotations

import uuid
from datetime import date, time
from typing import Optional


from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Time,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import SlotStatus
from ..services.enum_utils import to_enum  # type: ignore[attr-defined]
from .mixins import TimestampMixin


class Slot(Base, TimestampMixin):
    __tablename__ = "slots"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    centre_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_centres.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=12, nullable=False)
    booked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[SlotStatus] = mapped_column(
        String(16), default=SlotStatus.ACTIVE, index=True, nullable=False
    )
    note: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)

    centre = relationship("ProcurementCentre", back_populates="slots")
    queue_entries = relationship("QueueEntry", back_populates="slot")

    __table_args__ = (
        UniqueConstraint("centre_id", "date", "start_time", name="uq_slot_centre_date_start"),
        Index("ix_slots_centre_date", "centre_id", "date"),
        CheckConstraint("capacity > 0", name="ck_slot_capacity_positive"),
        CheckConstraint(
            "booked_count >= 0 AND booked_count <= capacity", name="ck_slot_booked_bounds"
        ),
    )

    @property
    def is_closed(self) -> bool:
        return to_enum(SlotStatus, self.status) == SlotStatus.CLOSED

    @property
    def remaining(self) -> int:
        return max(0, self.capacity - self.booked_count)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Slot {self.centre_id} {self.date} {self.start_time}>"
