"""FastAPI application entry point (`uvicorn app.main:app`)."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import text

from . import ws
from .config import settings
from .database import SessionLocal, engine
from .routers import auth, centres, farmers, notifications, payments, procurements, queue, slots
from .schemas.common import HealthResponse
from .services.errors import DomainError

logger = logging.getLogger("kisan")

API_PREFIX = "/api"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_production and settings.secret_is_default:
        raise RuntimeError(
            "SECRET_KEY must be set to a strong value when ENVIRONMENT=production"
        )
    logger.info("Starting %s v%s (%s)", settings.app_name, settings.app_version, settings.environment)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    # CORS: explicit allow-list from env — never wildcard in production.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(auth.router, prefix=API_PREFIX)
    app.include_router(farmers.router, prefix=API_PREFIX)
    app.include_router(centres.router, prefix=API_PREFIX)
    app.include_router(slots.router, prefix=API_PREFIX)
    app.include_router(queue.router, prefix=API_PREFIX)
    app.include_router(procurements.router, prefix=API_PREFIX)
    app.include_router(payments.router, prefix=API_PREFIX)
    app.include_router(notifications.router, prefix=API_PREFIX)
    app.include_router(ws.router)  # /ws/queue/{centre_id}

    @app.exception_handler(DomainError)
    async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "code": "internal_error"},
        )

    @app.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    @app.get("/health", response_model=HealthResponse, tags=["health"])
    async def health() -> HealthResponse:
        database = "up"
        try:
            async with SessionLocal() as session:
                await session.execute(text("SELECT 1"))
        except Exception:  # pragma: no cover - depends on live DB
            database = "down"
        return HealthResponse(
            status="ok" if database == "up" else "degraded",
            database=database,
            version=settings.app_version,
        )

    return app


app = create_app()
