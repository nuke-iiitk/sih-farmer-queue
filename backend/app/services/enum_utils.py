"""Helpers for working with enum-valued String columns.

The models store enum values as VARCHAR (e.g. `status`), so SQLAlchemy returns
plain strings on read. These helpers normalise between the stored string and
the Python enum so the rest of the code can always treat them as enums.
"""

from __future__ import annotations

import enum
from typing import Any, TypeVar

E = TypeVar("E", bound=enum.Enum)


def enum_value(value: Any) -> str:
    """`CentreStatus.OPEN` -> 'OPEN'; 'OPEN' -> 'OPEN'."""
    return value.value if hasattr(value, "value") else value


def to_enum(enum_type: type[E], value: Any) -> E:
    """Coerce a stored string (or existing enum) into the enum type."""
    if isinstance(value, enum_type):
        return value
    return enum_type(value)