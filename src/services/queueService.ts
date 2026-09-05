/**
 * Real-time queue service (frontend architecture).
 *
 * The farmer/officer UIs subscribe to queue updates through this module only,
 * so the mock simulation below can later be replaced by a real WebSocket
 * connection to the FastAPI backend, e.g.:
 *
 *   const ws = new WebSocket(`${WS_BASE}/ws/queue/${centreId}`);
 *   ws.onmessage = (event) => listeners.forEach((l) => l(JSON.parse(event.data)));
 *
 * Nothing else in the app needs to change.
 */

import type { CentreQueue } from '../data/mockData';

export type QueueUpdate = {
  centreId: string;
  queue: CentreQueue;
  /** Milliseconds since epoch when the update was produced. */
  at: number;
};

type Listener = (update: QueueUpdate) => void;

let listeners: Listener[] = [];

export function subscribeToQueue(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

function emit(update: QueueUpdate) {
  listeners.forEach((listener) => listener(update));
}

/**
 * Publish a queue snapshot to all subscribers.
 * The store calls this after every simulated (or, in future, WebSocket-driven)
 * queue mutation.
 */
export function publishQueueUpdate(update: QueueUpdate) {
  emit(update);
}
