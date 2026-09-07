"""Presentation helpers turning ORM rows into response DTOs."""

from __future__ import annotations

from typing import Optional

from ..models import Notification, Payment, ProcurementCentre, ProcurementRecord
from ..schemas.centre import CentreOut
from ..schemas.notification import NotificationOut
from ..schemas.payment import PaymentOut
from ..schemas.procurement import ProcurementOut
from .enum_utils import enum_value


def centre_out(centre: ProcurementCentre) -> CentreOut:
    return CentreOut(
        id=centre.id,
        centre_code=centre.centre_code,
        name=centre.name,
        state=centre.state,
        district=centre.district,
        address=centre.address,
        latitude=float(centre.latitude) if centre.latitude is not None else None,
        longitude=float(centre.longitude) if centre.longitude is not None else None,
        opening_hours=centre.opening_hours,
        capacity_per_day=centre.capacity_per_day,
        crops=list(centre.crops or []),
        status=enum_value(centre.status).capitalize(),  # OPEN -> Open
        distance_km=float(centre.distance_km) if centre.distance_km is not None else None,
        created_at=centre.created_at,
        updated_at=centre.updated_at,
    )


def procurement_out(record: ProcurementRecord) -> ProcurementOut:
    return ProcurementOut(
        id=str(record.id),
        farmer_id=str(record.farmer_id),
        centre_id=record.centre_id,
        queue_entry_id=str(record.queue_entry_id) if record.queue_entry_id else None,
        crop=record.crop,
        quantity_kg=float(record.quantity_kg),
        unit=record.unit,
        quality_status=enum_value(record.quality_status),
        procurement_status=enum_value(record.procurement_status),
        rate_per_quintal=float(record.rate_per_quintal) if record.rate_per_quintal is not None else None,
        amount=float(record.amount) if record.amount is not None else None,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def payment_out(payment: Payment) -> PaymentOut:
    return PaymentOut(
        id=str(payment.id),
        farmer_id=str(payment.farmer_id),
        procurement_id=str(payment.procurement_id),
        amount=float(payment.amount),
        payment_status=enum_value(payment.payment_status),
        transaction_reference=payment.transaction_reference,
        paid_at=payment.paid_at,
        created_at=payment.created_at,
    )


def notification_out(note: Notification, farmer_id: Optional[str] = None) -> NotificationOut:
    return NotificationOut(
        id=str(note.id),
        farmer_id=farmer_id or (str(note.farmer_id) if note.farmer_id else None),
        type=enum_value(note.type).lower(),  # SUCCESS -> success (frontend union)
        title=note.title,
        message=note.message,
        read=note.read,
        timestamp=int(note.created_at.timestamp() * 1000),
        created_at=note.created_at,
    )
