"""widen farmer numeric columns

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-07

Real mobile registrations can legitimately include very large land sizes
(e.g. field survey / consolidated holdings) — the original NUMERIC(6,2)
(max 9,999.99) overflowed with a 500 error on the live site. Widen
`land_size_acres` (and `quantity_kg` for headroom) to NUMERIC(12,2).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "farmers",
        "land_size_acres",
        existing_type=sa.Numeric(6,2),
        type_=sa.Numeric(12,2),
        existing_nullable=True,
    )
    op.alter_column(
        "farmers",
        "quantity_kg",
        existing_type=sa.Numeric(10,2),
        type_=sa.Numeric(12,2),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "farmers",
        "quantity_kg",
        existing_type=sa.Numeric(12,2),
        type_=sa.Numeric(10,2),
        existing_nullable=True,
    )
    op.alter_column(
        "farmers",
        "land_size_acres",
        existing_type=sa.Numeric(12,2),
        type_=sa.Numeric(6,2),
        existing_nullable=True,
    )