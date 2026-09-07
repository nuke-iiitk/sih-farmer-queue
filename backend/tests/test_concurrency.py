"""Concurrency tests: token uniqueness and capacity under parallel joins.

These run many joins against the same slot through the real ASGI app with
independent DB sessions — validating the atomic capacity update and the
row-locked token counter (no MAX()+1).
"""

from __future__ import annotations

import asyncio

from conftest import create_slot, register_farmer

TODAY = __import__("datetime").date.today().isoformat()


async def test_concurrent_joins_have_unique_tokens_and_respect_capacity(client, centre):
    capacity = 3
    slot = await create_slot(client, centre["id"], capacity=capacity)

    farmers = []
    for i in range(1, 7):  # twice the capacity
        farmers.append((await register_farmer(client, f"982000000{i}"))["farmer"])

    async def join(farmer: dict) -> dict:
        response = await client.post(
            "/api/queue/join",
            json={
                "farmer_id": farmer["farmer_code"],
                "centre_id": str(centre["id"]),
                "slot_id": slot["id"],
                "produce": "Paddy",
                "quantity_kg": 100,
            },
        )
        return {"status_code": response.status_code, "body": response.json()}

    results = await asyncio.gather(*(join(f) for f in farmers))

    successes = [r for r in results if r["status_code"] == 201]
    failures = [r for r in results if r["status_code"] == 409]

    assert len(successes) == capacity
    assert len(failures) == len(farmers) - capacity

    token_numbers = sorted(e["body"]["token_number"] for e in successes)
    assert token_numbers == [1, 2, 3], token_numbers
    assert len({e["body"]["token"] for e in successes}) == capacity

    # slot occupancy matches exactly the number of successful joins
    listing = await client.get(f"/api/centres/{centre['id']}/slots", params={"date": TODAY})
    booked = next(s for s in listing.json() if s["id"] == slot["id"])["booked"]
    assert booked == capacity

    # centre snapshot shows exactly `capacity` active entries
    snapshot = (await client.get(f"/api/queue/centre/{centre['id']}")).json()
    assert snapshot["counts"]["total_active"] == capacity


async def test_same_farmer_concurrent_join_single_entry(client, centre):
    """The same farmer hammering join concurrently must end up with ONE entry."""
    slot = await create_slot(client, centre["id"], capacity=12)
    farmer = (await register_farmer(client, "9830000001"))["farmer"]

    async def join() -> dict:
        response = await client.post(
            "/api/queue/join",
            json={
                "farmer_id": farmer["farmer_code"],
                "centre_id": str(centre["id"]),
                "slot_id": slot["id"],
                "produce": "Paddy",
                "quantity_kg": 100,
            },
        )
        return {"status_code": response.status_code, "body": response.json()}

    results = await asyncio.gather(*(join() for _ in range(5)))
    successes = [r for r in results if r["status_code"] == 201]
    assert len(successes) == 1, results

    snapshot = (await client.get(f"/api/queue/centre/{centre['id']}")).json()
    assert snapshot["counts"]["total_active"] == 1
    listing = await client.get(f"/api/centres/{centre['id']}/slots", params={"date": TODAY})
    booked = next(s for s in listing.json() if s["id"] == slot["id"])["booked"]
    assert booked == 1
