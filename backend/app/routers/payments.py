"""Payment endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..dependencies import require_officer
from ..models import Payment, PaymentStatus, ProcurementRecord
from ..schemas.payment import PaymentCreate, PaymentOut, PaymentUpdate
from ..services.errors import ConflictError, DomainValidationError, NotFoundError
from ..services.presenters import payment_out
from ..services.resolvers import resolve_farmer

router = APIRouter(prefix="/payments", tags=["payments"])


async def _load(db: AsyncSession, payment_id: str) -> Payment:
    try:
        payment_uuid = uuid.UUID(payment_id)
    except ValueError as exc:
        raise NotFoundError(f"Payment {payment_id!r} not found", code="payment_not_found") from exc
    payment = await db.get(Payment, payment_uuid)
    if payment is None:
        raise NotFoundError(f"Payment {payment_id!r} not found", code="payment_not_found")
    return payment


@router.post("", response_model=PaymentOut, status_code=201)
async def create_payment(
    payload: PaymentCreate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> PaymentOut:
    try:
        procurement_uuid = uuid.UUID(payload.procurement_id)
    except ValueError as exc:
        raise DomainValidationError(f"Invalid procurement_id {payload.procurement_id!r}") from exc
    procurement = await db.get(ProcurementRecord, procurement_uuid)
    if procurement is None:
        raise NotFoundError(
            f"Procurement {payload.procurement_id!r} not found", code="procurement_not_found"
        )

    if payload.farmer_id:
        farmer = await resolve_farmer(db, payload.farmer_id)
        farmer_id = farmer.id
    else:
        farmer_id = procurement.farmer_id

    payment = Payment(
        farmer_id=farmer_id,
        procurement_id=procurement.id,
        amount=payload.amount,
        payment_status=payload.payment_status,
        transaction_reference=payload.transaction_reference,
        paid_at=datetime.now(timezone.utc)
        if payload.payment_status == PaymentStatus.PAID
        else None,
    )
    db.add(payment)
    try:
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise ConflictError(
            "Payment already exists for this procurement", code="payment_exists"
        ) from exc
    await db.refresh(payment)
    return payment_out(payment)


@router.get("", response_model=list[PaymentOut])
async def list_payments(
    procurement_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_session),
) -> list[PaymentOut]:
    stmt = select(Payment).order_by(Payment.created_at.desc())
    if procurement_id:
        try:
            stmt = stmt.where(Payment.procurement_id == uuid.UUID(procurement_id))
        except ValueError as exc:
            raise DomainValidationError(f"Invalid procurement_id {procurement_id!r}") from exc
    payments = (await db.execute(stmt)).scalars().all()
    return [payment_out(p) for p in payments]


@router.get("/{payment_id}", response_model=PaymentOut)
async def get_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_session),
) -> PaymentOut:
    payment = await _load(db, payment_id)
    return payment_out(payment)


@router.patch("/{payment_id}", response_model=PaymentOut)
async def update_payment(
    payment_id: str,
    payload: PaymentUpdate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> PaymentOut:
    payment = await _load(db, payment_id)
    if payload.payment_status is not None:
        payment.payment_status = payload.payment_status
        if payload.payment_status == PaymentStatus.PAID and payment.paid_at is None:
            payment.paid_at = datetime.now(timezone.utc)
    if payload.transaction_reference is not None:
        payment.transaction_reference = payload.transaction_reference
    await db.commit()
    await db.refresh(payment)
    return payment_out(payment)
