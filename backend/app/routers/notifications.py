"""Notification endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import Notification
from ..schemas.notification import (
    NotificationCreate,
    NotificationOut,
    NotificationReadAllRequest,
)
from ..services.errors import NotFoundError
from ..services.presenters import notification_out
from ..services.resolvers import resolve_farmer

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(
    farmer_id: Optional[str] = Query(default=None),
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_session),
) -> list[NotificationOut]:
    stmt = select(Notification).order_by(Notification.created_at.desc()).limit(limit)
    farmer_uuid = None
    if farmer_id:
        farmer = await resolve_farmer(db, farmer_id)
        farmer_uuid = farmer.id
        stmt = stmt.where(Notification.farmer_id == farmer_uuid)
    if unread_only:
        stmt = stmt.where(Notification.read.is_(False))
    notes = (await db.execute(stmt)).scalars().all()
    return [
        notification_out(n, farmer_id=str(farmer_uuid) if farmer_uuid else None) for n in notes
    ]


@router.post("", response_model=NotificationOut, status_code=201)
async def create_notification(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_session),
) -> NotificationOut:
    farmer_uuid = None
    if payload.farmer_id:
        farmer = await resolve_farmer(db, payload.farmer_id)
        farmer_uuid = farmer.id
    note = Notification(
        farmer_id=farmer_uuid,
        type=payload.type,
        title=payload.title,
        message=payload.message,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return notification_out(note, farmer_id=str(farmer_uuid) if farmer_uuid else None)


@router.patch("/read-all", response_model=dict)
async def read_all(
    payload: NotificationReadAllRequest,
    db: AsyncSession = Depends(get_session),
) -> dict:
    farmer = await resolve_farmer(db, payload.farmer_id)
    result = await db.execute(
        update(Notification)
        .where(Notification.farmer_id == farmer.id, Notification.read.is_(False))
        .values(read=True)
    )
    await db.commit()
    return {"updated": result.rowcount or 0}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def read_one(
    notification_id: str,
    db: AsyncSession = Depends(get_session),
) -> NotificationOut:
    try:
        note_uuid = uuid.UUID(notification_id)
    except ValueError as exc:
        raise NotFoundError(
            f"Notification {notification_id!r} not found", code="notification_not_found"
        ) from exc
    note = await db.get(Notification, note_uuid)
    if note is None:
        raise NotFoundError(
            f"Notification {notification_id!r} not found", code="notification_not_found"
        )
    note.read = True
    await db.commit()
    await db.refresh(note)
    return notification_out(note)
