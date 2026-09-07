"""Shared enumerations used by models, schemas and services."""

from __future__ import annotations

import enum


class CentreStatus(str, enum.Enum):
    OPEN = "OPEN"
    BUSY = "BUSY"
    FULL = "FULL"
    CLOSED = "CLOSED"


class SlotStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class QueueEntryStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"
    ON_HOLD = "ON_HOLD"


#: Statuses that represent a farmer still inside / ahead of the live queue.
ACTIVE_QUEUE_STATUSES: tuple[QueueEntryStatus, ...] = (
    QueueEntryStatus.WAITING,
    QueueEntryStatus.CALLED,
    QueueEntryStatus.IN_PROGRESS,
    QueueEntryStatus.ON_HOLD,
)


class ProcurementStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class QualityStatus(str, enum.Enum):
    PENDING = "PENDING"
    PASSED = "PASSED"
    REJECTED = "REJECTED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"


class NotificationType(str, enum.Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"


class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    OFFICER = "OFFICER"
