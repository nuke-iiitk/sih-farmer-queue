"""Token counter — one row per centre, atomically incremented.

Tokens are issued with a single atomic statement:

    INSERT INTO token_counters (centre_id, last_token) VALUES (:cid, 1)
    ON CONFLICT (centre_id) DO UPDATE SET last_token = token_counters.last_token + 1
    RETURNING last_token;

The UPDATE takes a row lock until the transaction ends, so two concurrent
joins can never observe (and persist) the same token number — unlike a naive
`SELECT MAX(token_number) + 1`.
"""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class TokenCounter(Base):
    __tablename__ = "token_counters"

    centre_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_centres.id", ondelete="CASCADE"), primary_key=True
    )
    last_token: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
