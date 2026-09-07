"""Test bootstrap.

Environment is configured BEFORE any `app` import so the application engine
and Alembic target the dedicated test database (TEST_DATABASE_URL, falling
back to DATABASE_URL with a `_test` database name).
"""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _load_env_file() -> dict[str, str]:
    """Read backend/.env values (confirm the app uses pydantic-settings which
    also reads it, but conftest must resolve URLs before any app import)."""
    env: dict[str, str] = {}
    env_file = BACKEND_DIR / ".env"
    if env_file.exists():
        for raw in env_file.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def _test_database_url() -> str:
    env = _load_env_file()
    url = os.environ.get("TEST_DATABASE_URL", "").strip() or env.get("TEST_DATABASE_URL", "").strip()
    if url:
        return url
    base = os.environ.get("DATABASE_URL", "").strip() or env.get("DATABASE_URL", "").strip()
    if base:
        return f"{base.rsplit('/', 1)[0]}/kisan_procurement_test"
    return "postgresql+psycopg://kisan_app:kisan_app@localhost:5432/kisan_procurement_test"


TEST_DATABASE_URL = _test_database_url()
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "pytest-only-secret-key")
os.environ.setdefault("REQUIRE_OFFICER_AUTH", "false")

# 1) Import the database module, then swap in a loop-safe (NullPool) engine.
import app.database as database  # noqa: E402

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import NullPool  # noqa: E402

database.engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
database.SessionLocal = async_sessionmaker(
    bind=database.engine, expire_on_commit=False, autoflush=False
)

# 2) Bring the test database to the latest migration via Alembic itself
#    (this also validates the migration files on every test run).
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402


def _run_migrations() -> None:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(cfg, "head")


_run_migrations()

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models import Base, CentreStatus, ProcurementCentre  # noqa: E402


async def _truncate() -> None:
    tables = ", ".join(t.name for t in reversed(Base.metadata.sorted_tables))
    async with database.engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
        await conn.execute(text("ALTER SEQUENCE IF EXISTS farmer_code_seq RESTART WITH 500"))


@pytest.fixture(autouse=True)
async def clean_database():
    """Every test starts from a freshly migrated, empty schema."""
    yield
    await _truncate()


@pytest.fixture
async def client():
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http


@pytest.fixture
async def centre():
    """One test centre; returns its id/code."""
    async with SessionLocal() as db:
        row = ProcurementCentre(
            centre_code="PC-T01",
            name="Test Procurement Centre",
            state="Kerala",
            district="Kottayam",
            address="Test Address",
            opening_hours="8:00 AM – 5:00 PM",
            capacity_per_day=200,
            crops=["Paddy", "Coconut"],
            status=CentreStatus.OPEN,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
        return {"id": row.id, "code": row.centre_code}


async def register_farmer(client: AsyncClient, phone: str, name: str = "Test Farmer") -> dict:
    """Convenience: register a farmer and return the parsed payload."""
    response = await client.post(
        "/api/auth/farmer/register",
        json={
            "name": name,
            "phone": phone,
            "state": "Kerala",
            "district": "Kottayam",
            "village": "Testvillage",
            "crop": "Paddy",
            "quantity_kg": 500,
            "land_size_acres": 1.5,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def create_slot(
    client: AsyncClient, centre_id: int, capacity: int = 12, start: str = "10:00"
) -> dict:
    response = await client.post(
        f"/api/centres/{centre_id}/slots",
        json={
            "date": __import__("datetime").date.today().isoformat(),
            "start_time": start,
            "end_time": f"{int(start.split(':')[0]) + 1:02d}:00",
            "capacity": capacity,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def join_queue(client: AsyncClient, farmer_code: str, centre_id: int, slot_id: str) -> dict:
    response = await client.post(
        "/api/queue/join",
        json={
            "farmer_id": farmer_code,
            "centre_id": str(centre_id),
            "slot_id": slot_id,
            "produce": "Paddy",
            "quantity_kg": 500,
        },
    )
    return response.json()
