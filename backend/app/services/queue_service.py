"""Queue service — joining, positions, status transitions, advancing.

Concurrency safety
------------------
All mutating steps run inside a single transaction and rely on atomic SQL:

* Slot capacity  — `UPDATE slots SET booked_count = booked_count + 1
  WHERE id = :id AND status = 'ACTIVE' AND booked_count < capacity RETURNING id`.
  The conditional UPDATE is atomic: when the slot is full it affects zero rows
  and the join is rejected (409). No read-then-write race exists.

* Token numbers  — `INSERT INTO token_counters ... ON CONFLICT (centre_id) DO
  UPDATE SET last_token = token_counters.last_token + 1 RETURNING last_token`.
  The conflicting UPDATE takes a row lock until commit, so concurrent joins
  each receive a distinct token (never `MAX()+1`).

* Duplicates     — a partial unique index
  `uq_queue_farmer_active_per_centre (farmer_id, centre_id) WHERE status IN
  ('WAITING','CALLED','IN_PROGRESS','ON_HOLD')` backs the application check.

Queue position is *derived*, never stored: an entry's position is the number of
active entries with a lower token_number for the same centre and slot date.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Mapping, Optional

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models import (
    ACTIVE_QUEUE_STATUSES,
    CentreStatus,
    ProcurementCentre,
    QueueEntry,
    QueueEntryStatus,
    Slot,
    SlotStatus,
    TokenCounter,
    utcnow,
)
from ..schemas.queue import (
    AdvanceResponse,
    CentreBrief,
    FarmerBrief,
    QueueCentreResponse,
    QueueCounts,
    QueueEntryOut,
    QueueJoinRequest,
    SlotBrief,
)
from .enum_utils import to_enum
from .errors import ConflictError, DomainValidationError, NotFoundError
from .events import publish_queue_update
from .resolvers import resolve_centre, resolve_farmer, resolve_slot

#: Allowed lifecycle transitions (anything else is a 422).
ALLOWED_TRANSITIONS: Mapping[QueueEntryStatus, set[QueueEntryStatus]] = {
    QueueEntryStatus.WAITING: {
        QueueEntryStatus.CALLED,
        QueueEntryStatus.ON_HOLD,
        QueueEntryStatus.CANCELLED,
        QueueEntryStatus.NO_SHOW,
    },
    QueueEntryStatus.CALLED: {
        QueueEntryStatus.IN_PROGRESS,
        QueueEntryStatus.WAITING,
        QueueEntryStatus.CANCELLED,
        QueueEntryStatus.NO_SHOW,
    },
    QueueEntryStatus.IN_PROGRESS: {QueueEntryStatus.COMPLETED},
    QueueEntryStatus.ON_HOLD: {
        QueueEntryStatus.WAITING,
        QueueEntryStatus.CANCELLED,
    },
    QueueEntryStatus.COMPLETED: set(),
    QueueEntryStatus.CANCELLED: set(),
    QueueEntryStatus.NO_SHOW: set(),
}

#: Statuses hidden from the live centre queue (the mock UI removes cancels).
_HIDDEN_STATUSES = frozenset({QueueEntryStatus.CANCELLED, QueueEntryStatus.NO_SHOW})

_COUNT_KEYS: Mapping[QueueEntryStatus, str] = {
    QueueEntryStatus.WAITING: "waiting",
    QueueEntryStatus.CALLED: "called",
    QueueEntryStatus.IN_PROGRESS: "in_progress",
    QueueEntryStatus.ON_HOLD: "on_hold",
}


def booking_status_for(entry: QueueEntry, today: date) -> str:
    """Derive the frontend `BookingStatus` from the entry + slot date."""
    status = to_enum(QueueEntryStatus, entry.status)
    if status == QueueEntryStatus.COMPLETED:
        return "Completed"
    if status in (QueueEntryStatus.CANCELLED, QueueEntryStatus.NO_SHOW):
        return "Cancelled"
    if status == QueueEntryStatus.IN_PROGRESS:
        return "Processing"
    # WAITING / CALLED / ON_HOLD -> Waiting (or Upcoming for future dates)
    if entry.slot.date > today:
        return "Upcoming"
    return "Waiting"


def token_code_for(token_number: int) -> str:
    return f"FPP-{token_number}"


def parse_queue_date(date_iso: Optional[str]) -> date:
    if not date_iso:
        return date.today()
    try:
        return date.fromisoformat(date_iso)
    except ValueError as exc:
        raise DomainValidationError(f"Invalid date {date_iso!r}") from exc


def _entry_out(entry: QueueEntry, today: date, *, farmers_ahead: int) -> QueueEntryOut:
    status = to_enum(QueueEntryStatus, entry.status)
    active = status in ACTIVE_QUEUE_STATUSES
    position = farmers_ahead + 1 if active else None
    return QueueEntryOut(
        id=str(entry.id),
        token_number=entry.token_number,
        token=entry.token_code,
        status=status,
        booking_status=booking_status_for(entry, today),
        position=position,
        farmers_ahead=farmers_ahead,
        estimated_wait_minutes=farmers_ahead * settings.minutes_per_farmer,
        arrived=entry.arrived,
        produce=entry.produce,
        quantity_kg=float(entry.quantity_kg),
        joined_at=entry.joined_at,
        called_at=entry.called_at,
        completed_at=entry.completed_at,
        cancelled_at=entry.cancelled_at,
        slot=SlotBrief(
            id=str(entry.slot.id),
            date=entry.slot.date.isoformat(),
            start_time=f"{entry.slot.start_time.hour:02d}:{entry.slot.start_time.minute:02d}",
            end_time=f"{entry.slot.end_time.hour:02d}:{entry.slot.end_time.minute:02d}",
        ),
        centre=CentreBrief(
            id=entry.centre.id,
            centre_code=entry.centre.centre_code,
            name=entry.centre.name,
            state=entry.centre.state,
            district=entry.centre.district,
            address=entry.centre.address,
        ),
        farmer=FarmerBrief(
            id=str(entry.farmer.id),
            farmer_code=entry.farmer.farmer_code,
            name=entry.farmer.name,
            phone=entry.farmer.phone,
        ),
    )


async def count_ahead(db: AsyncSession, entry: QueueEntry) -> int:
    """Active entries with a lower token number, same centre + slot date."""
    stmt = (
        select(func.count())
        .select_from(QueueEntry)
        .join(Slot, Slot.id == QueueEntry.slot_id)
        .where(
            QueueEntry.centre_id == entry.centre_id,
            Slot.date == entry.slot.date,
            QueueEntry.token_number < entry.token_number,
            QueueEntry.status.in_(ACTIVE_QUEUE_STATUSES),
        )
    )
    return int((await db.execute(stmt)).scalar_one())


async def _load_entry(db: AsyncSession, entry_id: str) -> QueueEntry:
    try:
        entry_uuid = uuid.UUID(entry_id)
    except ValueError as exc:
        raise NotFoundError(
            f"Queue entry {entry_id!r} not found", code="queue_not_found"
        ) from exc
    entry = await db.get(QueueEntry, entry_uuid)
    if entry is None:
        raise NotFoundError(f"Queue entry {entry_id!r} not found", code="queue_not_found")
    return entry


async def get_queue_entry_out(db: AsyncSession, entry: QueueEntry) -> QueueEntryOut:
    ahead = await count_ahead(db, entry)
    return _entry_out(entry, date.today(), farmers_ahead=ahead)


async def _next_token_number(db: AsyncSession, centre_id: int) -> int:
    """Atomic per-centre token issue (row-locked upsert)."""
    stmt = (
        pg_insert(TokenCounter)
        .values(centre_id=centre_id, last_token=1)
        .on_conflict_do_update(
            index_elements=[TokenCounter.centre_id],
            set_={"last_token": TokenCounter.last_token + 1},
        )
        .returning(TokenCounter.last_token)
    )
    return int((await db.execute(stmt)).scalar_one())


async def _occupy_slot(db: AsyncSession, slot_id: uuid.UUID) -> bool:
    """Atomically take one seat; False when the slot is full/closed."""
    stmt = text(
        "UPDATE slots SET booked_count = booked_count + 1 "
        "WHERE id = :sid AND status = :active AND booked_count < capacity "
        "RETURNING id"
    ).bindparams(sid=slot_id, active=SlotStatus.ACTIVE.value)
    return (await db.execute(stmt)).first() is not None


async def _release_slot(db: AsyncSession, slot_id: uuid.UUID) -> None:
    await db.execute(
        text(
            "UPDATE slots SET booked_count = GREATEST(booked_count - 1, 0) WHERE id = :sid"
        ).bindparams(sid=slot_id)
    )


async def _publish_change(centre_id: int, qdate: date) -> None:
    """Best-effort realtime nudge (WS subscribers re-fetch the snapshot)."""
    try:
        await publish_queue_update(
            centre_id,
            {
                "type": "queue.updated",
                "centre_id": centre_id,
                "date": qdate.isoformat(),
                "at": datetime.now(timezone.utc).isoformat(),
            },
        )
    except Exception:  # pragma: no cover - realtime must never break writes
        pass


# ------------------------------------------------------------------ actions


async def join_queue(db: AsyncSession, req: QueueJoinRequest) -> QueueEntryOut:
    """Validate + atomically issue a token + store the queue entry."""
    farmer = await resolve_farmer(db, req.farmer_id)
    centre = await resolve_centre(db, req.centre_id)

    if to_enum(CentreStatus, centre.status) == CentreStatus.CLOSED:
        raise ConflictError(f"Centre {centre.name} is currently closed", code="centre_closed")

    slot = await resolve_slot(
        db, centre.id, slot_id=req.slot_id, date_iso=req.date, start_time=req.start_time
    )
    today = date.today()
    if slot.is_closed:
        raise ConflictError("This slot is closed", code="slot_closed")
    if slot.date < today:
        raise DomainValidationError("Cannot join a queue for a past date")

    # Duplicate prevention: one ACTIVE entry per farmer (any centre).
    existing = (
        await db.execute(
            select(QueueEntry.id).where(
                QueueEntry.farmer_id == farmer.id,
                QueueEntry.status.in_([s.value for s in ACTIVE_QUEUE_STATUSES]),
            )
        )
    ).first()
    if existing is not None:
        raise ConflictError(
            "Farmer already has an active queue entry", code="duplicate_queue_entry"
        )

    # Take a seat first — on the common "full" 409 path nothing else was done.
    if not await _occupy_slot(db, slot.id):
        raise ConflictError("This slot is full", code="slot_full")

    token_number = await _next_token_number(db, centre.id)
    entry = QueueEntry(
        farmer_id=farmer.id,
        centre_id=centre.id,
        slot_id=slot.id,
        token_number=token_number,
        token_code=token_code_for(token_number),
        produce=req.produce,
        quantity_kg=req.quantity_kg,
        status=QueueEntryStatus.WAITING,
        joined_at=utcnow(),
    )
    db.add(entry)
    try:
        await db.commit()
    except Exception as exc:  # unique-index safety net (concurrent duplicates)
        await db.rollback()
        raise ConflictError(
            "Farmer already has an active queue entry", code="duplicate_queue_entry"
        ) from exc

    await db.refresh(entry)
    ahead = await count_ahead(db, entry)
    out = _entry_out(entry, today, farmers_ahead=ahead)
    await _publish_change(centre.id, slot.date)
    return out


async def get_centre_queue(
    db: AsyncSession,
    centre_ref: str,
    *,
    date_iso: Optional[str] = None,
) -> QueueCentreResponse:
    centre: ProcurementCentre = await resolve_centre(db, centre_ref)
    qdate = parse_queue_date(date_iso)

    stmt = (
        select(QueueEntry)
        .join(Slot, Slot.id == QueueEntry.slot_id)
        .where(QueueEntry.centre_id == centre.id, Slot.date == qdate)
        .order_by(QueueEntry.token_number)
    )
    entries = (await db.execute(stmt)).scalars().all()

    outs: list[QueueEntryOut] = []
    counts = {"waiting": 0, "called": 0, "in_progress": 0, "on_hold": 0, "completed": 0}
    ahead = 0
    for entry in entries:
        status = to_enum(QueueEntryStatus, entry.status)
        if status in _HIDDEN_STATUSES:
            continue
        if status in ACTIVE_QUEUE_STATUSES:
            outs.append(_entry_out(entry, qdate, farmers_ahead=ahead))
            ahead += 1
            counts[_COUNT_KEYS[status]] += 1
        else:
            outs.append(_entry_out(entry, qdate, farmers_ahead=0))
            counts["completed"] += 1

    last_updated = max((e.updated_at for e in entries), default=None)
    return QueueCentreResponse(
        centre_id=centre.id,
        centre_code=centre.centre_code,
        date=qdate.isoformat(),
        entries=outs,
        counts=QueueCounts(
            waiting=counts["waiting"],
            called=counts["called"],
            in_progress=counts["in_progress"],
            on_hold=counts["on_hold"],
            completed=counts["completed"],
            total_active=ahead,
        ),
        last_updated=last_updated or utcnow(),
    )


async def get_entry(db: AsyncSession, entry_id: str) -> QueueEntryOut:
    entry = await _load_entry(db, entry_id)
    ahead = await count_ahead(db, entry)
    return _entry_out(entry, date.today(), farmers_ahead=ahead)


async def update_entry_status(
    db: AsyncSession, entry_id: str, new_status: QueueEntryStatus
) -> QueueEntryOut:
    entry = await _load_entry(db, entry_id)
    current = to_enum(QueueEntryStatus, entry.status)

    if new_status != current:
        allowed = ALLOWED_TRANSITIONS[current]
        if new_status not in allowed:
            raise DomainValidationError(
                f"Invalid status transition {current.value} -> {new_status.value}",
                code="invalid_status_transition",
            )

        now = utcnow()
        entry.status = new_status.value
        if new_status == QueueEntryStatus.CALLED:
            entry.called_at = now
        elif new_status == QueueEntryStatus.IN_PROGRESS:
            entry.in_progress_at = now
        elif new_status == QueueEntryStatus.COMPLETED:
            entry.completed_at = now
        elif new_status in (QueueEntryStatus.CANCELLED, QueueEntryStatus.NO_SHOW):
            entry.cancelled_at = now
            await _release_slot(db, entry.slot_id)

        await db.commit()
        await db.refresh(entry)

    ahead = await count_ahead(db, entry)
    out = _entry_out(entry, date.today(), farmers_ahead=ahead)
    await _publish_change(entry.centre_id, entry.slot.date)
    return out


async def mark_arrived(db: AsyncSession, entry_id: str) -> QueueEntryOut:
    entry = await _load_entry(db, entry_id)
    if to_enum(QueueEntryStatus, entry.status) not in ACTIVE_QUEUE_STATUSES:
        raise ConflictError("Cannot check in a finished queue entry", code="entry_finished")
    entry.arrived = True
    await db.commit()
    await db.refresh(entry)
    ahead = await count_ahead(db, entry)
    out = _entry_out(entry, date.today(), farmers_ahead=ahead)
    await _publish_change(entry.centre_id, entry.slot.date)
    return out


async def move_entry_slot(db: AsyncSession, entry_id: str, new_slot_id: str) -> QueueEntryOut:
    entry = await _load_entry(db, entry_id)
    if to_enum(QueueEntryStatus, entry.status) not in ACTIVE_QUEUE_STATUSES:
        raise ConflictError("Cannot reschedule a finished queue entry", code="entry_finished")

    new_slot = await resolve_slot(db, entry.centre_id, slot_id=new_slot_id)
    if new_slot.id != entry.slot_id:
        if new_slot.is_closed:
            raise ConflictError("Target slot is closed", code="slot_closed")
        if not await _occupy_slot(db, new_slot.id):
            raise ConflictError("Target slot is full", code="slot_full")
        await _release_slot(db, entry.slot_id)
        entry.slot_id = new_slot.id
        await db.commit()
        await db.refresh(entry)
        await _publish_change(entry.centre_id, new_slot.date)

    ahead = await count_ahead(db, entry)
    return _entry_out(entry, date.today(), farmers_ahead=ahead)


async def advance_queue(
    db: AsyncSession,
    centre_ref: str,
    *,
    date_iso: Optional[str] = None,
) -> AdvanceResponse:
    """Complete the farmer being served and call the next one (one txn)."""
    centre: ProcurementCentre = await resolve_centre(db, centre_ref)
    qdate = parse_queue_date(date_iso)

    stmt = (
        select(QueueEntry)
        .join(Slot, Slot.id == QueueEntry.slot_id)
        .where(
            QueueEntry.centre_id == centre.id,
            Slot.date == qdate,
            QueueEntry.status.in_(ACTIVE_QUEUE_STATUSES),
        )
        .order_by(QueueEntry.token_number)
    )
    entries = (await db.execute(stmt)).scalars().all()

    completed_out: Optional[QueueEntryOut] = None
    serving_out: Optional[QueueEntryOut] = None
    now = utcnow()

    processing = next(
        (e for e in entries if to_enum(QueueEntryStatus, e.status) == QueueEntryStatus.IN_PROGRESS),
        None,
    )
    if processing is not None:
        processing.status = QueueEntryStatus.COMPLETED.value
        processing.completed_at = now
        completed_out = _entry_out(processing, qdate, farmers_ahead=0)

    next_entry = next(
        (
            e
            for e in entries
            if to_enum(QueueEntryStatus, e.status) in (QueueEntryStatus.WAITING, QueueEntryStatus.CALLED)
        ),
        None,
    )
    if next_entry is not None and next_entry.id != (processing.id if processing else None):
        next_entry.status = QueueEntryStatus.IN_PROGRESS.value
        next_entry.in_progress_at = now
        serving_out = _entry_out(next_entry, qdate, farmers_ahead=0)

    await db.commit()
    await _publish_change(centre.id, qdate)
    return AdvanceResponse(completed=completed_out, now_serving=serving_out)
