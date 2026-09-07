"""Domain errors mapped to clean HTTP responses by app.main."""

from __future__ import annotations


class DomainError(Exception):
    """Base class for expected (user-facing) domain failures."""

    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, detail: str, *, status_code: int | None = None, code: str | None = None):
        super().__init__(detail)
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"


class ConflictError(DomainError):
    status_code = 409
    code = "conflict"


class DomainValidationError(DomainError):
    status_code = 422
    code = "validation_error"


class AuthError(DomainError):
    status_code = 401
    code = "unauthorized"
