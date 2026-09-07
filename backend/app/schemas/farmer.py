"""Farmer schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PHONE_PATTERN = r"^[6-9]\d{9}$"
DOB_PATTERN = r"^\d{2}/\d{2}/\d{4}$"


def parse_dob(value: str | None) -> date | None:
    """`DD/MM/YYYY` (frontend format) -> `datetime.date`."""
    if not value:
        return None
    d, m, y = value.split("/")
    return date(int(y), int(m), int(d))


def format_dob(value: date | None) -> Optional[str]:
    if value is None:
        return None
    return f"{value.day:02d}/{value.month:02d}/{value.year:04d}"


def _num(value: object) -> Optional[str]:
    """Decimal -> trimmed plain string (the frontend uses string fields)."""
    if value is None:
        return None
    text = f"{value:f}".rstrip("0").rstrip(".")
    return text or "0"


class FarmerBase(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    phone: str = Field(pattern=PHONE_PATTERN)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[str] = Field(default=None, pattern=DOB_PATTERN)
    address: Optional[str] = Field(default=None, max_length=400)
    state: Optional[str] = Field(default=None, max_length=64)
    district: Optional[str] = Field(default=None, max_length=64)
    village: Optional[str] = Field(default=None, max_length=96)
    land_size_acres: Optional[float] = Field(default=None, gt=0, le=1000)
    crop: Optional[str] = Field(default=None, max_length=64)
    quantity_kg: Optional[float] = Field(default=None, gt=0, le=1_000_000)
    # Accepts a numeric centre id ("3") or a centre_code ("KL-KTM-01").
    preferred_centre_id: Optional[str] = None


class FarmerCreate(FarmerBase):
    """Registration payload. Password is optional (demo OTP login otherwise)."""

    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class FarmerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=120)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[str] = Field(default=None, pattern=DOB_PATTERN)
    address: Optional[str] = Field(default=None, max_length=400)
    state: Optional[str] = Field(default=None, max_length=64)
    district: Optional[str] = Field(default=None, max_length=64)
    village: Optional[str] = Field(default=None, max_length=96)
    land_size_acres: Optional[float] = Field(default=None, gt=0, le=1000)
    crop: Optional[str] = Field(default=None, max_length=64)
    quantity_kg: Optional[float] = Field(default=None, gt=0, le=1_000_000)
    preferred_centre_id: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class FarmerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    farmer_code: str
    name: str
    phone: str
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    land_size_acres: Optional[str] = None
    crop: Optional[str] = None
    quantity_kg: Optional[str] = None
    preferred_centre_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, farmer: object) -> "FarmerOut":
        return cls(
            id=str(farmer.id),  # type: ignore[attr-defined]
            farmer_code=farmer.farmer_code,  # type: ignore[attr-defined]
            name=farmer.name,  # type: ignore[attr-defined]
            phone=farmer.phone,  # type: ignore[attr-defined]
            email=farmer.email,  # type: ignore[attr-defined]
            date_of_birth=format_dob(farmer.date_of_birth),  # type: ignore[attr-defined]
            address=farmer.address,  # type: ignore[attr-defined]
            state=farmer.state,  # type: ignore[attr-defined]
            district=farmer.district,  # type: ignore[attr-defined]
            village=farmer.village,  # type: ignore[attr-defined]
            land_size_acres=_num(farmer.land_size_acres),  # type: ignore[attr-defined]
            crop=farmer.preferred_crop,  # type: ignore[attr-defined]
            quantity_kg=_num(farmer.quantity_kg),  # type: ignore[attr-defined]
            preferred_centre_id=farmer.preferred_centre_id,  # type: ignore[attr-defined]
            created_at=farmer.created_at,  # type: ignore[attr-defined]
            updated_at=farmer.updated_at,  # type: ignore[attr-defined]
        )
