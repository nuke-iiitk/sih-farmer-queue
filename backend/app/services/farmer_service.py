"""Farmer creation/update logic shared by /api/auth and /api/farmers."""

from __future__ import annotations
import re

from datetime import date

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Farmer, Notification, NotificationType
from ..schemas.auth import FarmerRegisterRequest
from ..schemas.farmer import FarmerUpdate, parse_dob
from .errors import ConflictError, NotFoundError
from .resolvers import resolve_farmer, resolve_preferred_centre
from .security import hash_aadhaar, hash_password


async def _farmer_code(db: AsyncSession) -> str:
    """Concurrency-safe sequential code via the farmer_code_seq DB sequence."""
    seq = (await db.execute(text("SELECT nextval('farmer_code_seq')"))).scalar_one()
    return f"FPP-F-{date.today().year}-{int(seq):04d}"


async def create_farmer(db: AsyncSession, payload: FarmerRegisterRequest) -> Farmer:
    phone = payload.phone
    existing = (
        await db.execute(select(Farmer.id).where(Farmer.phone == phone))
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            "A farmer with this mobile number is already registered", code="phone_taken"
        )

    preferred_centre_id = await resolve_preferred_centre(db, payload.preferred_centre_id)

    # Normalise real-world input from the frontend (tolerant of autofill/keyboard quirks).
    _aadhaar = re.sub(r"\D+", "", payload.aadhaar or "") if payload.aadhaar else None
    _dob = None
    if payload.date_of_birth:
        try:
            _dob = parse_dob(payload.date_of_birth)
        except (ValueError, TypeError):
            _dob = None  # frontend already validates DD/MM/YYYY; be safe here

    farmer = Farmer(
        farmer_code=await _farmer_code(db),
        name=payload.name.strip(),
        phone=phone,
        email=str(payload.email) if payload.email else None,
        aadhaar_hash=hash_aadhaar(_aadhaar) if _aadhaar else None,
        date_of_birth=_dob,
        address=payload.address,
        state=payload.state,
        district=payload.district,
        village=payload.village,
        land_size_acres=payload.land_size_acres,
        preferred_crop=payload.crop,
        quantity_kg=payload.quantity_kg,
        preferred_centre_id=preferred_centre_id,
        password_hash=hash_password(payload.password) if payload.password else None,
    )
    db.add(farmer)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError(
            "A farmer with this mobile number is already registered", code="phone_taken"
        ) from exc

    await db.refresh(farmer)
    db.add(
        Notification(
            farmer_id=farmer.id,
            type=NotificationType.SUCCESS,
            title="Welcome to Farmer Procurement Portal",
            message="Your farmer profile has been created. You can now book a procurement slot.",
        )
    )
    await db.commit()
    await db.refresh(farmer)
    return farmer


async def update_farmer(
    db: AsyncSession, farmer_id: str, payload: FarmerUpdate
) -> Farmer:
    farmer = await resolve_farmer(db, farmer_id)
    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] is not None:
        farmer.name = data["name"].strip()
    if "email" in data:
        farmer.email = str(data["email"]) if data["email"] else None
    if "date_of_birth" in data:
        farmer.date_of_birth = parse_dob(data["date_of_birth"])
    for field in ("address", "state", "district", "village", "crop"):
        if field in data:
            setattr(farmer, field, data[field])
    if "land_size_acres" in data:
        farmer.land_size_acres = data["land_size_acres"]
    if "quantity_kg" in data:
        farmer.quantity_kg = data["quantity_kg"]
    if "preferred_centre_id" in data:
        farmer.preferred_centre_id = await resolve_preferred_centre(
            db, data["preferred_centre_id"]
        )
    if data.get("password"):
        farmer.password_hash = hash_password(data["password"])

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("Update failed (duplicate field?)", code="update_conflict") from exc
    await db.refresh(farmer)
    return farmer


async def _ensure_farmer_exists(db: AsyncSession, farmer_id: str) -> Farmer:
    try:
        return await resolve_farmer(db, farmer_id)
    except NotFoundError:
        raise
