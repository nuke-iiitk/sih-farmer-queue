"""Critical API tests: farmers, centres, slots, queue."""

from __future__ import annotations

import datetime
import uuid

from conftest import create_slot, join_queue, register_farmer

TODAY = datetime.date.today().isoformat()


# ------------------------------------------------------------------- farmers


async def test_farmer_registration(client):
    payload = await register_farmer(client, "9812345678")
    farmer = payload["farmer"]
    assert farmer["farmer_code"].startswith("FPP-F-")
    assert farmer["phone"] == "9812345678"
    assert farmer["name"] == "Test Farmer"
    assert "token" in payload

    duplicate = await client.post(
        "/api/auth/farmer/register",
        json={"name": "Another Farmer", "phone": "9812345678"},
    )
    assert duplicate.status_code == 409


async def test_farmer_login_otp_and_password(client):
    await register_farmer(client, "9812345678")

    # OTP flow (demo OTP)
    response = await client.post(
        "/api/auth/farmer/login", json={"mobile": "9812345678", "otp": "123456"}
    )
    assert response.status_code == 200
    assert response.json()["farmer"]["phone"] == "9812345678"

    # Wrong OTP
    bad = await client.post(
        "/api/auth/farmer/login", json={"mobile": "9812345678", "otp": "000000"}
    )
    assert bad.status_code == 401

    # Unknown mobile
    missing = await client.post(
        "/api/auth/farmer/login", json={"mobile": "9999999999", "otp": "123456"}
    )
    assert missing.status_code == 404


async def test_farmer_get_and_update(client):
    farmer = (await register_farmer(client, "9812345678"))["farmer"]

    got = await client.get(f"/api/farmers/{farmer['farmer_code']}")
    assert got.status_code == 200
    assert got.json()["id"] == farmer["id"]

    updated = await client.put(
        f"/api/farmers/{farmer['id']}",
        json={"village": "Newvillage", "quantity_kg": 900},
    )
    assert updated.status_code == 200
    assert updated.json()["village"] == "Newvillage"
    assert updated.json()["quantity_kg"] == "900"

    missing = await client.get(f"/api/farmers/{uuid.uuid4()}")
    assert missing.status_code == 404


# ------------------------------------------------------------------- centres


async def test_centre_list_filters_and_detail(client, centre):
    listing = await client.get("/api/centres")
    assert listing.status_code == 200
    centres = listing.json()
    assert len(centres) == 1
    assert centres[0]["status"] == "Open"  # frontend-friendly capitalisation

    filtered = await client.get("/api/centres", params={"state": "Tamil Nadu"})
    assert filtered.json() == []

    detail = await client.get(f"/api/centres/{centre['id']}")
    assert detail.status_code == 200
    assert detail.json()["centre_code"] == "PC-T01"

    by_code = await client.get(f"/api/centres/{centre['code']}")
    assert by_code.status_code == 200

    missing = await client.get("/api/centres/9999")
    assert missing.status_code == 404


# --------------------------------------------------------------------- slots


async def test_slot_create_list_update(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    assert slot["date"] == TODAY
    assert slot["start"] == "10:00"
    assert slot["capacity"] == 12
    assert slot["closed"] is False
    assert slot["remaining"] == 12

    listing = await client.get(f"/api/centres/{centre['id']}/slots", params={"date": TODAY})
    assert [s["id"] for s in listing.json()] == [slot["id"]]

    patched = await client.patch(
        f"/api/slots/{slot['id']}", json={"capacity": 5, "closed": True}
    )
    assert patched.status_code == 200
    assert patched.json()["capacity"] == 5
    assert patched.json()["closed"] is True

    invalid = await client.patch(f"/api/slots/{slot['id']}", json={"capacity": 0})
    assert invalid.status_code == 422


# --------------------------------------------------------------------- queue


async def test_queue_join_token_position_and_eta(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    first = (await register_farmer(client, "9810000001"))["farmer"]
    second = (await register_farmer(client, "9810000002"))["farmer"]
    third = (await register_farmer(client, "9810000003"))["farmer"]

    entry1 = await join_queue(client, first["farmer_code"], centre["id"], slot["id"])
    assert entry1["token"] == "FPP-1"
    assert entry1["position"] == 1
    assert entry1["farmers_ahead"] == 0
    assert entry1["estimated_wait_minutes"] == 0
    assert entry1["booking_status"] == "Waiting"

    entry2 = await join_queue(client, second["farmer_code"], centre["id"], slot["id"])
    entry3 = await join_queue(client, third["farmer_code"], centre["id"], slot["id"])
    assert entry2["token_number"] == 2
    assert entry3["position"] == 3
    assert entry3["farmers_ahead"] == 2
    assert entry3["estimated_wait_minutes"] == 14  # 2 * MINUTES_PER_FARMER

    # Centre snapshot is ordered by token number with derived positions
    snapshot = await client.get(f"/api/queue/centre/{centre['id']}")
    body = snapshot.json()
    assert body["counts"]["waiting"] == 3
    assert [e["token"] for e in body["entries"]] == ["FPP-1", "FPP-2", "FPP-3"]

    got = await client.get(f"/api/queue/{entry3['id']}")
    assert got.status_code == 200
    assert got.json()["position"] == 3


async def test_duplicate_queue_join_rejected(client, centre):
    slot_a = await create_slot(client, centre["id"], capacity=12, start="10:00")
    slot_b = await create_slot(client, centre["id"], capacity=12, start="11:00")
    farmer = (await register_farmer(client, "9810000001"))["farmer"]

    first = await join_queue(client, farmer["farmer_code"], centre["id"], slot_a["id"])
    assert first["status"] == "WAITING"

    # same slot again
    duplicate_same_slot = await join_queue(
        client, farmer["farmer_code"], centre["id"], slot_a["id"]
    )
    assert duplicate_same_slot["detail"] == "Farmer already has an active queue entry"

    # a different slot at the same centre is also blocked (one active entry)
    duplicate_other_slot = await join_queue(
        client, farmer["farmer_code"], centre["id"], slot_b["id"]
    )
    assert "detail" in duplicate_other_slot


async def test_queue_status_transitions(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    farmer = (await register_farmer(client, "9810000001"))["farmer"]
    entry = await join_queue(client, farmer["farmer_code"], centre["id"], slot["id"])

    # invalid jump: WAITING -> IN_PROGRESS
    invalid = await client.patch(
        f"/api/queue/{entry['id']}/status", json={"status": "IN_PROGRESS"}
    )
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "invalid_status_transition"

    # valid: WAITING -> CALLED -> IN_PROGRESS -> COMPLETED
    expected_booking = {"CALLED": "Waiting", "IN_PROGRESS": "Processing", "COMPLETED": "Completed"}
    for status in ("CALLED", "IN_PROGRESS", "COMPLETED"):
            response = await client.patch(
                f"/api/queue/{entry['id']}/status", json={"status": status}
            )
            assert response.status_code == 200, response.text
            assert response.json()["status"] == status
            assert response.json()["booking_status"] == expected_booking[status]

    # terminal state: no further transitions
    terminal = await client.patch(
        f"/api/queue/{entry['id']}/status", json={"status": "WAITING"}
    )
    assert terminal.status_code == 422


async def test_full_slot_rejected(client, centre):
    slot = await create_slot(client, centre["id"], capacity=1)
    first = (await register_farmer(client, "9810000001"))["farmer"]
    second = (await register_farmer(client, "9810000002"))["farmer"]

    ok = await join_queue(client, first["farmer_code"], centre["id"], slot["id"])
    assert ok["status"] == "WAITING"

    full = await join_queue(client, second["farmer_code"], centre["id"], slot["id"])
    assert full["detail"] == "This slot is full"

    # cancelled entry releases the seat
    await client.patch(f"/api/queue/{ok['id']}/status", json={"status": "CANCELLED"})
    retry = await join_queue(client, second["farmer_code"], centre["id"], slot["id"])
    assert retry["status"] == "WAITING"


async def test_advance_queue(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    for i in range(1, 4):
        farmer = (await register_farmer(client, f"981000000{i}"))["farmer"]
        await join_queue(client, farmer["farmer_code"], centre["id"], slot["id"])

    result = await client.post(f"/api/queue/centre/{centre['id']}/advance")
    assert result.status_code == 200
    body = result.json()
    assert body["completed"] is None  # nobody was being served
    assert body["now_serving"]["token"] == "FPP-1"

    result = await client.post(f"/api/queue/centre/{centre['id']}/advance")
    body = result.json()
    assert body["completed"]["token"] == "FPP-1"
    assert body["now_serving"]["token"] == "FPP-2"


async def test_farmer_bookings_listing(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    farmer = (await register_farmer(client, "9810000001"))["farmer"]
    entry = await join_queue(client, farmer["farmer_code"], centre["id"], slot["id"])

    listing = await client.get(f"/api/farmers/{farmer['farmer_code']}/queue")
    assert listing.status_code == 200
    entries = listing.json()
    assert len(entries) == 1
    assert entries[0]["id"] == entry["id"]
    assert entries[0]["centre"]["centre_code"] == "PC-T01"


# ---------------------------------------------------- procurements & payments


async def test_procurement_create_get_update(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    farmer = (await register_farmer(client, "9810000001"))["farmer"]
    entry = await join_queue(client, farmer["farmer_code"], centre["id"], slot["id"])

    created = await client.post(
        "/api/procurements",
        json={
            "farmer_id": farmer["farmer_code"],
            "centre_id": str(centre["id"]),
            "queue_entry_id": entry["id"],
            "crop": "Paddy",
            "quantity_kg": 760,
            "unit": "KG",
            "quality_status": "PASSED",
            "procurement_status": "COMPLETED",
            "rate_per_quintal": 2200,
            "amount": 16720,
        },
    )
    assert created.status_code == 201, created.text
    record = created.json()
    assert record["amount"] == 16720.0

    got = await client.get(f"/api/procurements/{record['id']}")
    assert got.status_code == 200

    farmer_list = await client.get(f"/api/farmers/{farmer['farmer_code']}/procurements")
    assert [r["id"] for r in farmer_list.json()] == [record["id"]]

    updated = await client.patch(
        f"/api/procurements/{record['id']}", json={"quality_status": "REJECTED"}
    )
    assert updated.json()["quality_status"] == "REJECTED"


async def test_payment_creation_and_retrieval(client, centre):
    slot = await create_slot(client, centre["id"], capacity=12)
    farmer = (await register_farmer(client, "9810000001"))["farmer"]
    entry = await join_queue(client, farmer["farmer_code"], centre["id"], slot["id"])

    record = (
        await client.post(
            "/api/procurements",
            json={
                "farmer_id": farmer["farmer_code"],
                "centre_id": str(centre["id"]),
                "queue_entry_id": entry["id"],
                "crop": "Paddy",
                "quantity_kg": 500,
                "amount": 11000,
                "procurement_status": "COMPLETED",
            },
        )
    ).json()

    payment_response = await client.post(
        "/api/payments",
        json={
            "procurement_id": record["id"],
            "amount": 11000,
            "payment_status": "PAID",
            "transaction_reference": "TXN-TEST-001",
        },
    )
    assert payment_response.status_code == 201, payment_response.text
    payment = payment_response.json()
    assert payment["farmer_id"] == farmer["id"]
    assert payment["paid_at"] is not None

    got = await client.get(f"/api/payments/{payment['id']}")
    assert got.status_code == 200
    assert got.json()["transaction_reference"] == "TXN-TEST-001"

    farmer_payments = await client.get(f"/api/farmers/{farmer['farmer_code']}/payments")
    assert [p["id"] for p in farmer_payments.json()] == [payment["id"]]

    # one payment per procurement
    duplicate = await client.post(
        "/api/payments", json={"procurement_id": record["id"], "amount": 1}
    )
    assert duplicate.status_code == 409


async def test_validation_errors_are_422(client, centre):
    bad_phone = await client.post(
        "/api/auth/farmer/register", json={"name": "Test", "phone": "12345"}
    )
    assert bad_phone.status_code == 422

    missing_slot = await client.post(
        "/api/queue/join",
        json={
            "farmer_id": "9810000001",
            "centre_id": str(centre["id"]),
            "produce": "Paddy",
            "quantity_kg": 100,
        },
    )
    assert missing_slot.status_code in (404, 422)


async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["database"] == "up"
