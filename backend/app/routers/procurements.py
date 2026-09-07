"""Procurement record endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..dependencies import require_officer
from ..models import ProcurementRecord
from ..schemas.procurement import ProcurementCreate, ProcurementOut, ProcurementUpdate
from ..services.errors import DomainValidationError, NotFoundError
from ..services.presenters import procurement_out
from ..services.resolvers import resolve_centre, resolve_farmer

router = APIRouter(prefix="/procurements", tags=["procurements"])


@router.post("", response_model=ProcurementOut, status_code=201)
async def create_procurement(
    payload: ProcurementCreate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> ProcurementOut:
    farmer = await resolve_farmer(db, payload.farmer_id)
    centre = await resolve_centre(db, payload.centre_id)
    queue_entry_id = None
    if payload.queue_entry_id:
        try:
            queue_entry_id = uuid.UUID(payload.queue_entry_id)
        except ValueError as exc:
            raise DomainValidationError(f"Invalid queue_entry_id {payload.queue_entry_id!r}") from exc
    record = ProcurementRecord(
        farmer_id=farmer.id,
        centre_id=centre.id,
        queue_entry_id=queue_entry_id,
        crop=payload.crop,
        quantity_kg=payload.quantity_kg,
        unit=payload.unit,
        quality_status=payload.quality_status,
        procurement_status=payload.procurement_status,
        rate_per_quintal=payload.rate_per_quintal,
        amount=payload.amount,
        notes=payload.notes,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return procurement_out(record)


@router.get("", response_model=list[ProcurementOut])
async def list_procurements(
    farmer_id: Optional[str] = Query(default=None),
    centre_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_session),
) -> list[ProcurementOut]:
    stmt = select(ProcurementRecord).order_by(ProcurementRecord.created_at.desc())
    if farmer_id:
        farmer = await resolve_farmer(db, farmer_id)
        stmt = stmt.where(ProcurementRecord.farmer_id == farmer.id)
    if centre_id:
        centre = await resolve_centre(db, centre_id)
        stmt = stmt.where(ProcurementRecord.centre_id == centre.id)
    records = (await db.execute(stmt)).scalars().all()
    return [procurement_out(r) for r in records]


@router.get("/{procurement_id}", response_model=ProcurementOut)
async def get_procurement(
    procurement_id: str,
    db: AsyncSession = Depends(get_session),
) -> ProcurementOut:
    record = await _load(db, procurement_id)
    return procurement_out(record)


@router.patch("/{procurement_id}", response_model=ProcurementOut)
async def update_procurement(
    procurement_id: str,
    payload: ProcurementUpdate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> ProcurementOut:
    record = await _load(db, procurement_id)
    data = payload.model_dump(exclude_unset=True)
    for field in ("quality_status", "procurement_status", "rate_per_quintal", "amount", "notes"):
        if field in data:
            setattr(record, field, data[field])
    await db.commit()
    await db.refresh(record)
    return procurement_out(record)


async def _load(db: AsyncSession, procurement_id: str) -> ProcurementRecord:
    try:
        record_uuid = uuid.UUID(procurement_id)
    except ValueError as exc:
        raise NotFoundError(
            f"Procurement {procurement_id!r} not found", code="procurement_not_found"
        ) from exc
    record = await db.get(ProcurementRecord, record_uuid)
    if record is None:
        raise NotFoundError(
            f"Procurement {procurement_id!r} not found", code="procurement_not_found"
        )
    return record
