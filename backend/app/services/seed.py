"""Development seed script — realistic, fictitious demo data.

Run from `backend/`:

    python -m app.services.seed            # get-or-create (repeatable, safe)
    python -m app.services.seed --reset    # wipe all rows first, then reseed

The dataset mirrors the frontend's mock data (same centres, demo farmer
9876543210, queue tokens FPP-1020..1045 at the first centre) so the app
behaves identically whether it is fed by mocks or by PostgreSQL.
No real people's personal information is used.
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import SessionLocal
from ..models import (
    CentreStatus,
    Farmer,
    Notification,
    NotificationType,
    Officer,
    Payment,
    PaymentStatus,
    ProcurementCentre,
    ProcurementRecord,
    ProcurementStatus,
    QualityStatus,
    QueueEntry,
    QueueEntryStatus,
    Slot,
    SlotStatus,
    TokenCounter,
)
from .security import hash_password

# --------------------------------------------------------------- definitions

CENTRES: list[dict] = [
    dict(code="PC-001", name="Kottayam Procurement Centre", state="Kerala", district="Kottayam", address="Nagampadam, Kottayam", distance=4.2, hours="8:00 AM – 5:00 PM", capacity=150, crops=["Paddy", "Coconut", "Pepper", "Banana"], status=CentreStatus.OPEN),
    dict(code="PC-002", name="Changanassery Procurement Centre", state="Kerala", district="Kottayam", address="Perunna, Changanassery", distance=12.8, hours="8:00 AM – 5:00 PM", capacity=120, crops=["Paddy", "Banana", "Pepper"], status=CentreStatus.OPEN),
    dict(code="PC-003", name="Ettumanoor Procurement Centre", state="Kerala", district="Kottayam", address="MC Road, Ettumanoor", distance=16.4, hours="8:00 AM – 4:30 PM", capacity=100, crops=["Paddy", "Rubber", "Pepper"], status=CentreStatus.BUSY),
    dict(code="PC-004", name="Alappuzha Procurement Centre", state="Kerala", district="Alappuzha", address="Civil Station Road, Alappuzha", distance=48.0, hours="8:00 AM – 5:00 PM", capacity=110, crops=["Paddy", "Coconut"], status=CentreStatus.OPEN),
    dict(code="PC-005", name="Ernakulam Procurement Centre", state="Kerala", district="Ernakulam", address="Kaloor, Kochi", distance=65.5, hours="8:30 AM – 5:00 PM", capacity=140, crops=["Paddy", "Coconut", "Banana"], status=CentreStatus.OPEN),
    dict(code="PC-006", name="Thrissur Procurement Centre", state="Kerala", district="Thrissur", address="Kokkalai, Thrissur", distance=92.0, hours="8:00 AM – 4:30 PM", capacity=90, crops=["Paddy", "Coconut", "Pepper"], status=CentreStatus.FULL),
    dict(code="PC-007", name="Coimbatore Procurement Centre", state="Tamil Nadu", district="Coimbatore", address="Gandhipuram, Coimbatore", distance=6.1, hours="8:00 AM – 5:00 PM", capacity=160, crops=["Paddy", "Coconut", "Banana"], status=CentreStatus.OPEN),
    dict(code="PC-008", name="Erode Procurement Centre", state="Tamil Nadu", district="Erode", address="Brough Road, Erode", distance=3.8, hours="8:00 AM – 4:30 PM", capacity=110, crops=["Paddy", "Maize", "Banana"], status=CentreStatus.BUSY),
    dict(code="PC-009", name="Mysuru Mandi Procurement Centre", state="Karnataka", district="Mysuru", address="APMC Yard, Mysuru", distance=7.4, hours="8:00 AM – 5:00 PM", capacity=150, crops=["Paddy", "Wheat", "Maize"], status=CentreStatus.OPEN),
    dict(code="PC-010", name="Mandya Procurement Centre", state="Karnataka", district="Mandya", address="Market Road, Mandya", distance=5.2, hours="8:30 AM – 5:00 PM", capacity=100, crops=["Paddy", "Coconut", "Banana"], status=CentreStatus.CLOSED),
    dict(code="PC-011", name="Ludhiana Grain Market Centre", state="Punjab", district="Ludhiana", address="Grain Market, Ludhiana", distance=4.6, hours="8:00 AM – 5:00 PM", capacity=200, crops=["Wheat", "Maize", "Paddy"], status=CentreStatus.OPEN),
    dict(code="PC-012", name="Patiala Mandi Procurement Centre", state="Punjab", district="Patiala", address="New Grain Market, Patiala", distance=6.9, hours="8:00 AM – 4:30 PM", capacity=140, crops=["Wheat", "Paddy"], status=CentreStatus.BUSY),
    dict(code="PC-013", name="Nashik APMC Procurement Centre", state="Maharashtra", district="Nashik", address="APMC Market, Nashik", distance=5.5, hours="8:00 AM – 5:00 PM", capacity=170, crops=["Paddy", "Wheat", "Maize"], status=CentreStatus.OPEN),
    dict(code="PC-014", name="Nagpur Procurement Centre", state="Maharashtra", district="Nagpur", address="Kalamna Market, Nagpur", distance=8.3, hours="8:00 AM – 5:00 PM", capacity=130, crops=["Paddy", "Wheat", "Coconut"], status=CentreStatus.FULL),
    dict(code="PC-015", name="Lucknow Mandi Samiti Centre", state="Uttar Pradesh", district="Lucknow", address="Kisan Mandi, Lucknow", distance=5.0, hours="8:00 AM – 5:00 PM", capacity=190, crops=["Wheat", "Paddy", "Maize"], status=CentreStatus.OPEN),
    dict(code="PC-016", name="Kanpur Nagar Procurement Centre", state="Uttar Pradesh", district="Kanpur Nagar", address="Kakadeo Mandi, Kanpur", distance=6.7, hours="8:00 AM – 4:30 PM", capacity=150, crops=["Wheat", "Paddy"], status=CentreStatus.BUSY),
    dict(code="PC-017", name="Ahmedabad APMC Procurement Centre", state="Gujarat", district="Ahmedabad", address="Vasna APMC, Ahmedabad", distance=9.1, hours="8:00 AM – 5:00 PM", capacity=180, crops=["Wheat", "Paddy", "Banana"], status=CentreStatus.OPEN),
    dict(code="PC-018", name="Rajkot Procurement Centre", state="Gujarat", district="Rajkot", address="Gondal Road Mandi, Rajkot", distance=4.9, hours="8:30 AM – 5:00 PM", capacity=120, crops=["Wheat", "Paddy"], status=CentreStatus.CLOSED),
]

QUEUE_NAMES = [
    "Anil Das", "Priya Devi", "Jose Mathew", "Lakshmi Amma", "Binu Varghese",
    "Shaji P Panicker", "Mini Thomas", "Ravi Chandran", "Beena Mol", "Arun Prakash",
    "Gopika Menon", "Manoj Menon", "Radha Krishnan", "Sindhu S", "Vikram Singh",
    "Fatima Beevi", "Kunjhappu", "Devika R", "Mahesh Pillai", "Anandhu Krishna",
]

DEMO_PHONE = "9876543210"
DEMO_FARMER_CODE = "FPP-F-2026-0482"
DEMO_TOKEN = 1042

CROPS = ["Paddy", "Wheat", "Maize", "Coconut", "Rubber", "Banana", "Pepper"]

STATE_DISTRICTS = {
    "Kerala": ("Kottayam", "Kumarapuram"),
    "Tamil Nadu": ("Coimbatore", "Thondamuthur"),
    "Karnataka": ("Mysuru", "Nanjangud"),
    "Punjab": ("Ludhiana", "Jagraon"),
    "Maharashtra": ("Nashik", "Dindori"),
    "Uttar Pradesh": ("Lucknow", "Mohanlalganj"),
    "Gujarat": ("Ahmedabad", "Daskroi"),
}


def slot_time_ranges() -> list[tuple[time, time]]:
    ranges: list[tuple[time, time]] = []
    for hour in range(8, 17):
        ranges.append((time(hour, 0), time(hour, 30)))
        ranges.append((time(hour, 30), time(hour + 1, 0)))
    return ranges


def seeded_booked(centre_index: int, day_index: int, slot_index: int) -> int:
    """Deterministic pseudo-random so slots look organic but stay stable."""
    return (centre_index * 37 + day_index * 13 + slot_index * 7) % 11


def _utc(days_ago: float = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days_ago)


def _minutes_ago(minutes: float) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=minutes)


# ------------------------------------------------------------------- helpers


async def _get_or_create_centre(db: AsyncSession, spec: dict) -> ProcurementCentre:
    centre = (
        await db.execute(
            select(ProcurementCentre).where(ProcurementCentre.centre_code == spec["code"])
        )
    ).scalar_one_or_none()
    if centre is None:
        centre = ProcurementCentre(
            centre_code=spec["code"],
            name=spec["name"],
            state=spec["state"],
            district=spec["district"],
            address=spec["address"],
            opening_hours=spec["hours"],
            capacity_per_day=spec["capacity"],
            crops=spec["crops"],
            status=spec["status"],
            distance_km=spec["distance"],
        )
        db.add(centre)
        await db.flush()
    return centre


async def _get_or_create_farmer(
    db: AsyncSession, *, name: str, phone: str, state: str, farmer_code: str | None = None
) -> Farmer:
    farmer = (
        await db.execute(select(Farmer).where(Farmer.phone == phone))
    ).scalar_one_or_none()
    if farmer is None:
        district, village = STATE_DISTRICTS.get(state, ("Kottayam", "Kumarapuram"))
        farmer = Farmer(
            farmer_code=farmer_code or f"FPP-F-{date.today().year}-{phone}",
            name=name,
            phone=phone,
            state=state,
            district=district,
            village=village,
            address=f"{village} P.O.",
            preferred_crop=CROPS[hash(phone) % len(CROPS)],
        )
        db.add(farmer)
        await db.flush()
    return farmer


async def _get_or_create_slot(
    db: AsyncSession,
    centre_id: int,
    day: date,
    start: time,
    end: time,
    *,
    capacity: int = 12,
    status: SlotStatus = SlotStatus.ACTIVE,
    centre_index: int = 0,
    day_index: int = 0,
) -> Slot:
    slot = (
        await db.execute(
            select(Slot).where(
                Slot.centre_id == centre_id, Slot.date == day, Slot.start_time == start
            )
        )
    ).scalar_one_or_none()
    if slot is None:
        ranges = slot_time_ranges()
        slot_index = next(i for i, (s, _) in enumerate(ranges) if s == start)
        slot = Slot(
            centre_id=centre_id,
            date=day,
            start_time=start,
            end_time=end,
            capacity=capacity,
            booked_count=seeded_booked(centre_index, day_index, slot_index),
            status=status,
        )
        db.add(slot)
        await db.flush()
    return slot


async def _seed_queue_entry(
    db: AsyncSession,
    *,
    farmer: Farmer,
    centre_id: int,
    slot: Slot,
    token_number: int,
    status: QueueEntryStatus,
    produce: str,
    quantity: int,
    joined_at: datetime | None = None,
) -> QueueEntry:
    entry = (
        await db.execute(
            select(QueueEntry).where(
                QueueEntry.centre_id == centre_id, QueueEntry.token_number == token_number
            )
        )
    ).scalar_one_or_none()
    if entry is None:
        entry = QueueEntry(
            farmer_id=farmer.id,
            centre_id=centre_id,
            slot_id=slot.id,
            token_number=token_number,
            token_code=f"FPP-{token_number}",
            produce=produce,
            quantity_kg=quantity,
            status=status,
            joined_at=joined_at or datetime.now(timezone.utc),
        )
        db.add(entry)
        await db.flush()
        # keep slot occupancy consistent with entries
        slot.booked_count = min(slot.capacity, slot.booked_count + 1) if status not in (
            QueueEntryStatus.CANCELLED,
        ) else slot.booked_count
    return entry


async def seed_centre_slots(db: AsyncSession, centre: ProcurementCentre, centre_index: int) -> None:
    """Populate slots from today-7 to today+6 (deterministic occupancy)."""
    ranges = slot_time_ranges()
    today = date.today()
    for day_index in range(-7, 7):
        day = today + timedelta(days=day_index)
        for slot_index, (start, end) in enumerate(ranges):
            closed = day_index >= 5 and slot_index > 12
            await _get_or_create_slot(
                db,
                centre.id,
                day,
                start,
                end,
                capacity=12,
                status=SlotStatus.CLOSED if closed else SlotStatus.ACTIVE,
                centre_index=centre_index,
                day_index=day_index,
            )


async def seed_demo_queue_today(db: AsyncSession) -> None:
    """Today's live queue at the first centre — mirrors the mock demo exactly."""
    centre = (
        await db.execute(
            select(ProcurementCentre).where(ProcurementCentre.centre_code == "PC-001")
        )
    ).scalar_one()
    today = date.today()
    names = QUEUE_NAMES

    async def slot_for(hhmm: str) -> Slot:
        start = time(int(hhmm.split(":")[0]), int(hhmm.split(":")[1]))
        end = time(start.hour, (start.minute + 30) % 60)
        return await _get_or_create_slot(
            db, centre.id, today, start, end, centre_index=0, day_index=0
        )

    # 18 completed tokens FPP-1020..1037 spread across morning slots
    completed_plan = [
        ("08:00", 5), ("08:30", 5), ("09:00", 4), ("09:30", 4)
    ]
    token = 1020
    for hhmm, count in completed_plan:
        slot = await slot_for(hhmm)
        for _ in range(count):
            farmer = await _get_or_create_farmer(
                db,
                name=names[token % len(names)],
                phone=f"9000000{token % 100:02d}",
                state="Kerala",
            )
            await _seed_queue_entry(
                db,
                farmer=farmer,
                centre_id=centre.id,
                slot=slot,
                token_number=token,
                status=QueueEntryStatus.COMPLETED,
                produce=CROPS[token % len(CROPS)],
                quantity=600 + (token % 7) * 25,
                joined_at=_minutes_ago(240 + (1042 - token) * 6),
            )
            token += 1

    # FPP-1038 currently being processed
    farmer = await _get_or_create_farmer(db, name=names[0], phone="900000100", state="Kerala")
    await _seed_queue_entry(
        db,
        farmer=farmer,
        centre_id=centre.id,
        slot=await slot_for("10:00"),
        token_number=1038,
        status=QueueEntryStatus.IN_PROGRESS,
        produce="Paddy",
        quantity=720,
        joined_at=_minutes_ago(45),
    )

    # Waiting tokens: 1039..1041, demo farmer 1042, 1043..1045
    waiting_plan = [
        (1039, "10:30", "Paddy", 650, 1),
        (1040, "10:30", "Coconut", 480, 2),
        (1041, "10:30", "Paddy", 700, 3),
        (DEMO_TOKEN, "10:30", "Paddy", 850, 4),  # demo farmer
        (1043, "10:30", "Paddy", 610, 5),
        (1044, "11:00", "Banana", 420, 6),
        (1045, "11:00", "Pepper", 300, 7),
    ]
    for token_number, hhmm, produce, quantity, name_idx in waiting_plan:
        is_demo = token_number == DEMO_TOKEN
        farmer = await _get_or_create_farmer(
            db,
            name="Rajan Kumar" if is_demo else names[name_idx],
            phone=DEMO_PHONE if is_demo else f"9000002{name_idx:02d}",
            state="Kerala",
            farmer_code=DEMO_FARMER_CODE if is_demo else None,
        )
        await _seed_queue_entry(
            db,
            farmer=farmer,
            centre_id=centre.id,
            slot=await slot_for(hhmm),
            token_number=token_number,
            status=QueueEntryStatus.WAITING,
            produce=produce,
            quantity=quantity,
            joined_at=_minutes_ago(240 - name_idx * 3),
        )

    await _upsert_token_counter(db, centre.id, 1045)


async def _upsert_token_counter(db: AsyncSession, centre_id: int, last_token: int) -> None:
    counter = await db.get(TokenCounter, centre_id)
    if counter is None:
        db.add(TokenCounter(centre_id=centre_id, last_token=last_token))
    elif counter.last_token < last_token:
        counter.last_token = last_token
    await db.flush()


async def seed_other_centre_queues(db: AsyncSession) -> None:
    """A small live queue for every other centre (mock parity)."""
    centres = (
        (await db.execute(select(ProcurementCentre).order_by(ProcurementCentre.id)))
        .scalars().all()
    )
    today = date.today()
    for centre_index, centre in enumerate(centres):
        if centre_index == 0:
            continue
        base = 2100 + centre_index * 40
        plan = [
            (0, QueueEntryStatus.COMPLETED),
            (1, QueueEntryStatus.COMPLETED),
            (2, QueueEntryStatus.IN_PROGRESS),
            (3, QueueEntryStatus.WAITING),
            (4, QueueEntryStatus.WAITING),
            (5, QueueEntryStatus.WAITING),
        ]
        slot_hours = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]
        for offset, status in plan:
            token_number = base + offset
            farmer = await _get_or_create_farmer(
                db,
                name=QUEUE_NAMES[(centre_index * 3 + offset) % len(QUEUE_NAMES)],
                phone=f"910{centre_index:02d}00{offset:02d}",
                state=centre.state,
            )
            hhmm = slot_hours[offset]
            start = time(int(hhmm.split(":")[0]), int(hhmm.split(":")[1]))
            end = time(start.hour, (start.minute + 30) % 60)
            slot = await _get_or_create_slot(
                db,
                centre.id,
                today,
                start,
                end,
                centre_index=centre_index,
                day_index=0,
            )
            await _seed_queue_entry(
                db,
                farmer=farmer,
                centre_id=centre.id,
                slot=slot,
                token_number=token_number,
                status=status,
                produce=CROPS[offset % len(CROPS)],
                quantity=350 + offset * 60,
                joined_at=_minutes_ago(120 - offset * 10),
            )
        await _upsert_token_counter(db, centre.id, base + 5)


async def seed_past_bookings(db: AsyncSession) -> None:
    """Demo farmer's history + procurement records + payments (mock parity)."""
    demo_farmer = (
        await db.execute(select(Farmer).where(Farmer.phone == DEMO_PHONE))
    ).scalar_one()
    centre1 = (
        await db.execute(select(ProcurementCentre).where(ProcurementCentre.centre_code == "PC-001"))
    ).scalar_one()
    centre2 = (
        await db.execute(select(ProcurementCentre).where(ProcurementCentre.centre_code == "PC-002"))
    ).scalar_one()
    today = date.today()

    past_plan = [
        # (centre, days_ago, hhmm, token, produce, qty, status)
        (centre1, 8, "09:00", 987, "Paddy", 760, QueueEntryStatus.COMPLETED),
        (centre2, 15, "11:00", 812, "Banana", 420, QueueEntryStatus.COMPLETED),
        (centre1, 22, "13:30", 633, "Coconut", 300, QueueEntryStatus.CANCELLED),
    ]
    records: list[tuple[QueueEntry, str, int]] = []
    for centre, days_ago, hhmm, token_number, produce, quantity, status in past_plan:
        day = today - timedelta(days=days_ago)
        start = time(int(hhmm.split(":")[0]), int(hhmm.split(":")[1]))
        end = time(start.hour, (start.minute + 30) % 60)
        slot = await _get_or_create_slot(
            db,
            centre.id,
            day,
            start,
            end,
            centre_index=0 if centre.id == centre1.id else 1,
            day_index=-days_ago,
        )
        entry = (
            await db.execute(
                select(QueueEntry).where(
                    QueueEntry.centre_id == centre.id,
                    QueueEntry.token_number == token_number,
                )
            )
        ).scalar_one_or_none()
        if entry is None:
            entry = QueueEntry(
                farmer_id=demo_farmer.id,
                centre_id=centre.id,
                slot_id=slot.id,
                token_number=token_number,
                token_code=f"FPP-{token_number}",
                produce=produce,
                quantity_kg=quantity,
                status=status,
                joined_at=_utc(days_ago + 0.2),
                completed_at=_utc(days_ago) if status == QueueEntryStatus.COMPLETED else None,
                cancelled_at=_utc(days_ago) if status == QueueEntryStatus.CANCELLED else None,
            )
            db.add(entry)
            await db.flush()
            if status != QueueEntryStatus.CANCELLED:
                slot.booked_count = min(slot.capacity, slot.booked_count + 1)
        records.append((entry, produce, quantity))
    await _upsert_token_counter(db, centre1.id, 1045)  # stays ahead of history
    await _upsert_token_counter(db, centre2.id, max(2145, await _counter_value(db, centre2.id)))

    # Procurement records + payments for the two completed visits
    rate_for = {"Paddy": 2200.0, "Banana": 1800.0, "Coconut": 3400.0}
    for entry, produce, quantity in records:
        if entry.status != QueueEntryStatus.COMPLETED:
            continue
        record = (
            await db.execute(
                select(ProcurementRecord).where(ProcurementRecord.queue_entry_id == entry.id)
            )
        ).scalar_one_or_none()
        if record is None:
            rate = rate_for[produce]
            amount = round(rate * quantity / 100.0, 2)
            record = ProcurementRecord(
                farmer_id=demo_farmer.id,
                centre_id=entry.centre_id,
                queue_entry_id=entry.id,
                crop=produce,
                quantity_kg=quantity,
                unit="KG",
                quality_status=QualityStatus.PASSED,
                procurement_status=ProcurementStatus.COMPLETED,
                rate_per_quintal=rate,
                amount=amount,
            )
            db.add(record)
            await db.flush()
        payment = (
            await db.execute(select(Payment).where(Payment.procurement_id == record.id))
        ).scalar_one_or_none()
        if payment is None:
            db.add(
                Payment(
                    farmer_id=demo_farmer.id,
                    procurement_id=record.id,
                    amount=record.amount,
                    payment_status=PaymentStatus.PAID,
                    transaction_reference=f"TXN-DEMO-{entry.token_number}",
                    paid_at=_utc(6) if entry.token_number == 987 else _utc(13),
                )
            )

    # A pending procurement for the token currently being processed (FPP-1038)
    processing_entry = (
        await db.execute(
            select(QueueEntry).where(
                QueueEntry.centre_id == centre1.id, QueueEntry.token_number == 1038
            )
        )
    ).scalar_one_or_none()
    if processing_entry is not None:
        record = (
            await db.execute(
                select(ProcurementRecord).where(
                    ProcurementRecord.queue_entry_id == processing_entry.id
                )
            )
        ).scalar_one_or_none()
        if record is None:
            db.add(
                ProcurementRecord(
                    farmer_id=processing_entry.farmer_id,
                    centre_id=centre1.id,
                    queue_entry_id=processing_entry.id,
                    crop="Paddy",
                    quantity_kg=720,
                    unit="KG",
                    quality_status=QualityStatus.PENDING,
                    procurement_status=ProcurementStatus.IN_PROGRESS,
                )
            )


async def _counter_value(db: AsyncSession, centre_id: int) -> int:
    counter = await db.get(TokenCounter, centre_id)
    return counter.last_token if counter else 0


async def seed_notifications(db: AsyncSession) -> None:
    """Demo farmer notifications (mirror of the mock's initial list)."""
    demo_farmer = (
        await db.execute(select(Farmer).where(Farmer.phone == DEMO_PHONE))
    ).scalar_one()
    existing = (
        await db.execute(select(Notification).where(Notification.farmer_id == demo_farmer.id))
    ).scalars().first()
    if existing is not None:
        return
    plan = [
        (NotificationType.SUCCESS, "Booking confirmed", "Your procurement slot has been confirmed for Kottayam Procurement Centre.", _minutes_ago(12), False),
        (NotificationType.INFO, "Token FPP-1042 is approaching", "There are 4 farmers ahead of you. Please stay near the procurement counter.", _minutes_ago(35), False),
        (NotificationType.WARNING, "Centre delay notice", "Procurement at Kottayam Centre is currently delayed by approximately 20 minutes.", _minutes_ago(90), False),
        (NotificationType.INFO, "Documents reminder", "Please carry your Aadhaar or valid ID and keep your registered mobile active.", _minutes_ago(60 * 26), True),
        (NotificationType.SUCCESS, "Previous procurement completed", "Your procurement on 21 August 2026 (FPP-0987) has been completed.", _utc(8), True),
    ]
    for type_, title, message, timestamp, read in plan:
        db.add(
            Notification(
                farmer_id=demo_farmer.id,
                type=type_,
                title=title,
                message=message,
                read=read,
                created_at=timestamp,
                updated_at=timestamp,
            )
        )


async def seed_officer(db: AsyncSession) -> None:
    officer = (
        await db.execute(select(Officer).where(Officer.officer_code == "OFF-2201"))
    ).scalar_one_or_none()
    if officer is None:
        centre1 = (
            await db.execute(
                select(ProcurementCentre).where(ProcurementCentre.centre_code == "PC-001")
            )
        ).scalar_one()
        db.add(
            Officer(
                officer_code="OFF-2201",
                name="Suresh Nair",
                designation="Procurement Officer",
                centre_id=centre1.id,
                # Demo password — documented in backend/README.md (dev only).
                password_hash=hash_password("officer1234"),
            )
        )


async def _reset(db: AsyncSession) -> None:
    await db.execute(
        text(
            "TRUNCATE notifications, payments, procurement_records, queue_entries, "
            "token_counters, slots, officers, farmers, procurement_centres RESTART IDENTITY CASCADE"
        )
    )


async def seed(reset: bool = False) -> None:
    async with SessionLocal() as db:
        if reset:
            await _reset(db)
            await db.commit()
            print("• existing data cleared")

        centres: list[ProcurementCentre] = []
        for index, spec in enumerate(CENTRES):
            centres.append(await _get_or_create_centre(db, spec))
        await db.commit()
        print(f"• {len(centres)} procurement centres")

        for index, centre in enumerate(centres):
            await seed_centre_slots(db, centre, index)
        await db.commit()
        print("• slots for today-7 … today+6 (18 windows/day, capacity 12)")

        # demo farmer (owns the seeded bookings + notifications)
        await _get_or_create_farmer(
            db,
            name="Rajan Kumar",
            phone=DEMO_PHONE,
            state="Kerala",
            farmer_code=DEMO_FARMER_CODE,
        )
        demo = (
            await db.execute(select(Farmer).where(Farmer.phone == DEMO_PHONE))
        ).scalar_one()
        if demo.password_hash is None:
            # Demo login password — documented in backend/README.md (dev only).
            demo.password_hash = hash_password("demo1234")
        demo.preferred_centre_id = centres[0].id
        demo.land_size_acres = 2.5
        demo.preferred_crop = "Paddy"
        demo.quantity_kg = 850
        demo.date_of_birth = date(1986, 4, 12)
        demo.aadhaar_hash = None
        await db.commit()
        print("• demo farmer Rajan Kumar (9876543210 / OTP 123456 or password demo1234)")

        await seed_demo_queue_today(db)
        await db.commit()
        print("• live queue at Kottayam Centre (FPP-1020…1045, next token FPP-1046)")

        await seed_other_centre_queues(db)
        await db.commit()
        print("• live queues for the remaining centres")

        await seed_past_bookings(db)
        await db.commit()
        print("• demo farmer booking history + procurement records + payments")

        await seed_notifications(db)
        await seed_officer(db)
        await db.commit()
        print("• notifications + officer OFF-2201 (password officer1234)")
        print("Seed complete ✔")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed development data (fictitious).")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Wipe all rows before seeding (development only).",
    )
    args = parser.parse_args()
    asyncio.run(seed(reset=args.reset))


if __name__ == "__main__":
    main()
