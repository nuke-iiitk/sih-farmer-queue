"""Farmer endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Payment, ProcurementRecord, QueueEntry
from ..schemas.auth import FarmerRegisterRequest
from ..schemas.farmer import FarmerOut, FarmerUpdate
from ..schemas.payment import PaymentOut
from ..schemas.procurement import ProcurementOut
from ..schemas.queue import QueueEntryOut
from ..services.farmer_service import create_farmer, update_farmer
from ..services.presenters import payment_out, procurement_out
from ..services.queue_service import get_queue_entry_out
from ..services.resolvers import resolve_farmer

router = APIRouter(prefix="/farmers", tags=["farmers"])


@router.post("", response_model=FarmerOut, status_code=201)
async def post_farmer(
    payload: FarmerRegisterRequest,
    db: AsyncSession = Depends(get_session),
) -> FarmerOut:
    """Create a farmer (same payload as auth/register, minus the token)."""
    farmer = await create_farmer(db, payload)
    return FarmerOut.from_model(farmer)


@router.get("/{farmer_id}", response_model=FarmerOut)
async def get_farmer(
    farmer_id: str,
    db: AsyncSession = Depends(get_session),
) -> FarmerOut:
    farmer = await resolve_farmer(db, farmer_id)
    return FarmerOut.from_model(farmer)


@router.put("/{farmer_id}", response_model=FarmerOut)
async def put_farmer(
    farmer_id: str,
    payload: FarmerUpdate,
    db: AsyncSession = Depends(get_session),
) -> FarmerOut:
    farmer = await update_farmer(db, farmer_id, payload)
    return FarmerOut.from_model(farmer)


@router.get("/{farmer_id}/queue", response_model=list[QueueEntryOut])
async def get_farmer_queue(
    farmer_id: str,
    db: AsyncSession = Depends(get_session),
) -> list[QueueEntryOut]:
    """All queue entries (the frontend's bookings list), newest first."""
    farmer = await resolve_farmer(db, farmer_id)
    entries = (
        await db.execute(
            select(QueueEntry)
            .where(QueueEntry.farmer_id == farmer.id)
            .order_by(QueueEntry.joined_at.desc())
        )
    ).scalars().all()
    return [await get_queue_entry_out(db, entry) for entry in entries]


@router.get("/{farmer_id}/procurements", response_model=list[ProcurementOut])
async def get_farmer_procurements(
    farmer_id: str,
    db: AsyncSession = Depends(get_session),
) -> list[ProcurementOut]:
    farmer = await resolve_farmer(db, farmer_id)
    records = (
        await db.execute(
            select(ProcurementRecord)
            .where(ProcurementRecord.farmer_id == farmer.id)
            .order_by(ProcurementRecord.created_at.desc())
        )
    ).scalars().all()
    return [procurement_out(r) for r in records]


@router.get("/{farmer_id}/payments", response_model=list[PaymentOut])
async def get_farmer_payments(
    farmer_id: str,
    db: AsyncSession = Depends(get_session),
) -> list[PaymentOut]:
    farmer = await resolve_farmer(db, farmer_id)
    payments = (
        await db.execute(
            select(Payment)
            .where(Payment.farmer_id == farmer.id)
            .order_by(Payment.created_at.desc())
        )
    ).scalars().all()
    return [payment_out(p) for p in payments]
