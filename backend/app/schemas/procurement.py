"""Procurement record schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from ..models.enums import ProcurementStatus, QualityStatus


class ProcurementCreate(BaseModel):
    farmer_id: str = Field(min_length=3, max_length=64)  # uuid or farmer_code
    centre_id: str = Field(min_length=1, max_length=32)  # numeric id or centre_code
    queue_entry_id: Optional[str] = None
    crop: str = Field(min_length=1, max_length=64)
    quantity_kg: float = Field(gt=0, le=1_000_000)
    unit: str = Field(default="KG", pattern=r"^(KG|QUINTAL)$")
    quality_status: QualityStatus = QualityStatus.PENDING
    procurement_status: ProcurementStatus = ProcurementStatus.PENDING
    rate_per_quintal: Optional[float] = Field(default=None, ge=0)
    amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=255)


class ProcurementUpdate(BaseModel):
    quality_status: Optional[QualityStatus] = None
    procurement_status: Optional[ProcurementStatus] = None
    rate_per_quintal: Optional[float] = Field(default=None, ge=0)
    amount: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=255)


class ProcurementOut(BaseModel):
    id: str
    farmer_id: str
    centre_id: int
    queue_entry_id: Optional[str] = None
    crop: str
    quantity_kg: float
    unit: str
    quality_status: str
    procurement_status: str
    rate_per_quintal: Optional[float] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
