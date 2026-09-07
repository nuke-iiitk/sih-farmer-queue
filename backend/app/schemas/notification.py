"""Notification schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from ..models.enums import NotificationType


class NotificationCreate(BaseModel):
    farmer_id: Optional[str] = None  # uuid or farmer_code; None = broadcast later
    type: NotificationType = NotificationType.INFO
    title: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=1, max_length=1000)


class NotificationReadAllRequest(BaseModel):
    farmer_id: str


class NotificationOut(BaseModel):
    """Shape mirrors the frontend `AppNotification` type."""

    id: str
    farmer_id: Optional[str] = None
    type: str  # 'success' | 'info' | 'warning' | 'error'
    title: str
    message: str
    read: bool
    timestamp: int  # epoch milliseconds
    created_at: datetime
