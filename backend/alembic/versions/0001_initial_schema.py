"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-07

Initial PostgreSQL schema for the farmer procurement system:
procurement_centres, farmers, officers, slots, token_counters,
queue_entries (with concurrency-safe partial unique index),
procurement_records, payments, notifications and the farmer_code_seq sequence.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS farmer_code_seq START WITH 500 INCREMENT BY 1")

    op.create_table(
        "procurement_centres",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("centre_code", sa.String(length=24), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("state", sa.String(length=64), nullable=False),
        sa.Column("district", sa.String(length=64), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("opening_hours", sa.String(length=64), nullable=True),
        sa.Column("capacity_per_day", sa.Integer(), nullable=False),
        sa.Column("crops", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("distance_km", sa.Numeric(6, 1), nullable=True),
        sa.Column("phone", sa.String(length=15), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("capacity_per_day > 0", name="ck_centre_capacity_positive"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("centre_code", name="uq_centre_code"),
    )
    op.create_index("ix_centres_state_district", "procurement_centres", ["state", "district"])
    op.create_index("ix_procurement_centres_centre_code", "procurement_centres", ["centre_code"])
    op.create_index("ix_procurement_centres_state", "procurement_centres", ["state"])
    op.create_index("ix_procurement_centres_district", "procurement_centres", ["district"])
    op.create_index("ix_procurement_centres_status", "procurement_centres", ["status"])

    op.create_table(
        "farmers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("farmer_code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=15), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("aadhaar_hash", sa.String(length=128), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("state", sa.String(length=64), nullable=True),
        sa.Column("district", sa.String(length=64), nullable=True),
        sa.Column("village", sa.String(length=96), nullable=True),
        sa.Column("land_size_acres", sa.Numeric(6, 2), nullable=True),
        sa.Column("preferred_crop", sa.String(length=64), nullable=True),
        sa.Column("quantity_kg", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "preferred_centre_id",
            sa.Integer(),
            sa.ForeignKey("procurement_centres.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("password_hash", sa.String(length=256), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["preferred_centre_id"], ["procurement_centres.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("farmer_code", name="uq_farmer_code"),
        sa.UniqueConstraint("phone", name="uq_farmer_phone"),
    )
    op.create_index("ix_farmers_farmer_code", "farmers", ["farmer_code"])
    op.create_index("ix_farmers_phone", "farmers", ["phone"])
    op.create_index("ix_farmers_state_district", "farmers", ["state", "district"])
    op.create_index("ix_farmers_created_at", "farmers", ["created_at"])

    op.create_table(
        "officers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("officer_code", sa.String(length=24), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("designation", sa.String(length=96), nullable=False),
        sa.Column(
            "centre_id",
            sa.Integer(),
            sa.ForeignKey("procurement_centres.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("password_hash", sa.String(length=256), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("officer_code", name="uq_officer_code"),
    )
    op.create_index("ix_officers_officer_code", "officers", ["officer_code"])

    op.create_table(
        "slots",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "centre_id",
            sa.Integer(),
            sa.ForeignKey("procurement_centres.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("booked_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("note", sa.String(length=160), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("capacity > 0", name="ck_slot_capacity_positive"),
        sa.CheckConstraint(
            "booked_count >= 0 AND booked_count <= capacity", name="ck_slot_booked_bounds"
        ),
        sa.ForeignKeyConstraint(["centre_id"], ["procurement_centres.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("centre_id", "date", "start_time", name="uq_slot_centre_date_start"),
    )
    op.create_index("ix_slots_centre_date", "slots", ["centre_id", "date"])
    op.create_index("ix_slots_status", "slots", ["status"])

    op.create_table(
        "token_counters",
        sa.Column("last_token", sa.Integer(), nullable=False),
        sa.Column(
            "centre_id",
            sa.Integer(),
            sa.ForeignKey("procurement_centres.id", ondelete="CASCADE"),
            autoincrement=True,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["centre_id"], ["procurement_centres.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("centre_id"),
    )

    op.create_table(
        "queue_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "farmer_id",
            sa.Uuid(),
            sa.ForeignKey("farmers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "centre_id",
            sa.Integer(),
            sa.ForeignKey("procurement_centres.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "slot_id",
            sa.Uuid(),
            sa.ForeignKey("slots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_number", sa.Integer(), nullable=False),
        sa.Column("token_code", sa.String(length=24), nullable=False),
        sa.Column("produce", sa.String(length=64), nullable=False),
        sa.Column("quantity_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("arrived", sa.Boolean(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("called_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("in_progress_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["centre_id"], ["procurement_centres.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["slot_id"], ["slots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("centre_id", "token_number", name="uq_queue_centre_token"),
    )
    op.create_index("ix_queue_centre_status_token", "queue_entries", ["centre_id", "status", "token_number"])
    op.create_index("ix_queue_entries_centre_id", "queue_entries", ["centre_id"])
    op.create_index("ix_queue_entries_farmer_id", "queue_entries", ["farmer_id"])
    op.create_index("ix_queue_entries_slot_id", "queue_entries", ["slot_id"])
    op.create_index("ix_queue_entries_status", "queue_entries", ["status"])
    op.create_index("ix_queue_entries_token_code", "queue_entries", ["token_code"])
    # Duplicate-join guard: one ACTIVE entry per farmer per centre.
    op.create_index(
        "uq_queue_farmer_active_per_centre",
        "queue_entries",
        ["farmer_id", "centre_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('WAITING','CALLED','IN_PROGRESS','ON_HOLD')"),
    )

    op.create_table(
        "procurement_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "farmer_id",
            sa.Uuid(),
            sa.ForeignKey("farmers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "centre_id",
            sa.Integer(),
            sa.ForeignKey("procurement_centres.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "queue_entry_id",
            sa.Uuid(),
            sa.ForeignKey("queue_entries.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("crop", sa.String(length=64), nullable=False),
        sa.Column("quantity_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(length=8), nullable=False),
        sa.Column("quality_status", sa.String(length=16), nullable=False),
        sa.Column("procurement_status", sa.String(length=16), nullable=False),
        sa.Column("rate_per_quintal", sa.Numeric(10, 2), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["centre_id"], ["procurement_centres.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["queue_entry_id"], ["queue_entries.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_procurements_centre_id", "procurement_records", ["centre_id"])
    op.create_index("ix_procurements_farmer_id", "procurement_records", ["farmer_id"])
    op.create_index("ix_procurements_queue_entry_id", "procurement_records", ["queue_entry_id"])
    op.create_index("ix_procurement_records_procurement_status", "procurement_records", ["procurement_status"])

    op.create_table(
        "payments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "farmer_id",
            sa.Uuid(),
            sa.ForeignKey("farmers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "procurement_id",
            sa.Uuid(),
            sa.ForeignKey("procurement_records.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("payment_status", sa.String(length=16), nullable=False),
        sa.Column("transaction_reference", sa.String(length=64), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["procurement_id"], ["procurement_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("procurement_id", name="uq_payment_procurement"),
        sa.UniqueConstraint("transaction_reference", name="uq_payment_transaction_reference"),
    )
    op.create_index("ix_payments_farmer_id", "payments", ["farmer_id"])
    op.create_index("ix_payments_payment_status", "payments", ["payment_status"])
    op.create_index("ix_payments_procurement_id", "payments", ["procurement_id"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "farmer_id",
            sa.Uuid(),
            sa.ForeignKey("farmers.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["farmer_id"], ["farmers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])
    op.create_index("ix_notifications_farmer_read", "notifications", ["farmer_id", "read"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("payments")
    op.drop_table("procurement_records")
    op.drop_index("uq_queue_farmer_active_per_centre", table_name="queue_entries")
    op.drop_table("queue_entries")
    op.drop_table("token_counters")
    op.drop_table("slots")
    op.drop_table("officers")
    op.drop_table("farmers")
    op.drop_table("procurement_centres")
    op.execute("DROP SEQUENCE IF EXISTS farmer_code_seq")
