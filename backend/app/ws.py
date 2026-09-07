"""WebSocket endpoint for live queue updates.

The frontend's `services/queueService.ts` already anticipates this channel
(`/ws/queue/{centreId}`). Payloads are full queue snapshots so clients can
drop-in replace their poller later. When Redis is introduced, the event bus
becomes a Redis pub/sub bridge without changing this endpoint's contract.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .database import SessionLocal
from .services.events import event_bus, queue_channel
from .services.queue_service import get_centre_queue

router = APIRouter()

_CLOSE_MESSAGE = "close"


@router.websocket("/ws/queue/{centre_id}")
async def queue_socket(websocket: WebSocket, centre_id: int) -> None:
    await websocket.accept()
    channel = queue_channel(centre_id)
    subscriber = event_bus.subscribe(channel)
    try:
        # Initial snapshot so the client renders immediately.
        async with SessionLocal() as db:
            snapshot = await get_centre_queue(db, str(centre_id))
        await websocket.send_json(json.loads(snapshot.model_dump_json()))

        while True:
            receive_task = asyncio.create_task(websocket.receive_text())
            message_task = asyncio.create_task(subscriber.get())
            done, pending = await asyncio.wait(
                {receive_task, message_task}, return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()

            if message_task in done:
                # A queue change happened — push a fresh snapshot.
                message_task.result()
                async with SessionLocal() as db:
                    snapshot = await get_centre_queue(db, str(centre_id))
                await websocket.send_json(json.loads(snapshot.model_dump_json()))

            if receive_task in done:
                incoming = receive_task.result()
                if incoming == _CLOSE_MESSAGE:
                    break
    except WebSocketDisconnect:
        pass
    finally:
        event_bus.unsubscribe(channel, subscriber)
