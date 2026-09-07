"""Procurement centre endpoints."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import CentreStatus, ProcurementCentre
from ..schemas.centre import CentreOut
from ..schemas.queue import QueueCentreResponse
from ..services.errors import DomainValidationError
from ..services.presenters import centre_out
from ..services.queue_service import get_centre_queue
from ..services.resolvers import resolve_centre

router = APIRouter(prefix="/centres", tags=["centres"])


@router.get("", response_model=list[CentreOut])
async def list_centres(
    state: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    crop: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, description="Name substring search"),
    db: AsyncSession = Depends(get_session),
) -> list[CentreOut]:
    stmt = select(ProcurementCentre).order_by(ProcurementCentre.id)
    if state:
        stmt = stmt.where(ProcurementCentre.state == state)
    if district:
        stmt = stmt.where(ProcurementCentre.district == district)
    if status:
        try:
            status_enum = CentreStatus(status.upper())
        except ValueError as exc:
            raise DomainValidationError(
                f"Invalid centre status {status!r} (use Open/Busy/Full/Closed)"
            ) from exc
        stmt = stmt.where(ProcurementCentre.status == status_enum)
    if crop:
        stmt = stmt.where(ProcurementCentre.crops.any(crop))
    if q:
        stmt = stmt.where(ProcurementCentre.name.ilike(f"%{q}%"))
    centres = (await db.execute(stmt)).scalars().all()
    return [centre_out(c) for c in centres]


@router.get("/{centre_id}", response_model=CentreOut)
async def get_centre(
    centre_id: str,
    db: AsyncSession = Depends(get_session),
) -> CentreOut:
    centre = await resolve_centre(db, centre_id)
    return centre_out(centre)


@router.get("/{centre_id}/queue", response_model=QueueCentreResponse)
async def get_centre_live_queue(
    centre_id: str,
    date: Optional[str] = Query(default=None, description="YYYY-MM-DD, defaults to today"),
    db: AsyncSession = Depends(get_session),
) -> QueueCentreResponse:
    return await get_centre_queue(db, centre_id, date_iso=date)
