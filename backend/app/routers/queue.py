"""Queue endpoints — join, inspect, transition, advance."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..dependencies import require_officer
from ..models import QueueEntryStatus
from ..schemas.queue import (
    AdvanceResponse,
    QueueCentreResponse,
    QueueEntryOut,
    QueueJoinRequest,
    QueueSlotMoveRequest,
    QueueStatusUpdate,
)
from ..services.queue_service import (
    advance_queue,
    get_centre_queue,
    get_entry,
    join_queue,
    mark_arrived,
    move_entry_slot,
    update_entry_status,
)

router = APIRouter(prefix="/queue", tags=["queue"])


@router.post("/join", response_model=QueueEntryOut, status_code=201)
async def join(
    payload: QueueJoinRequest,
    db: AsyncSession = Depends(get_session),
) -> QueueEntryOut:
    """Join a centre queue: validates farmer/centre/slot, issues a token
    atomically and returns the entry with its derived queue position."""
    return await join_queue(db, payload)


@router.get("/centre/{centre_id}", response_model=QueueCentreResponse)
async def centre_queue(
    centre_id: str,
    date: Optional[str] = Query(default=None, description="YYYY-MM-DD, defaults to today"),
    db: AsyncSession = Depends(get_session),
) -> QueueCentreResponse:
    """Live queue snapshot for a centre and day (ordered by token number)."""
    return await get_centre_queue(db, centre_id, date_iso=date)


@router.post("/centre/{centre_id}/advance", response_model=AdvanceResponse)
async def centre_advance(
    centre_id: str,
    date: Optional[str] = Query(default=None, description="YYYY-MM-DD, defaults to today"),
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> AdvanceResponse:
    """Complete the farmer being served and start the next one."""
    return await advance_queue(db, centre_id, date_iso=date)


@router.get("/{entry_id}", response_model=QueueEntryOut)
async def get_queue_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_session),
) -> QueueEntryOut:
    return await get_entry(db, entry_id)


@router.patch("/{entry_id}/status", response_model=QueueEntryOut)
async def patch_queue_entry_status(
    entry_id: str,
    payload: QueueStatusUpdate,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> QueueEntryOut:
    """Validated lifecycle transition (WAITING -> CALLED -> IN_PROGRESS -> ...)."""
    return await update_entry_status(db, entry_id, payload.status)


@router.patch("/{entry_id}/slot", response_model=QueueEntryOut)
async def patch_queue_entry_slot(
    entry_id: str,
    payload: QueueSlotMoveRequest,
    db: AsyncSession = Depends(get_session),
    _officer: None = Depends(require_officer),
) -> QueueEntryOut:
    """Reschedule an active entry to another slot (capacity-checked)."""
    return await move_entry_slot(db, entry_id, payload.slot_id)


@router.post("/{entry_id}/arrive", response_model=QueueEntryOut)
async def arrive(
    entry_id: str,
    db: AsyncSession = Depends(get_session),
) -> QueueEntryOut:
    """Farmer check-in (marks `arrived`)."""
    return await mark_arrived(db, entry_id)


_ = QueueEntryStatus  # re-exported for OpenAPI schema generation
