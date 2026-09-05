/**
 * Demo data model for the Farmer Procurement Portal prototype.
 *
 * All names, centres, numbers and IDs are fictional demo data.
 * In production this module is replaced by the FastAPI backend
 * (see src/services/api.ts for the intended endpoint mapping).
 */
import { INDIAN_LOCATIONS } from './indiaLocations';

// ------------------------------------------------------------------ types

export type CentreStatus = 'Open' | 'Busy' | 'Full' | 'Closed';

export type BookingStatus =
  | 'Upcoming'
  | 'Waiting'
  | 'Your Turn'
  | 'Processing'
  | 'Completed'
  | 'Cancelled';

export type QueueEntryStatus =
  | 'Completed'
  | 'Processing'
  | 'Called'
  | 'Waiting'
  | 'On Hold';

export type SlotAvailability = 'Available' | 'Almost Full' | 'Full' | 'Closed';

export type Farmer = {
  id: string;
  name: string;
  mobile: string;
  aadhaar: string;
  dateOfBirth: string; // DD/MM/YYYY (demo)
  state: string;
  district: string;
  village: string;
  address: string;
  landSizeAcres: string;
  crop: string;
  quantityKg: string;
  preferredCentreId: string;
};

export type ProcurementCentre = {
  id: string;
  name: string;
  state: string;
  district: string;
  address: string;
  distanceKm: number;
  openingHours: string;
  capacityPerDay: number;
  crops: string[];
  status: CentreStatus;
};

export type Slot = {
  id: string;
  centreId: string;
  date: string; // ISO yyyy-mm-dd
  start: string; // HH:mm (24h)
  end: string; // HH:mm (24h)
  capacity: number;
  booked: number;
  closed: boolean;
};

export type Booking = {
  id: string;
  token: string; // FPP-1042
  farmerId: string;
  farmerName: string;
  centreId: string;
  centreName: string;
  date: string; // ISO
  slotStart: string; // HH:mm
  slotEnd: string; // HH:mm
  produce: string;
  quantityKg: string;
  status: BookingStatus;
  arrived: boolean;
  createdAt: number;
};

export type QueueEntry = {
  token: string;
  farmerName: string;
  slot: string; // display e.g. "10:30"
  produce: string;
  status: QueueEntryStatus;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
};

export type Officer = {
  id: string;
  name: string;
  designation: string;
  centreId: string;
};

// ------------------------------------------------------------- date utils

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** "2026-08-29" -> "29 August 2026" */
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-08-29" -> "29 Aug" */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

export function dayName(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return DAY_NAMES[d.getDay()];
}

/** "14:30" -> "2:30 PM" */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function slotRange(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

// ------------------------------------------------------------ mock seeds

export const DEMO_MOBILE = '9876543210';
export const DEMO_FARMER_ID = 'FPP-F-2026-0482';
export const DEMO_TOKEN = 'FPP-1042';
export const DEMO_OTP = '123456';

export const HELPLINE = '1800-180-1551';
export const HELP_EMAIL = 'helpdesk@kisankrayaseva-demo.in';
export const PORTAL_VERSION = '1.0.0';

export const crops = ['Paddy', 'Wheat', 'Maize', 'Coconut', 'Rubber', 'Banana', 'Pepper'];

/** All 28 States and 8 Union Territories (single source of truth). */
export const states = INDIAN_LOCATIONS.map((location) => location.name);

/** Official districts per State/UT, derived from the shared location data. */
export const districtsByState: Record<string, string[]> = Object.fromEntries(
  INDIAN_LOCATIONS.map((location) => [location.name, location.districts])
);

export const demoFarmer: Farmer = {
  id: DEMO_FARMER_ID,
  name: 'Rajan Kumar',
  mobile: DEMO_MOBILE,
  aadhaar: '432143214321',
  dateOfBirth: '12/04/1986',
  state: 'Kerala',
  district: 'Kottayam',
  village: 'Kumarapuram',
  address: 'Kizhakke Veettil, Kumarapuram P.O.',
  landSizeAcres: '2.5',
  crop: 'Paddy',
  quantityKg: '850',
  preferredCentreId: 'c1',
};

export const officer: Officer = {
  id: 'OFF-2201',
  name: 'Suresh Nair',
  designation: 'Procurement Officer',
  centreId: 'c1',
};

export const procurementCentres: ProcurementCentre[] = [
  {
    id: 'c1',
    name: 'Kottayam Procurement Centre',
    state: 'Kerala',
    district: 'Kottayam',
    address: 'Nagampadam, Kottayam',
    distanceKm: 4.2,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 150,
    crops: ['Paddy', 'Coconut', 'Pepper', 'Banana'],
    status: 'Open',
  },
  {
    id: 'c2',
    name: 'Changanassery Procurement Centre',
    state: 'Kerala',
    district: 'Kottayam',
    address: 'Perunna, Changanassery',
    distanceKm: 12.8,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 120,
    crops: ['Paddy', 'Banana', 'Pepper'],
    status: 'Open',
  },
  {
    id: 'c3',
    name: 'Ettumanoor Procurement Centre',
    state: 'Kerala',
    district: 'Kottayam',
    address: 'MC Road, Ettumanoor',
    distanceKm: 16.4,
    openingHours: '8:00 AM – 4:30 PM',
    capacityPerDay: 100,
    crops: ['Paddy', 'Rubber', 'Pepper'],
    status: 'Busy',
  },
  {
    id: 'c4',
    name: 'Alappuzha Procurement Centre',
    state: 'Kerala',
    district: 'Alappuzha',
    address: 'Civil Station Road, Alappuzha',
    distanceKm: 48.0,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 110,
    crops: ['Paddy', 'Coconut'],
    status: 'Open',
  },
  {
    id: 'c5',
    name: 'Ernakulam Procurement Centre',
    state: 'Kerala',
    district: 'Ernakulam',
    address: 'Kaloor, Kochi',
    distanceKm: 65.5,
    openingHours: '8:30 AM – 5:00 PM',
    capacityPerDay: 140,
    crops: ['Paddy', 'Coconut', 'Banana'],
    status: 'Open',
  },
  {
    id: 'c6',
    name: 'Thrissur Procurement Centre',
    state: 'Kerala',
    district: 'Thrissur',
    address: 'Kokkalai, Thrissur',
    distanceKm: 92.0,
    openingHours: '8:00 AM – 4:30 PM',
    capacityPerDay: 90,
    crops: ['Paddy', 'Coconut', 'Pepper'],
    status: 'Full',
  },

  // ---- demo centres across other states (keep the cascade demonstrable) ----
  {
    id: 'c7',
    name: 'Coimbatore Procurement Centre',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    address: 'Gandhipuram, Coimbatore',
    distanceKm: 6.1,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 160,
    crops: ['Paddy', 'Coconut', 'Banana'],
    status: 'Open',
  },
  {
    id: 'c8',
    name: 'Erode Procurement Centre',
    state: 'Tamil Nadu',
    district: 'Erode',
    address: 'Brough Road, Erode',
    distanceKm: 3.8,
    openingHours: '8:00 AM – 4:30 PM',
    capacityPerDay: 110,
    crops: ['Paddy', 'Maize', 'Banana'],
    status: 'Busy',
  },
  {
    id: 'c9',
    name: 'Mysuru Mandi Procurement Centre',
    state: 'Karnataka',
    district: 'Mysuru',
    address: 'APMC Yard, Mysuru',
    distanceKm: 7.4,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 150,
    crops: ['Paddy', 'Wheat', 'Maize'],
    status: 'Open',
  },
  {
    id: 'c10',
    name: 'Mandya Procurement Centre',
    state: 'Karnataka',
    district: 'Mandya',
    address: 'Market Road, Mandya',
    distanceKm: 5.2,
    openingHours: '8:30 AM – 5:00 PM',
    capacityPerDay: 100,
    crops: ['Paddy', 'Coconut', 'Banana'],
    status: 'Closed',
  },
  {
    id: 'c11',
    name: 'Ludhiana Grain Market Centre',
    state: 'Punjab',
    district: 'Ludhiana',
    address: 'Grain Market, Ludhiana',
    distanceKm: 4.6,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 200,
    crops: ['Wheat', 'Maize', 'Paddy'],
    status: 'Open',
  },
  {
    id: 'c12',
    name: 'Patiala Mandi Procurement Centre',
    state: 'Punjab',
    district: 'Patiala',
    address: 'New Grain Market, Patiala',
    distanceKm: 6.9,
    openingHours: '8:00 AM – 4:30 PM',
    capacityPerDay: 140,
    crops: ['Wheat', 'Paddy'],
    status: 'Busy',
  },
  {
    id: 'c13',
    name: 'Nashik APMC Procurement Centre',
    state: 'Maharashtra',
    district: 'Nashik',
    address: 'APMC Market, Nashik',
    distanceKm: 5.5,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 170,
    crops: ['Paddy', 'Wheat', 'Maize'],
    status: 'Open',
  },
  {
    id: 'c14',
    name: 'Nagpur Procurement Centre',
    state: 'Maharashtra',
    district: 'Nagpur',
    address: 'Kalamna Market, Nagpur',
    distanceKm: 8.3,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 130,
    crops: ['Paddy', 'Wheat', 'Coconut'],
    status: 'Full',
  },
  {
    id: 'c15',
    name: 'Lucknow Mandi Samiti Centre',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    address: 'Kisan Mandi, Lucknow',
    distanceKm: 5.0,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 190,
    crops: ['Wheat', 'Paddy', 'Maize'],
    status: 'Open',
  },
  {
    id: 'c16',
    name: 'Kanpur Nagar Procurement Centre',
    state: 'Uttar Pradesh',
    district: 'Kanpur Nagar',
    address: 'Kakadeo Mandi, Kanpur',
    distanceKm: 6.7,
    openingHours: '8:00 AM – 4:30 PM',
    capacityPerDay: 150,
    crops: ['Wheat', 'Paddy'],
    status: 'Busy',
  },
  {
    id: 'c17',
    name: 'Ahmedabad APMC Procurement Centre',
    state: 'Gujarat',
    district: 'Ahmedabad',
    address: 'Vasna APMC, Ahmedabad',
    distanceKm: 9.1,
    openingHours: '8:00 AM – 5:00 PM',
    capacityPerDay: 180,
    crops: ['Wheat', 'Paddy', 'Banana'],
    status: 'Open',
  },
  {
    id: 'c18',
    name: 'Rajkot Procurement Centre',
    state: 'Gujarat',
    district: 'Rajkot',
    address: 'Gondal Road Mandi, Rajkot',
    distanceKm: 4.9,
    openingHours: '8:30 AM – 5:00 PM',
    capacityPerDay: 120,
    crops: ['Wheat', 'Paddy'],
    status: 'Closed',
  },
];

// ------------------------------------------------------------------ slots

export const SLOT_MINUTES = 30;
export const SLOT_CAPACITIES = 12;

function buildTimeRanges(): { start: string; end: string }[] {
  const out: { start: string; end: string }[] = [];
  for (let h = 8; h < 17; h += 1) {
    out.push({
      start: `${String(h).padStart(2, '0')}:00`,
      end: `${String(h).padStart(2, '0')}:30`,
    });
    out.push({
      start: `${String(h).padStart(2, '0')}:30`,
      end: `${String(h + 1).padStart(2, '0')}:00`,
    });
  }
  return out;
}

export const TIME_RANGES = buildTimeRanges();

/** Deterministic pseudo-random so slots look organic but stay stable. */
function seededBooked(centreIndex: number, dayIndex: number, slotIndex: number): number {
  return (centreIndex * 37 + dayIndex * 13 + slotIndex * 7) % 11;
}

export function buildSlotsForCentre(centre: ProcurementCentre, centreIndex: number): Slot[] {
  const slots: Slot[] = [];
  const today = todayISO();
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = addDaysISO(today, dayIndex);
    TIME_RANGES.forEach((range, slotIndex) => {
      const booked = seededBooked(centreIndex, dayIndex, slotIndex);
      const closed = dayIndex >= 5 && slotIndex > 12; // afternoon closed later in week
      slots.push({
        id: `${centre.id}#${date}#${range.start}`,
        centreId: centre.id,
        date,
        start: range.start,
        end: range.end,
        capacity: SLOT_CAPACITIES,
        booked: closed ? SLOT_CAPACITIES : booked,
        closed,
      });
    });
  }
  return slots;
}

export function buildAllSlots(): Slot[] {
  return procurementCentres.flatMap((centre, index) => buildSlotsForCentre(centre, index));
}

// ------------------------------------------------------------------ queue

const QUEUE_NAMES = [
  'Anil Das', 'Priya Devi', 'Jose Mathew', 'Lakshmi Amma', 'Binu Varghese',
  'Shaji P Panicker', 'Mini Thomas', 'Ravi Chandran', 'Beena Mol', 'Arun Prakash',
  'Gopika Menon', 'Manoj Menon', 'Radha Krishnan', 'Sindhu S', 'Vikram Singh',
  'Fatima Beevi', 'Kunjhappu', 'Devika R', 'Mahesh Pillai', 'Anandhu Krishna',
];

export type CentreQueue = {
  entries: QueueEntry[];
  lastUpdated: number;
};

function seedQueueForCentre(centreIndex: number, centreId: string): CentreQueue {
  if (centreId !== 'c1') {
    const base = 2100 + centreIndex * 40;
    const entries: QueueEntry[] = Array.from({ length: 6 }, (_, i) => ({
      token: `FPP-${base + i}`,
      farmerName: QUEUE_NAMES[(centreIndex * 3 + i) % QUEUE_NAMES.length],
      slot: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'][i % 6],
      produce: crops[i % crops.length],
      status:
        i < 2
          ? ('Completed' as const)
          : i === 2
            ? ('Processing' as const)
            : ('Waiting' as const),
    }));
    return { entries, lastUpdated: Date.now() };
  }

  const entries: QueueEntry[] = [];
  let nameIndex = 0;
  // Completed: FPP-1020 .. FPP-1037
  for (let token = 1020; token <= 1037; token += 1) {
    entries.push({
      token: `FPP-${token}`,
      farmerName: QUEUE_NAMES[nameIndex % QUEUE_NAMES.length],
      slot: '08:00',
      produce: crops[nameIndex % crops.length],
      status: 'Completed',
    });
    nameIndex += 1;
  }
  // Currently processing
  entries.push({
    token: 'FPP-1038',
    farmerName: 'Anil Das',
    slot: '10:00',
    produce: 'Paddy',
    status: 'Processing',
  });
  // Waiting ahead of the demo farmer
  entries.push({
    token: 'FPP-1039',
    farmerName: 'Priya Devi',
    slot: '10:30',
    produce: 'Paddy',
    status: 'Waiting',
  });
  entries.push({
    token: 'FPP-1040',
    farmerName: 'Jose Mathew',
    slot: '10:30',
    produce: 'Coconut',
    status: 'Waiting',
  });
  entries.push({
    token: 'FPP-1041',
    farmerName: 'Lakshmi Amma',
    slot: '10:30',
    produce: 'Paddy',
    status: 'Waiting',
  });
  // The demo farmer's own token
  entries.push({
    token: DEMO_TOKEN,
    farmerName: demoFarmer.name,
    slot: '10:30',
    produce: 'Paddy',
    status: 'Waiting',
  });
  // Behind the demo farmer
  entries.push({
    token: 'FPP-1043',
    farmerName: 'Suresh Nair',
    slot: '10:30',
    produce: 'Paddy',
    status: 'Waiting',
  });
  entries.push({
    token: 'FPP-1044',
    farmerName: 'Binu Varghese',
    slot: '11:00',
    produce: 'Banana',
    status: 'Waiting',
  });
  entries.push({
    token: 'FPP-1045',
    farmerName: 'Shaji P Panicker',
    slot: '11:00',
    produce: 'Pepper',
    status: 'Waiting',
  });

  return { entries, lastUpdated: Date.now() };
}

export function buildAllQueues(): Record<string, CentreQueue> {
  const queues: Record<string, CentreQueue> = {};
  procurementCentres.forEach((centre, index) => {
    queues[centre.id] = seedQueueForCentre(index, centre.id);
  });
  return queues;
}

/** Next token number issued at a centre (based on the highest seeded token). */
export function nextTokenForCentre(centreId: string): string {
  if (centreId === 'c1') return 'FPP-1046';
  const centreIndex = procurementCentres.findIndex((c) => c.id === centreId);
  const base = 2100 + centreIndex * 40;
  return `FPP-${base + 6}`;
}

// --------------------------------------------------------------- bookings

function minutesAgo(minutes: number): number {
  return Date.now() - minutes * 60 * 1000;
}

export const demoBooking: Booking = {
  id: 'FPP-BKG-48291',
  token: DEMO_TOKEN,
  farmerId: DEMO_FARMER_ID,
  farmerName: demoFarmer.name,
  centreId: 'c1',
  centreName: 'Kottayam Procurement Centre',
  date: todayISO(),
  slotStart: '10:30',
  slotEnd: '11:00',
  produce: 'Paddy',
  quantityKg: '850',
  status: 'Waiting',
  arrived: true,
  createdAt: minutesAgo(240),
};

export const pastBookings: Booking[] = [
  {
    id: 'FPP-BKG-47110',
    token: 'FPP-0987',
    farmerId: DEMO_FARMER_ID,
    farmerName: demoFarmer.name,
    centreId: 'c1',
    centreName: 'Kottayam Procurement Centre',
    date: addDaysISO(todayISO(), -8),
    slotStart: '09:00',
    slotEnd: '09:30',
    produce: 'Paddy',
    quantityKg: '760',
    status: 'Completed',
    arrived: true,
    createdAt: minutesAgo(60 * 24 * 9),
  },
  {
    id: 'FPP-BKG-46204',
    token: 'FPP-0812',
    farmerId: DEMO_FARMER_ID,
    farmerName: demoFarmer.name,
    centreId: 'c2',
    centreName: 'Changanassery Procurement Centre',
    date: addDaysISO(todayISO(), -15),
    slotStart: '11:00',
    slotEnd: '11:30',
    produce: 'Banana',
    quantityKg: '420',
    status: 'Completed',
    arrived: true,
    createdAt: minutesAgo(60 * 24 * 16),
  },
  {
    id: 'FPP-BKG-45980',
    token: 'FPP-0633',
    farmerId: DEMO_FARMER_ID,
    farmerName: demoFarmer.name,
    centreId: 'c1',
    centreName: 'Kottayam Procurement Centre',
    date: addDaysISO(todayISO(), -22),
    slotStart: '13:30',
    slotEnd: '14:00',
    produce: 'Coconut',
    quantityKg: '300',
    status: 'Cancelled',
    arrived: false,
    createdAt: minutesAgo(60 * 24 * 23),
  },
];

export const initialBookings: Booking[] = [demoBooking, ...pastBookings];

// ---------------------------------------------------------- notifications

export const initialNotifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Booking confirmed',
    message: 'Your procurement slot has been confirmed for Kottayam Procurement Centre.',
    type: 'success',
    timestamp: minutesAgo(12),
    read: false,
  },
  {
    id: 'n2',
    title: 'Token FPP-1042 is approaching',
    message: 'There are 4 farmers ahead of you. Please stay near the procurement counter.',
    type: 'info',
    timestamp: minutesAgo(35),
    read: false,
  },
  {
    id: 'n3',
    title: 'Centre delay notice',
    message:
      'Procurement at Kottayam Centre is currently delayed by approximately 20 minutes.',
    type: 'warning',
    timestamp: minutesAgo(90),
    read: false,
  },
  {
    id: 'n4',
    title: 'Documents reminder',
    message: 'Please carry your Aadhaar or valid ID and keep your registered mobile active.',
    type: 'info',
    timestamp: minutesAgo(60 * 26),
    read: true,
  },
  {
    id: 'n5',
    title: 'Previous procurement completed',
    message: 'Your procurement on 21 August 2026 (FPP-0987) has been completed.',
    type: 'success',
    timestamp: minutesAgo(60 * 24 * 8),
    read: true,
  },
];

// -------------------------------------------------------------- analytics

export type HourlyStat = { label: string; value: number };

export const hourlyProcessed: HourlyStat[] = [
  { label: '8–9', value: 14 },
  { label: '9–10', value: 19 },
  { label: '10–11', value: 26 },
  { label: '11–12', value: 22 },
  { label: '12–13', value: 11 },
  { label: '13–14', value: 9 },
  { label: '14–15', value: 16 },
  { label: '15–16', value: 12 },
];

export const hourlyAvgWait: HourlyStat[] = [
  { label: '8–9', value: 12 },
  { label: '9–10', value: 18 },
  { label: '10–11', value: 34 },
  { label: '11–12', value: 29 },
  { label: '12–13', value: 15 },
  { label: '13–14', value: 9 },
  { label: '14–15', value: 21 },
  { label: '15–16', value: 14 },
];

export const volumeByCrop: HourlyStat[] = [
  { label: 'Paddy', value: 146 },
  { label: 'Coconut', value: 58 },
  { label: 'Banana', value: 37 },
  { label: 'Pepper', value: 24 },
  { label: 'Rubber', value: 12 },
];

export const analyticsSummary = {
  farmersProcessed: 129,
  avgWaitMinutes: 24,
  volumeQuintals: 277,
  capacityUsedPercent: 86,
  peakHour: '10:00 – 11:00 AM',
};

// ------------------------------------------------------------- estimation

/** Rough per-farmer processing time used to estimate waits (minutes). */
export const MINUTES_PER_FARMER = 7;

// ---------------------------------------------------------------- helpers

export function slotAvailability(slot: Slot): SlotAvailability {
  if (slot.closed) return 'Closed';
  if (slot.booked >= slot.capacity) return 'Full';
  if (slot.capacity - slot.booked <= 3) return 'Almost Full';
  return 'Available';
}

export function findSlot(slots: Slot[], id: string): Slot | undefined {
  return slots.find((s) => s.id === id);
}





