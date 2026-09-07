/**
 * API client for the FastAPI + PostgreSQL backend.
 *
 * Every function returns `ApiResult<T>` so callers never see raw exceptions —
 * network failures, 404s, 409 conflicts and 422 validation errors are all
 * normalised into a friendly `error` string.
 *
 * Base URL resolution (configurable, never hardcoded per call-site):
 *   1. `EXPO_PUBLIC_API_URL` env var (see .env.example) — recommended.
 *   2. Otherwise a platform default:
 *        • Android emulator → http://10.0.2.2:8000 (host loopback alias)
 *        • iOS simulator    → http://localhost:8000
 *        • Expo web         → http://localhost:8000
 *      Physical devices must set EXPO_PUBLIC_API_URL to your LAN IP
 *      (e.g. http://192.168.1.20:8000).
 *
 * Set `EXPO_PUBLIC_USE_BACKEND=false` to force the pure mock/demo mode.
 */

import { Platform } from 'react-native';

import type {
  AppNotification,
  Booking,
  CentreQueue,
  Farmer,
  Officer,
  ProcurementCentre,
  QueueEntry,
} from '../data/mockData';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// ------------------------------------------------------------ base URL

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/+$/, '');
  }
  if (Platform.OS === 'android') {
    // Android emulator reaches the host machine via 10.0.2.2.
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiBaseUrl();

export function isBackendEnabled(): boolean {
  return process.env.EXPO_PUBLIC_USE_BACKEND !== 'false';
}

/** Rough reachability classification used by the store's fallback logic. */
export function isNetworkError(error: string): boolean {
  return (
    error === 'NETWORK_ERROR' ||
    error === 'TIMEOUT' ||
    error.toLowerCase().includes('network') ||
    error.toLowerCase().includes('unreachable')
  );
}

const REQUEST_TIMEOUT_MS = 8000;

/** Officer bearer token (set by officerLogin; harmless in demo mode). */
let officerToken: string | null = null;
export function setOfficerToken(token: string | null) {
  officerToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(officerToken ? { Authorization: `Bearer ${officerToken}` } : {}),
        ...init?.headers,
      },
    });
    if (response.status === 204) return { ok: true, data: undefined as T };
    const text = await response.text();
    const body = text.length > 0 ? (JSON.parse(text) as Record<string, unknown>) : {};
    if (!response.ok) {
      const detail = typeof body.detail === 'string' ? body.detail : undefined;
      switch (response.status) {
        case 401:
          return { ok: false, error: detail ?? 'AUTH' };
        case 404:
          return { ok: false, error: detail ?? 'NOT_FOUND' };
        case 409:
          return { ok: false, error: detail ?? 'CONFLICT' };
        case 422:
          return { ok: false, error: detail ?? 'VALIDATION' };
        default:
          return { ok: false, error: detail ?? `HTTP_${response.status}` };
      }
    }
    return { ok: true, data: body as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('abort')) return { ok: false, error: 'TIMEOUT' };
    return { ok: false, error: 'NETWORK_ERROR' };
  } finally {
    clearTimeout(timer);
  }
}

function get<T>(path: string): Promise<ApiResult<T>> {
  return request<T>(path);
}

function post<T>(path: string, payload?: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined });
}

function patch<T>(path: string, payload?: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'PATCH', body: payload ? JSON.stringify(payload) : undefined });
}

function put<T>(path: string, payload?: unknown): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'PUT', body: payload ? JSON.stringify(payload) : undefined });
}

// ------------------------------------------------------------ backend DTOs

export type ApiCentre = {
  id: number;
  centre_code: string;
  name: string;
  state: string;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
  capacity_per_day: number;
  crops: string[];
  status: string; // 'Open' | 'Busy' | 'Full' | 'Closed'
  distance_km: number | null;
  created_at: string;
  updated_at: string;
};

export type ApiFarmer = {
  id: string;
  farmer_code: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  address: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  land_size_acres: string | null;
  crop: string | null;
  quantity_kg: string | null;
  preferred_centre_id: number | null;
  created_at: string;
  updated_at: string;
};

export type ApiSlot = {
  id: string;
  centre_id: number;
  date: string;
  start: string;
  end: string;
  capacity: number;
  booked: number;
  closed: boolean;
  remaining: number;
};

export type ApiQueueEntry = {
  id: string;
  token_number: number;
  token: string;
  status: string; // WAITING | CALLED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW | ON_HOLD
  booking_status: string; // Upcoming | Waiting | Processing | Completed | Cancelled
  position: number | null;
  farmers_ahead: number;
  estimated_wait_minutes: number;
  arrived: boolean;
  produce: string;
  quantity_kg: number;
  joined_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  slot: { id: string; date: string; start_time: string; end_time: string };
  centre: { id: number; centre_code: string; name: string; state: string; district: string; address: string };
  farmer: { id: string; farmer_code: string; name: string; phone: string };
};

export type ApiQueueCentre = {
  centre_id: number;
  centre_code: string;
  date: string;
  entries: ApiQueueEntry[];
  counts: {
    waiting: number;
    called: number;
    in_progress: number;
    on_hold: number;
    completed: number;
    total_active: number;
  };
  last_updated: string;
};

export type ApiNotification = {
  id: string;
  farmer_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  created_at: string;
};

export type ApiOfficer = {
  id: string;
  officer_code: string;
  name: string;
  designation: string;
  centre_id: number | null;
};

export type ApiAuth<T> = { farmer?: T; officer?: T; token: { token: string; expires_at: string } };

// ------------------------------------------------------------------ mappers

export function mapCentre(dto: ApiCentre): ProcurementCentre {
  return {
    id: String(dto.id),
    name: dto.name,
    state: dto.state,
    district: dto.district,
    address: dto.address,
    distanceKm: dto.distance_km ?? 0,
    openingHours: dto.opening_hours ?? '8:00 AM – 5:00 PM',
    capacityPerDay: dto.capacity_per_day,
    crops: dto.crops,
    status: dto.status as ProcurementCentre['status'],
  };
}

export function mapFarmer(dto: ApiFarmer): Farmer {
  return {
    id: dto.farmer_code,
    name: dto.name,
    mobile: dto.phone,
    aadhaar: '', // never sent back by the API (only a hash is stored)
    dateOfBirth: dto.date_of_birth ?? '',
    state: dto.state ?? '',
    district: dto.district ?? '',
    village: dto.village ?? '',
    address: dto.address ?? '',
    landSizeAcres: dto.land_size_acres ?? '',
    crop: dto.crop ?? 'Paddy',
    quantityKg: dto.quantity_kg ?? '',
    preferredCentreId: dto.preferred_centre_id != null ? String(dto.preferred_centre_id) : '',
  };
}

export function mapSlot(dto: ApiSlot) {
  return {
    id: dto.id,
    centreId: String(dto.centre_id),
    date: dto.date,
    start: dto.start,
    end: dto.end,
    capacity: dto.capacity,
    booked: dto.booked,
    closed: dto.closed,
  };
}

export function mapBooking(dto: ApiQueueEntry): Booking {
  return {
    id: dto.id,
    token: dto.token,
    farmerId: dto.farmer.farmer_code,
    farmerName: dto.farmer.name,
    centreId: String(dto.centre.id),
    centreName: dto.centre.name,
    date: dto.slot.date,
    slotStart: dto.slot.start_time,
    slotEnd: dto.slot.end_time,
    produce: dto.produce,
    quantityKg: String(dto.quantity_kg),
    status: dto.booking_status as Booking['status'],
    arrived: dto.arrived,
    createdAt: new Date(dto.joined_at).getTime(),
  };
}

const QUEUE_STATUS_BY_BACKEND: Record<string, QueueEntry['status']> = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  IN_PROGRESS: 'Processing',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};

export function mapQueueEntry(dto: ApiQueueEntry): QueueEntry {
  return {
    id: dto.id,
    token: dto.token,
    farmerName: dto.farmer.name,
    slot: dto.slot.start_time,
    produce: dto.produce,
    status: QUEUE_STATUS_BY_BACKEND[dto.status] ?? 'Waiting',
  };
}

export function mapQueueCentre(dto: ApiQueueCentre): CentreQueue {
  return {
    entries: dto.entries.map(mapQueueEntry),
    lastUpdated: new Date(dto.last_updated).getTime(),
  };
}

const NOTIFICATION_TYPE: Record<string, AppNotification['type']> = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

export function mapNotification(dto: ApiNotification): AppNotification {
  return {
    id: dto.id,
    title: dto.title,
    message: dto.message,
    type: NOTIFICATION_TYPE[dto.type.toUpperCase()] ?? 'info',
    timestamp: dto.timestamp,
    read: dto.read,
  };
}

export function mapOfficer(dto: ApiOfficer): Officer {
  return {
    id: dto.officer_code,
    name: dto.name,
    designation: dto.designation,
    centreId: dto.centre_id != null ? String(dto.centre_id) : '',
  };
}

// -------------------------------------------------------------- api surface

export type LoginInput = { mobile: string; password?: string; otp?: string };
export type OfficerLoginInput = { officerId: string; password: string };

export type BookingInput = {
  centreId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  produce: string;
  quantityKg: string;
  /** Slot id from the backend — preferred over date/start matching. */
  slotId?: string;
  /** Farmer identifier (farmer_code). */
  farmerId?: string;
};

/**
 * 1:1 mapping to the FastAPI endpoints (see backend/app/routers).
 * All functions return ApiResult so the store can fall back to the mock
 * behaviour when the backend is unreachable.
 */
export const api = {
  health: () => get<{ status: string; database: string }>('/health'),

  // auth ---------------------------------------------------------------
  registerFarmer: (farmer: Farmer, aadhaar?: string) =>
    post<ApiAuth<ApiFarmer>>('/api/auth/farmer/register', {
      name: farmer.name,
      phone: farmer.mobile,
      date_of_birth: farmer.dateOfBirth || undefined,
      address: farmer.address || undefined,
      state: farmer.state || undefined,
      district: farmer.district || undefined,
      village: farmer.village || undefined,
      land_size_acres: farmer.landSizeAcres ? Number(farmer.landSizeAcres) : undefined,
      crop: farmer.crop || undefined,
      quantity_kg: farmer.quantityKg ? Number(farmer.quantityKg) : undefined,
      preferred_centre_id: farmer.preferredCentreId || undefined,
      aadhaar: aadhaar || undefined,
    }),

  farmerLogin: (input: LoginInput) =>
    post<ApiAuth<ApiFarmer>>('/api/auth/farmer/login', {
      mobile: input.mobile,
      password: input.password,
      otp: input.otp,
    }),

  officerLogin: (input: OfficerLoginInput) =>
    post<ApiAuth<ApiOfficer>>('/api/auth/officer/login', {
      officer_id: input.officerId,
      password: input.password,
    }),

  // farmers ------------------------------------------------------------
  getFarmer: (farmerId: string) => get<ApiFarmer>(`/api/farmers/${farmerId}`),
  updateFarmer: (farmerId: string, patchBody: Partial<Record<string, unknown>>) =>
    put<ApiFarmer>(`/api/farmers/${farmerId}`, patchBody),
  listFarmerBookings: (farmerId: string) =>
    get<ApiQueueEntry[]>(`/api/farmers/${farmerId}/queue`),
  listFarmerProcurements: (farmerId: string) =>
    get<unknown[]>(`/api/farmers/${farmerId}/procurements`),
  listFarmerPayments: (farmerId: string) =>
    get<unknown[]>(`/api/farmers/${farmerId}/payments`),

  // centres ------------------------------------------------------------
  listCentres: (filters?: { state?: string; district?: string; crop?: string }) => {
    const params = new URLSearchParams();
    if (filters?.state) params.set('state', filters.state);
    if (filters?.district) params.set('district', filters.district);
    if (filters?.crop) params.set('crop', filters.crop);
    const qs = params.toString();
    return get<ApiCentre[]>(`/api/centres${qs ? `?${qs}` : ''}`);
  },
  getCentre: (centreId: string) => get<ApiCentre>(`/api/centres/${centreId}`),

  // slots --------------------------------------------------------------
  listSlotsAll: (range?: { from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    const qs = params.toString();
    return get<ApiSlot[]>(`/api/slots${qs ? `?${qs}` : ''}`);
  },
  listSlots: (centreId: string, date: string) =>
    get<ApiSlot[]>(`/api/centres/${centreId}/slots?date=${date}`),
  createSlot: (centreId: string, input: { date: string; start: string; end: string; capacity: number }) =>
    post<ApiSlot>(`/api/centres/${centreId}/slots`, {
      date: input.date,
      start_time: input.start,
      end_time: input.end,
      capacity: input.capacity,
    }),
  updateSlot: (slotId: string, input: { capacity?: number; closed?: boolean }) =>
    patch<ApiSlot>(`/api/slots/${slotId}`, input),

  // queue --------------------------------------------------------------
  joinQueue: (input: {
    farmerId: string;
    centreId: string;
    slotId?: string;
    date?: string;
    startTime?: string;
    produce: string;
    quantityKg: string;
  }) =>
    post<ApiQueueEntry>('/api/queue/join', {
      farmer_id: input.farmerId,
      centre_id: input.centreId,
      slot_id: input.slotId,
      date: input.date,
      start_time: input.startTime,
      produce: input.produce,
      quantity_kg: Number(input.quantityKg) || 0,
    }),
  getQueueEntry: (entryId: string) => get<ApiQueueEntry>(`/api/queue/${entryId}`),
  getCentreQueue: (centreId: string, date?: string) =>
    get<ApiQueueCentre>(`/api/queue/centre/${centreId}${date ? `?date=${date}` : ''}`),
  advanceQueue: (centreId: string, date?: string) =>
    post<unknown>(`/api/queue/centre/${centreId}/advance${date ? `?date=${date}` : ''}`),
  updateQueueStatus: (entryId: string, status: string) =>
    patch<ApiQueueEntry>(`/api/queue/${entryId}/status`, { status }),
  moveQueueSlot: (entryId: string, slotId: string) =>
    patch<ApiQueueEntry>(`/api/queue/${entryId}/slot`, { slot_id: slotId }),
  markArrived: (entryId: string) => post<ApiQueueEntry>(`/api/queue/${entryId}/arrive`),

  // notifications ------------------------------------------------------
  listNotifications: (farmerId: string) =>
    get<ApiNotification[]>(`/api/notifications?farmer_id=${farmerId}`),
  markAllNotificationsRead: (farmerId: string) =>
    patch<{ updated: number }>('/api/notifications/read-all', { farmer_id: farmerId }),
} as const;

