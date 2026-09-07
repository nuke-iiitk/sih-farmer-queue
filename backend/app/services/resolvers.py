"""Shared lookups used by several routers/services."""

from __future__ import annotations

import uuid
from datetime import date, time
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Farmer, ProcurementCentre, Slot
from .errors import DomainValidationError, NotFoundError


async def resolve_farmer(db: AsyncSession, identifier: str) -> Farmer:
    """Accepts a farmer UUID or a farmer_code (FPP-F-...)."""
    try:
        farmer_id = uuid.UUID(identifier)
    except ValueError:
        farmer_id = None
    if farmer_id is not None:
        farmer = await db.get(Farmer, farmer_id)
    else:
        farmer = (
            await db.execute(select(Farmer).where(Farmer.farmer_code == identifier))
        ).scalar_one_or_none()
    if farmer is None:
        raise NotFoundError(f"Farmer {identifier!r} not found", code="farmer_not_found")
    return farmer


async def resolve_centre(db: AsyncSession, identifier: str) -> ProcurementCentre:
    """Accepts a numeric centre id or a centre_code."""
    centre: ProcurementCentre | None
    if identifier.isdigit():
        centre = await db.get(ProcurementCentre, int(identifier))
    else:
        centre = (
            await db.execute(
                select(ProcurementCentre).where(ProcurementCentre.centre_code == identifier)
            )
        ).scalar_one_or_none()
    if centre is None:
        raise NotFoundError(f"Centre {identifier!r} not found", code="centre_not_found")
    return centre


async def resolve_slot(
    db: AsyncSession,
    centre_id: int,
    *,
    slot_id: Optional[str] = None,
    date_iso: Optional[str] = None,
    start_time: Optional[str] = None,
) -> Slot:
    """Find a slot by id (must belong to the centre) or by (date, start_time)."""
    if slot_id:
        try:
            slot_uuid = uuid.UUID(slot_id)
        except ValueError as exc:
            raise DomainValidationError(f"Invalid slot id: {slot_id!r}") from exc
        slot = await db.get(Slot, slot_uuid)
        if slot is None or slot.centre_id != centre_id:
            raise NotFoundError(f"Slot {slot_id!r} not found for this centre", code="slot_not_found")
        return slot

    if date_iso and start_time:
        try:
            slot_date = date.fromisoformat(date_iso)
            hh, mm = start_time.split(":")
            slot_start = time(int(hh), int(mm))
        except ValueError as exc:
            raise DomainValidationError(f"Invalid slot date/time: {date_iso} {start_time}") from exc
        slot = (
            await db.execute(
                select(Slot).where(
                    Slot.centre_id == centre_id,
                    Slot.date == slot_date,
                    Slot.start_time == slot_start,
                )
            )
        ).scalar_one_or_none()
        if slot is None:
            raise NotFoundError(
                f"No slot at {date_iso} {start_time} for this centre", code="slot_not_found"
            )
        return slot

    raise DomainValidationError("Provide slot_id, or both date and start_time")


async def resolve_preferred_centre(
    db: AsyncSession, identifier: Optional[str]
) -> Optional[int]:
    """Tolerant resolver for the registration form: unknown ids become NULL."""
    if not identifier:
        return None
    try:
        centre = await resolve_centre(db, identifier)
    except NotFoundError:
        return None
    return centre.id
