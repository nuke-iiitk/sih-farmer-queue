"""Payment model — one payment per procurement record."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional


from sqlalchemy import DateTime, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import PaymentStatus
from .mixins import TimestampMixin


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False
    )
    procurement_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("procurement_records.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        String(16), default=PaymentStatus.PENDING, index=True, nullable=False
    )
    transaction_reference: Mapped[Optional[str]] = mapped_column(
        String(64), unique=True, nullable=True
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    farmer = relationship("Farmer", back_populates="payments")
    procurement = relationship("ProcurementRecord", back_populates="payment")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Payment {self.id} {self.payment_status} {self.amount}>"
