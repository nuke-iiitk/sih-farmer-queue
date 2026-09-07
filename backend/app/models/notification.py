"""Notification model — in-app farmer notifications."""

from __future__ import annotations

import uuid
from typing import Optional


from sqlalchemy import Boolean, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .enums import NotificationType
from .mixins import TimestampMixin


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"), nullable=True
    )
    type: Mapped[NotificationType] = mapped_column(
        String(16), default=NotificationType.INFO, nullable=False
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    farmer = relationship("Farmer", back_populates="notifications", foreign_keys=[farmer_id])

    __table_args__ = (
        Index("ix_notifications_farmer_read", "farmer_id", "read"),
        Index("ix_notifications_created_at", "created_at"),
    )
