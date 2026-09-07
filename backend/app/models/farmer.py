"""Farmer model."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Optional


from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .mixins import TimestampMixin


class Farmer(Base, TimestampMixin):
    __tablename__ = "farmers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # Privacy: only a salted HMAC hash of the Aadhaar number is stored — never
    # the number itself and never a reversible plaintext value.
    aadhaar_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    village: Mapped[Optional[str]] = mapped_column(String(96), nullable=True)
    land_size_acres: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    preferred_crop: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    quantity_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    preferred_centre_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("procurement_centres.id", ondelete="SET NULL"), nullable=True
    )
    # NULL password_hash => OTP-only login (demo/dev flow). Never plaintext.
    password_hash: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    preferred_centre = relationship("ProcurementCentre", lazy="selectin")
    queue_entries = relationship(
        "QueueEntry", back_populates="farmer", foreign_keys="QueueEntry.farmer_id"
    )
    procurements = relationship("ProcurementRecord", back_populates="farmer")
    payments = relationship("Payment", back_populates="farmer")
    notifications = relationship(
        "Notification", back_populates="farmer", foreign_keys="Notification.farmer_id"
    )

    __table_args__ = (
        Index("ix_farmers_state_district", "state", "district"),
        Index("ix_farmers_created_at", "created_at"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Farmer {self.farmer_code} {self.phone}>"
