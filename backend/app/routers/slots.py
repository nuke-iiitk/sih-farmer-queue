"""Slot endpoints (create/update are officer actions)."""

from __future__ import annotations

import uuid
from datetime import date as date_type
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..dependencies import require_officer
from ..models import Slot, SlotStatus
from ..schemas.slot import SlotCreate, SlotOut, SlotUpdate, parse_hhmm
from ..services.errors import ConflictError, DomainValidationError
from ..services.resolvers import resolve_centre

router = APIRouter(tags=["slots"])


@router.get("/slots", response_model=list[SlotOut])
async def list_all_slots(
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
    centre_id: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_session),
) -> list[SlotOut]:
    """Slots across centres (optionally filtered) — used by the app's week view."""
    stmt = select(Slot).order_by(Slot.date, Slot.start_time)
    if centre_id:
        centre = await resolve_centre(db, centre_id)
        stmt = stmt.where(Slot.centre_id == centre.id)
    if date_from:
        try:
            stmt = stmt.where(Slot.date >= date_type.fromisoformat(date_from))
        except ValueError as exc:
            raise DomainValidationError(f"Invalid date {date_from!r}") from exc
    if date_to:
        try:
            stmt = stmt.where(Slot.date <= date_type.fromisoformat(date_to))
        except ValueError as exc:
            raise DomainValidationError(f"Invalid date {date_to!r}") from exc
    slots = (await db.execute(stmt)).scalars().all()
    return [SlotOut.from_model(s) for s in slots]


@router.get("/centres/{centre_id}/slots", response_model=list[SlotOut])
async def list_slots(
    centre_id: str,
    date: Optional[str] = Query(default=None, description="YYYY-MM-DD exact day"),
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
    db: AsyncSession = Depends(get_session),
) -> list[SlotOut]:
    centre = await resolve_centre(db, centre_id)
    stmt = (
        select(Slot)
        .where(Slot.centre_id == centre.id)
        .order_by(Slot.date, Slot.start_time)
    )
    if date:
        try:
            stmt = stmt.where(Slot.date == date_type.fromisoformat(date))
        except ValueError as exc:
            raise DomainValidationError(f"Invalid date {date!r}") from exc
    else:
        if date_from:
            try:
                stmt = stmt.where(Slot.date >= date_type.fromisoformat(date_from))
            except ValueError as exc:
                raise DomainValidationError(f"Invalid date {date_from!r}") from exc
        if date_to:
            try:
                stmt = stmt.where(Slot.date <= date_type.fromisoformat(date_to))
            except ValueError as exc:
                raise DomainValidationError(f"Invalid date {date_to!r}") from exc
    slots = (await db.execute(stmt)).scalars().all()
    return [SlotOut.from_model(s) for s in slots]


@router.post("/centres/{centre_id}/slots", response_model=SlotOut, status_code=201)
async def create_slot(
    centre_id: str,
    payload: SlotCreate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> SlotOut:
    centre = await resolve_centre(db, centre_id)
    start = parse_hhmm(payload.start_time)
    end = parse_hhmm(payload.end_time)
    if end <= start:
        raise DomainValidationError("end_time must be after start_time")

    existing = (
        await db.execute(
            select(Slot).where(
                Slot.centre_id == centre.id,
                Slot.date == payload.date,
                Slot.start_time == start,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        # Upsert semantics: editing an existing window re-opens it.
        existing.end_time = end
        existing.capacity = payload.capacity
        existing.status = SlotStatus.ACTIVE
        slot = existing
    else:
        slot = Slot(
            centre_id=centre.id,
            date=payload.date,
            start_time=start,
            end_time=end,
            capacity=payload.capacity,
            booked_count=0,
            status=SlotStatus.ACTIVE,
        )
        db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return SlotOut.from_model(slot)


@router.patch("/slots/{slot_id}", response_model=SlotOut)
async def update_slot(
    slot_id: str,
    payload: SlotUpdate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> SlotOut:
    try:
        slot_uuid = uuid.UUID(slot_id)
    except ValueError as exc:
        raise DomainValidationError(f"Invalid slot id {slot_id!r}") from exc
    slot = await db.get(Slot, slot_uuid)
    if slot is None:
        raise ConflictError(f"Slot {slot_id!r} not found", code="slot_not_found")

    if payload.capacity is not None:
        if payload.capacity < slot.booked_count:
            raise ConflictError(
                f"Capacity cannot be below current bookings ({slot.booked_count})",
                code="capacity_below_booked",
            )
        slot.capacity = payload.capacity
    if payload.closed is not None:
        slot.status = SlotStatus.CLOSED if payload.closed else SlotStatus.ACTIVE

    await db.commit()
    await db.refresh(slot)
    return SlotOut.from_model(slot)
