"""Pydantic v2 request/response schemas (DTOs).

SQLAlchemy models are never returned directly from routes — always through
these schemas so only intended fields are exposed and input is validated.
"""

from .auth import (
    AuthToken,
    FarmerAuthResponse,
    FarmerLoginRequest,
    FarmerRegisterRequest,
    OfficerAuthResponse,
    OfficerLoginRequest,
    OfficerOut,
)
from .centre import CentreOut
from .common import ApiMessage, HealthResponse
from .farmer import FarmerCreate, FarmerOut, FarmerUpdate
from .notification import NotificationCreate, NotificationOut, NotificationReadAllRequest
from .payment import PaymentCreate, PaymentOut
from .procurement import ProcurementCreate, ProcurementOut, ProcurementUpdate
from .queue import (
    AdvanceResponse,
    QueueCentreResponse,
    QueueEntryOut,
    QueueJoinRequest,
    QueueSlotMoveRequest,
    QueueStatusUpdate,
)
from .slot import SlotCreate, SlotOut, SlotUpdate

__all__ = [
    "AdvanceResponse",
    "ApiMessage",
    "AuthToken",
    "CentreOut",
    "FarmerAuthResponse",
    "FarmerCreate",
    "FarmerLoginRequest",
    "FarmerOut",
    "FarmerRegisterRequest",
    "FarmerUpdate",
    "HealthResponse",
    "NotificationCreate",
    "NotificationOut",
    "NotificationReadAllRequest",
    "OfficerAuthResponse",
    "OfficerLoginRequest",
    "OfficerOut",
    "PaymentCreate",
    "PaymentOut",
    "ProcurementCreate",
    "ProcurementOut",
    "ProcurementUpdate",
    "QueueCentreResponse",
    "QueueEntryOut",
    "QueueJoinRequest",
    "QueueSlotMoveRequest",
    "QueueStatusUpdate",
    "SlotCreate",
    "SlotOut",
    "SlotUpdate",
]
