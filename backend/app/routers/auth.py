"""Auth endpoints: farmer register/login, officer login."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_session
from ..models import Farmer, Officer
from ..schemas.auth import (
    AuthToken,
    FarmerAuthResponse,
    FarmerLoginRequest,
    FarmerRegisterRequest,
    OfficerAuthResponse,
    OfficerLoginRequest,
    OfficerOut,
)
from ..schemas.farmer import FarmerOut
from ..services.errors import AuthError, DomainValidationError, NotFoundError
from ..services.farmer_service import create_farmer
from ..services.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _token(subject: str, role: str) -> AuthToken:
    token, expires_at = create_access_token(subject=subject, role=role)
    return AuthToken(token=token, expires_at=expires_at)


@router.post("/farmer/register", response_model=FarmerAuthResponse, status_code=201)
async def register_farmer(
    payload: FarmerRegisterRequest,
    db: AsyncSession = Depends(get_session),
) -> FarmerAuthResponse:
    farmer = await create_farmer(db, payload)
    return FarmerAuthResponse(farmer=FarmerOut.from_model(farmer), token=_token(str(farmer.id), "FARMER"))


@router.post("/farmer/login", response_model=FarmerAuthResponse)
async def login_farmer(
    payload: FarmerLoginRequest,
    db: AsyncSession = Depends(get_session),
) -> FarmerAuthResponse:
    if not payload.password and not payload.otp:
        raise DomainValidationError("Provide a password or an OTP")

    farmer = (
        await db.execute(select(Farmer).where(Farmer.phone == payload.mobile))
    ).scalar_one_or_none()
    if farmer is None:
        raise NotFoundError(
            "No farmer is registered with this mobile number", code="farmer_not_found"
        )
    if not farmer.is_active:
        raise AuthError("This account has been disabled", code="account_disabled")

    if payload.password is not None:
        if not farmer.password_hash or not verify_password(payload.password, farmer.password_hash):
            raise AuthError("Invalid mobile number or password", code="invalid_credentials")
    else:
        # Demo OTP flow (development): mirrors the prototype's fixed OTP.
        if payload.otp != settings.demo_otp:
            raise AuthError("Invalid OTP", code="invalid_otp")

    return FarmerAuthResponse(farmer=FarmerOut.from_model(farmer), token=_token(str(farmer.id), "FARMER"))


@router.post("/officer/login", response_model=OfficerAuthResponse)
async def login_officer(
    payload: OfficerLoginRequest,
    db: AsyncSession = Depends(get_session),
) -> OfficerAuthResponse:
    officer = (
        await db.execute(
            select(Officer).where(Officer.officer_code == payload.officer_id.strip().upper())
        )
    ).scalar_one_or_none()
    if officer is None or not verify_password(payload.password, officer.password_hash):
        raise AuthError("Invalid officer id or password", code="invalid_credentials")
    if not officer.is_active:
        raise AuthError("This account has been disabled", code="account_disabled")
    return OfficerAuthResponse(
        officer=OfficerOut.model_validate(officer), token=_token(str(officer.id), "OFFICER")
    )
