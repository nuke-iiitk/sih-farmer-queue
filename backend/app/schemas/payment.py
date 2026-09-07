"""Payment schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from ..models.enums import PaymentStatus


class PaymentCreate(BaseModel):
    procurement_id: str
    # Optional: resolved from the procurement when omitted.
    farmer_id: Optional[str] = None
    amount: float = Field(gt=0)
    payment_status: PaymentStatus = PaymentStatus.PENDING
    transaction_reference: Optional[str] = Field(default=None, max_length=64)


class PaymentUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    transaction_reference: Optional[str] = Field(default=None, max_length=64)


class PaymentOut(BaseModel):
    id: str
    farmer_id: str
    procurement_id: str
    amount: float
    payment_status: str
    transaction_reference: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
