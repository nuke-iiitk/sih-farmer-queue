/**
 * API boundary for the future FastAPI + PostgreSQL backend.
 *
 * The prototype resolves everything from the local mock store so that no fake
 * network calls are made. When the backend is ready, each function below maps
 * 1:1 to an endpoint — swap the body for a `fetch`/`axios` call and keep the
 * signatures untouched:
 *
 *   Auth            POST   /api/auth/farmer/login      { mobile, password | otp }
 *                   POST   /api/auth/farmer/register   { farmer }
 *                   POST   /api/auth/officer/login     { officerId, password }
 *   Centres         GET    /api/centres?state=&district=&crop=
 *                   GET    /api/centres/{id}
 *   Locations       GET    /api/locations   → replaces src/data/indiaLocations.ts
 *                                          (StateOrUt[]: 28 states + 8 UTs + districts)
 *   Slots           GET    /api/centres/{id}/slots?date=
 *                   PATCH  /api/slots/{id}             { capacity?, closed? }
 *                   POST   /api/slots                  { centreId, date, start, end, capacity }
 *   Bookings        POST   /api/bookings               { centreId, slotId, produce, quantityKg }
 *                   GET    /api/bookings?farmerId=
 *                   PATCH  /api/bookings/{id}          { status? , slotId? }
 *   Queue           WS     /ws/queue/{centreId}        (see services/queueService.ts)
 *   Notifications   GET    /api/notifications?farmerId=
 *                   POST   /api/notifications/dispatch (Firebase / Twilio / WhatsApp later)
 */

import type {
  AppNotification,
  Booking,
  BookingStatus,
  CentreQueue,
  Farmer,
  ProcurementCentre,
  Slot,
} from '../data/mockData';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type LoginInput = { mobile: string; password?: string; otp?: string };

export type OfficerLoginInput = { officerId: string; password: string };

export type BookingInput = {
  centreId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  produce: string;
  quantityKg: string;
};

// The prototype intentionally returns placeholder shapes; the store fulfils them.
export const api = {
  farmerLogin: (_input: LoginInput): ApiResult<null> => ({ ok: true, data: null }),
  farmerRegister: (_farmer: Farmer): ApiResult<null> => ({ ok: true, data: null }),
  officerLogin: (_input: OfficerLoginInput): ApiResult<null> => ({ ok: true, data: null }),

  listCentres: (): ApiResult<ProcurementCentre[]> => ({ ok: true, data: [] }),
  listSlots: (_centreId: string, _date: string): ApiResult<Slot[]> => ({ ok: true, data: [] }),

  createBooking: (_input: BookingInput): ApiResult<Booking> => ({
    ok: false,
    error: 'Mock store handles booking creation in the prototype.',
  }),
  cancelBooking: (_bookingId: string): ApiResult<null> => ({ ok: true, data: null }),
  updateBookingStatus: (_bookingId: string, _status: BookingStatus): ApiResult<null> => ({
    ok: true,
    data: null,
  }),

  getQueue: (_centreId: string): ApiResult<CentreQueue> => ({ ok: false, error: 'Use the store.' }),

  listNotifications: (_farmerId: string): ApiResult<AppNotification[]> => ({ ok: true, data: [] }),
} as const;
