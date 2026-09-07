"""Queue entry — a farmer's token in a centre's live queue.

This is the table the frontend's `Booking` concept maps to: it carries the
token number, produce/quantity intent and the lifecycle status.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional


from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import QueueEntryStatus
from .mixins import TimestampMixin


class QueueEntry(Base, TimestampMixin):
    __tablename__ = "queue_entries"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False
    )
    centre_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_centres.id", ondelete="CASCADE"), nullable=False
    )
    slot_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("slots.id", ondelete="CASCADE"), nullable=False
    )

    #: Sequential number issued per centre via the token_counters table.
    token_number: Mapped[int] = mapped_column(Integer, nullable=False)
    #: Display form, e.g. "FPP-1042".
    token_code: Mapped[str] = mapped_column(String(24), nullable=False)

    produce: Mapped[str] = mapped_column(String(64), nullable=False)
    quantity_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[QueueEntryStatus] = mapped_column(
        String(16), default=QueueEntryStatus.WAITING, index=True, nullable=False
    )
    arrived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )
    called_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    in_progress_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    farmer = relationship(
        "Farmer", back_populates="queue_entries", foreign_keys=[farmer_id], lazy="selectin"
    )
    centre = relationship("ProcurementCentre", back_populates="queue_entries", lazy="selectin")
    slot = relationship("Slot", back_populates="queue_entries", lazy="selectin")
    procurement = relationship(
        "ProcurementRecord", back_populates="queue_entry", uselist=False, lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("centre_id", "token_number", name="uq_queue_centre_token"),
        # Duplicate-join guard: a farmer can hold only one ACTIVE entry per
        # centre. Enforced in the DB, not just application code.
        Index(
            "uq_queue_farmer_active_per_centre",
            "farmer_id",
            "centre_id",
            unique=True,
            postgresql_where=text("status IN ('WAITING','CALLED','IN_PROGRESS','ON_HOLD')"),
        ),
        Index("ix_queue_farmer_id", "farmer_id"),
        Index("ix_queue_centre_id", "centre_id"),
        Index("ix_queue_slot_id", "slot_id"),
        Index("ix_queue_centre_status_token", "centre_id", "status", "token_number"),
        Index("ix_queue_token_code", "token_code"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<QueueEntry {self.token_code} {self.status}>"
