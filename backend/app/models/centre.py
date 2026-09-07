"""Procurement centre model."""

from __future__ import annotations

from decimal import Decimal
from typing import Optional


from sqlalchemy import CheckConstraint, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import CentreStatus
from .mixins import TimestampMixin


class ProcurementCentre(Base, TimestampMixin):
    __tablename__ = "procurement_centres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    centre_code: Mapped[str] = mapped_column(String(24), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    state: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    district: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    opening_hours: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    capacity_per_day: Mapped[int] = mapped_column(Integer, default=120, nullable=False)
    crops: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, nullable=False)
    status: Mapped[CentreStatus] = mapped_column(
        String(16), default=CentreStatus.OPEN, index=True, nullable=False
    )
    # Approximate distance from district HQ (demo data; replaced by client-side
    # geo calculation once real coordinates are loaded).
    distance_km: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 1), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)

    slots = relationship("Slot", back_populates="centre", cascade="all, delete-orphan")
    queue_entries = relationship("QueueEntry", back_populates="centre")
    procurements = relationship("ProcurementRecord", back_populates="centre")
    officers = relationship("Officer", back_populates="centre")

    __table_args__ = (
        CheckConstraint("capacity_per_day > 0", name="ck_centre_capacity_positive"),
        Index("ix_centres_state_district", "state", "district"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Centre {self.centre_code} {self.name}>"
