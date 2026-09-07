"""Auth schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .farmer import PHONE_PATTERN, FarmerOut


class FarmerRegisterRequest(BaseModel):
    """Registration payload. Password is optional (demo OTP login otherwise)."""

    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(pattern=PHONE_PATTERN)
    email: Optional[str] = None
    date_of_birth: Optional[str] = Field(default=None, max_length=16)
    address: Optional[str] = Field(default=None, max_length=400)
    state: Optional[str] = Field(default=None, max_length=64)
    district: Optional[str] = Field(default=None, max_length=64)
    village: Optional[str] = Field(default=None, max_length=96)
    land_size_acres: Optional[float] = Field(default=None, gt=0)  # no arbitrary upper cap
    crop: Optional[str] = Field(default=None, max_length=64)
    quantity_kg: Optional[float] = Field(default=None, gt=0)
    preferred_centre_id: Optional[str] = None
    aadhaar: Optional[str] = Field(default=None, max_length=16)
    password: Optional[str] = Field(default=None, min_length=4, max_length=128)


class FarmerLoginRequest(BaseModel):
    mobile: str = Field(pattern=PHONE_PATTERN)
    password: Optional[str] = Field(default=None, min_length=4, max_length=128)
    otp: Optional[str] = Field(default=None, min_length=4, max_length=8)


class AuthToken(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_at: datetime


class FarmerAuthResponse(BaseModel):
    farmer: FarmerOut
    token: AuthToken


class OfficerLoginRequest(BaseModel):
    officer_id: str = Field(min_length=3, max_length=24)
    password: str = Field(min_length=4, max_length=128)


class OfficerOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    officer_code: str
    name: str
    designation: str
    centre_id: Optional[int] = None


class OfficerAuthResponse(BaseModel):
    officer: OfficerOut
    token: AuthToken
