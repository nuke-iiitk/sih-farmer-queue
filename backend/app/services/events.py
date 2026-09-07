"""Event bus for realtime queue updates.

Today: a tiny in-process asyncio pub/sub used by the `/ws/queue/{centre_id}`
WebSocket endpoint. The queue service publishes after every committed change.

Tomorrow (Redis): replace `EventBus.publish`/`subscribe` internals with
Redis pub/sub (`redis.publish(channel, json)` + a background reader task that
fans messages out to local subscribers) — no caller in routers/services/WS
needs to change, and the PostgreSQL database stays the source of truth.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)

QUEUE_CHANNEL_PREFIX = "queue:"
_SUBSCRIBER_QUEUE_SIZE = 64


def queue_channel(centre_id: int | str) -> str:
    return f"{QUEUE_CHANNEL_PREFIX}{centre_id}"


class EventBus:
    """Minimal async pub/sub keyed by channel name."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[Any]]] = {}

    def subscribe(self, channel: str) -> asyncio.Queue[Any]:
        sub: asyncio.Queue[Any] = asyncio.Queue(maxsize=_SUBSCRIBER_QUEUE_SIZE)
        self._subscribers.setdefault(channel, set()).add(sub)
        return sub

    def unsubscribe(self, channel: str, sub: asyncio.Queue[Any]) -> None:
        self._subscribers.get(channel, set()).discard(sub)

    async def publish(self, channel: str, payload: dict[str, Any]) -> None:
        for sub in list(self._subscribers.get(channel, ())):
            try:
                sub.put_nowait(payload)
            except asyncio.QueueFull:  # pragma: no cover - slow consumer
                logger.warning("event bus subscriber queue full; dropping message")

    def subscriber_count(self, channel: str) -> int:
        return len(self._subscribers.get(channel, ()))


event_bus = EventBus()


async def publish_queue_update(centre_id: int | str, payload: dict[str, Any]) -> None:
    """Notify live subscribers that a centre's queue changed."""
    await event_bus.publish(queue_channel(centre_id), payload)
