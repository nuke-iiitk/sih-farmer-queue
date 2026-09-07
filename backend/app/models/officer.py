"""Officer model — procurement centre staff accounts."""

from __future__ import annotations

import uuid
from typing import Optional


from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .mixins import TimestampMixin


class Officer(Base, TimestampMixin):
    __tablename__ = "officers"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    officer_code: Mapped[str] = mapped_column(String(24), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    designation: Mapped[str] = mapped_column(String(96), nullable=False)
    centre_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("procurement_centres.id", ondelete="SET NULL"), nullable=True
    )
    password_hash: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    centre = relationship("ProcurementCentre", back_populates="officers", lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Officer {self.officer_code}>"
