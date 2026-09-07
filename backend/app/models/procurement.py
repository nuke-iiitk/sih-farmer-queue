"""Procurement record — the outcome of a completed queue visit."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional


from sqlalchemy import ForeignKey, Index, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import ProcurementStatus, QualityStatus
from .mixins import TimestampMixin


class ProcurementRecord(Base, TimestampMixin):
    __tablename__ = "procurement_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False
    )
    centre_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_centres.id", ondelete="CASCADE"), nullable=False
    )
    queue_entry_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("queue_entries.id", ondelete="SET NULL"), nullable=True
    )

    crop: Mapped[str] = mapped_column(String(64), nullable=False)
    quantity_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(8), default="KG", nullable=False)
    quality_status: Mapped[QualityStatus] = mapped_column(
        String(16), default=QualityStatus.PENDING, nullable=False
    )
    procurement_status: Mapped[ProcurementStatus] = mapped_column(
        String(16), default=ProcurementStatus.PENDING, index=True, nullable=False
    )
    rate_per_quintal: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    farmer = relationship("Farmer", back_populates="procurements")
    centre = relationship("ProcurementCentre", back_populates="procurements")
    queue_entry = relationship("QueueEntry", back_populates="procurement")
    payment = relationship("Payment", back_populates="procurement", uselist=False)

    __table_args__ = (
        Index("ix_procurements_farmer_id", "farmer_id"),
        Index("ix_procurements_centre_id", "centre_id"),
        Index("ix_procurements_queue_entry_id", "queue_entry_id"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Procurement {self.id} {self.crop} {self.quantity_kg}>"
