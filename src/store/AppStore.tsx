import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  buildAllQueues,
  buildAllSlots,
  demoBooking,
  demoFarmer,
  DEMO_MOBILE,
  DEMO_OTP,
  initialBookings,
  initialNotifications,
  MINUTES_PER_FARMER,
  nextTokenForCentre,
  officer as demoOfficer,
  procurementCentres,
  type AppNotification,
  type Booking,
  type BookingStatus,
  type CentreQueue,
  type Farmer,
  type Officer,
  type ProcurementCentre,
  type QueueEntry,
  type QueueEntryStatus,
  type Slot,
} from '../data/mockData';
import { publishQueueUpdate } from '../services/queueService';
import {
  api,
  isBackendEnabled,
  isNetworkError,
  mapBooking,
  mapCentre,
  mapFarmer,
  mapNotification,
  mapOfficer,
  mapQueueCentre,
  mapSlot,
  setOfficerToken,
} from '../services/api';
import { todayISO, addDaysISO } from '../data/mockData';

/** Backend integration switch (env `EXPO_PUBLIC_USE_BACKEND`). */
const BACKEND_ENABLED = isBackendEnabled();
const POLL_INTERVAL_MS = 8000;

const BACKEND_QUEUE_STATUS: Record<QueueEntryStatus, string> = {
  Waiting: 'WAITING',
  Called: 'CALLED',
  Processing: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  'On Hold': 'ON_HOLD',
};


// ---------------------------------------------------------------- auth

export type AuthState =
  | { role: 'guest' }
  | { role: 'farmer'; farmer: Farmer }
  | { role: 'officer'; officer: Officer };

export type BookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string };

type StoreValue = {
  auth: AuthState;
  farmer: Farmer | null;
  officer: Officer | null;
  centres: ProcurementCentre[];
  slots: Slot[];
  bookings: Booking[];
  notifications: AppNotification[];
  queues: Record<string, CentreQueue>;

  // auth actions
  registerFarmer: (farmer: Farmer) => void;
  loginFarmer: (
    mobile: string,
    password?: string,
    otp?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  loginDemoFarmer: () => void;
  loginOfficer: (officerId: string, password: string) => { ok: boolean; error?: string };
  loginDemoOfficer: () => void;
  logout: () => void;

  // farmer actions
  createBooking: (input: {
    centreId: string;
    date: string;
    slotStart: string;
    slotEnd: string;
    produce: string;
    quantityKg: string;
    /** Slot id (required when the backend is connected). */
    slotId?: string;
  }) => Promise<BookingResult>;
  cancelBooking: (bookingId: string) => void;
  markArrived: (bookingId: string) => void;
  markAllNotificationsRead: () => void;

  // officer actions
  officerCentreId: string;
  setOfficerCentreId: (centreId: string) => void;
  setQueueEntryStatus: (centreId: string, token: string, status: QueueEntryStatus) => void;
  callFarmer: (centreId: string, token: string) => void;
  startProcurement: (centreId: string, token: string) => void;
  completeProcurement: (centreId: string, token: string) => void;
  toggleHold: (centreId: string, token: string) => void;
  advanceQueue: (centreId: string) => void;

  // slot management
  updateSlotCapacity: (slotId: string, delta: number) => { ok: boolean; error?: string };
  toggleSlotClosed: (slotId: string) => void;
  createSlot: (input: { centreId: string; date: string; start: string; end: string; capacity: number }) => void;
  rescheduleBooking: (bookingId: string, targetSlot: Slot) => void;

  // derived helpers
  activeBookingFor: (farmerId: string) => Booking | undefined;
  queueSnapshot: (centreId: string, token?: string) => {
    currentlyServing: string | null;
    processing: QueueEntry | null;
    farmersAhead: number;
    estimatedWaitMinutes: number;
    waitingCount: number;
    completedCount: number;
    processingCount: number;
    calledCount: number;
    myEntry: QueueEntry | undefined;
  };
};

const StoreContext = createContext<StoreValue | null>(null);

let notificationSeq = 100;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ role: 'guest' });
  const [farmer, setFarmer] = useState<Farmer | null>(demoFarmer);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [officerCentreId, setOfficerCentreId] = useState<string>('c1');
  const [centres, setCentres] = useState<ProcurementCentre[]>(procurementCentres);
  const [slots, setSlots] = useState<Slot[]>(() => buildAllSlots());
  const [bookings, setBookings] = useState<Booking[]>(() => initialBookings);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => initialNotifications);
  const [queues, setQueues] = useState<Record<string, CentreQueue>>(() => buildAllQueues());

  // ---------------------------------------------------------- backend sync
  // The store talks to FastAPI first and falls back to the bundled mock data
  // whenever the backend is unreachable, so the UI always keeps working.

  const backendOnlineRef = useRef(false);
  const farmerRef = useRef<Farmer | null>(farmer);
  farmerRef.current = farmer;
  const officerCentreRef = useRef<string>(officerCentreId);
  officerCentreRef.current = officerCentreId;
  const officerRef = useRef<Officer | null>(officer);
  officerRef.current = officer;
  const bookingsRef = useRef<Booking[]>(bookings);
  bookingsRef.current = bookings;

  /** Fetch the live queue for a centre and swap it into local state. */
  const syncQueueForCentre = useCallback(async (centreId: string) => {
    const result = await api.getCentreQueue(centreId);
    if (!result.ok) {
      if (isNetworkError(result.error)) backendOnlineRef.current = false;
      return;
    }
    backendOnlineRef.current = true;
    const centreKey = String(result.data.centre_id);
    const queue = mapQueueCentre(result.data);
    setQueues((current) => ({ ...current, [centreKey]: queue }));
    publishQueueUpdate({ centreId: centreKey, queue, at: Date.now() });
  }, []);

  /** Refresh the signed-in farmer's bookings + notifications from the DB. */
  const syncFarmerData = useCallback(async (farmerCode: string) => {
    const [bookingsResult, notificationsResult] = await Promise.all([
      api.listFarmerBookings(farmerCode),
      api.listNotifications(farmerCode),
    ]);
    if (!bookingsResult.ok) {
      if (isNetworkError(bookingsResult.error)) backendOnlineRef.current = false;
      return;
    }
    backendOnlineRef.current = true;
    const fetched = bookingsResult.data.map(mapBooking);
    setBookings((current) => {
      const others = current.filter((b) => b.farmerId !== farmerCode);
      return [...fetched, ...others];
    });
    if (notificationsResult.ok) {
      setNotifications(notificationsResult.data.map(mapNotification));
    }
  }, []);

  /** One-time baseline: centres + the week of slots. */
  const syncBaseline = useCallback(async () => {
    const centresResult = await api.listCentres();
    if (!centresResult.ok) {
      if (isNetworkError(centresResult.error)) backendOnlineRef.current = false;
      return false;
    }
    backendOnlineRef.current = true;
    setCentres(centresResult.data.map(mapCentre));
    const slotsResult = await api.listSlotsAll({ from: todayISO(), to: addDaysISO(todayISO(), 7) });
    if (slotsResult.ok) {
      setSlots(slotsResult.data.map(mapSlot));
    }
    return true;
  }, []);


  const addNotification = useCallback(
    (note: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      notificationSeq += 1;
      setNotifications((current) => [
        {
          ...note,
          id: `n${notificationSeq}`,
          timestamp: Date.now(),
          read: false,
        },
        ...current,
      ]);
    },
    []
  );

  const publish = useCallback((centreId: string, queue: CentreQueue) => {
    publishQueueUpdate({ centreId, queue, at: Date.now() });
  }, []);

  const syncBookingForToken = useCallback(
    (token: string, entry: QueueEntry, centreId: string) => {
      setBookings((current) =>
        current.map((booking) => {
          if (booking.token !== token || booking.date !== demoBooking.date) return booking;
          if (booking.status === 'Completed' || booking.status === 'Cancelled') return booking;

          let status: BookingStatus = booking.status;
          if (entry.status === 'Completed') status = 'Completed';
          else if (entry.status === 'Processing') status = 'Processing';
          else if (entry.status === 'Called' || entry.status === 'Waiting') status = 'Waiting';

          if (status !== booking.status) {
            if (status === 'Completed') {
              addNotification({
                title: 'Procurement completed',
                message: `Your procurement (${token}) has been completed. Payment is being processed.`,
                type: 'success',
              });
            } else if (status === 'Processing') {
              addNotification({
                title: 'Your procurement has started',
                message: `Token ${token} is now being processed at the centre.`,
                type: 'info',
              });
            } else if (status === 'Waiting') {
              addNotification({
                title: `Token ${token} is approaching`,
                message: 'Please stay near the procurement counter.',
                type: 'info',
              });
            }
          }
          void centreId;
          return { ...booking, status };
        })
      );
    },
    [addNotification]
  );

  /** Move the head of the queue forward by one farmer. */
  const advanceQueue = useCallback(
    (centreId: string) => {
      const localAdvance = () => {
        setQueues((current) => {
          const queue = current[centreId];
          if (!queue) return current;

          const entries = queue.entries.map((entry) => ({ ...entry }));
          const processingIndex = entries.findIndex((e) => e.status === 'Processing');
          const nextIndex = entries.findIndex(
            (e) => e.status === 'Waiting' || e.status === 'Called'
          );

          if (processingIndex >= 0) {
            entries[processingIndex].status = 'Completed';
            syncBookingForToken(entries[processingIndex].token, entries[processingIndex], centreId);
          }
          if (nextIndex >= 0 && nextIndex !== processingIndex) {
            entries[nextIndex].status = 'Processing';
            syncBookingForToken(entries[nextIndex].token, entries[nextIndex], centreId);
          }

          const updated: CentreQueue = { entries, lastUpdated: Date.now() };
          publish(centreId, updated);
          const next = { ...current, [centreId]: updated };
          return next;
        });
      };

      // Backend-first: the API advances atomically (complete + serve next).
      if (BACKEND_ENABLED && backendOnlineRef.current) {
        void (async () => {
          const result = await api.advanceQueue(centreId);
          if (result.ok) {
            await syncQueueForCentre(centreId);
          } else {
            localAdvance();
          }
        })();
        return;
      }
      localAdvance();
    },
    [publish, syncBookingForToken, syncQueueForCentre]
  );

  // ------------------------------------------------------- simulation loop
  // Stands in for the future WebSocket stream: publishes queue updates on a
  // fixed cadence so the UI can be wired to real events without changes.
  // Disabled while the backend is online — PostgreSQL is the source of truth
  // and a polling/WebSocket stream keeps the UI fresh instead.
  const tickCountRef = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => {
      if (backendOnlineRef.current) return;
      advanceQueue('c1');
      tickCountRef.current += 1;
      if (tickCountRef.current % 3 === 0) {
        advanceQueue('c2');
      }
    }, 9000);
    return () => clearInterval(timer);
  }, [advanceQueue]);

  // ----------------------------------------------------- backend lifecycle
  // 1) Baseline fetch on mount. 2) Re-sync farmer data on auth changes.
  // 3) Lightweight polling while connected (WebSocket replaces this later).
  useEffect(() => {
    if (!BACKEND_ENABLED) return;
    void syncBaseline();
  }, [syncBaseline]);

  useEffect(() => {
    if (!BACKEND_ENABLED) return;
    const current = farmerRef.current;
    if (current) void syncFarmerData(current.id);
  }, [auth, syncFarmerData]);

  useEffect(() => {
    if (!BACKEND_ENABLED) return;
    const timer = setInterval(() => {
      if (!backendOnlineRef.current) {
        // retry reconnect with a cheap baseline fetch
        void syncBaseline();
        return;
      }
      const current = farmerRef.current;
      if (current) void syncFarmerData(current.id);
      if (officerRef.current) {
        void syncQueueForCentre(officerCentreRef.current);
      } else {
        const active = bookingsRef.current.find(
          (b) =>
            b.farmerId === farmerRef.current?.id &&
            b.status !== 'Completed' &&
            b.status !== 'Cancelled'
        );
        if (active) void syncQueueForCentre(active.centreId);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [syncBaseline, syncFarmerData, syncQueueForCentre]);

  // ------------------------------------------------------------- auth

  const registerFarmer = useCallback(
    (input: Farmer) => {
      const localRegister = () => {
        const registered: Farmer = {
          ...input,
          id: `FPP-F-2026-${input.mobile.slice(-4)}`,
        };
        setFarmer(registered);
        setAuth({ role: 'farmer', farmer: registered });
        addNotification({
          title: 'Welcome to Farmer Procurement Portal',
          message: 'Your farmer profile has been created. You can now book a procurement slot.',
          type: 'success',
        });
      };

      if (!BACKEND_ENABLED) {
        localRegister();
        return;
      }
      // Backend-first: persist to PostgreSQL; the welcome notification comes
      // back from the database. Offline → unchanged mock behaviour.
      void (async () => {
        const result = await api.registerFarmer(input, input.aadhaar || undefined);
        if (result.ok && result.data.farmer) {
          backendOnlineRef.current = true;
          const registered = mapFarmer(result.data.farmer);
          setFarmer(registered);
          setAuth({ role: 'farmer', farmer: registered });
          await syncFarmerData(registered.id);
        } else {
          localRegister();
        }
      })();
    },
    [addNotification, syncFarmerData]
  );

  const loginFarmer = useCallback(
    async (mobile: string, password?: string, otp?: string) => {
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        return { ok: false, error: 'login.errMobile' as const };
      }

      const localLogin = () => {
        if (otp !== undefined) {
          if (otp !== DEMO_OTP) return { ok: false, error: 'login.errOtp' as const };
        } else if (!password || password.length < 4) {
          return { ok: false, error: 'login.errPassword' as const };
        }

        // Demo auth: the seeded farmer logs in with its own number; any other
        // valid-format number also works (prototype behaviour).
        const profile: Farmer =
          mobile === DEMO_MOBILE
            ? demoFarmer
            : {
                ...demoFarmer,
                mobile,
                id: `FPP-F-2026-${mobile.slice(-4)}`,
              };
        setFarmer(profile);
        setAuth({ role: 'farmer', farmer: profile });
        return { ok: true as const };
      };

      if (!BACKEND_ENABLED) return localLogin();

      const result = await api.farmerLogin({ mobile, password, otp });
      if (result.ok && result.data.farmer) {
        backendOnlineRef.current = true;
        const profile = mapFarmer(result.data.farmer);
        setFarmer(profile);
        setAuth({ role: 'farmer', farmer: profile });
        await syncFarmerData(profile.id);
        return { ok: true as const };
      }
      if (!result.ok && isNetworkError(result.error)) {
        return localLogin(); // backend down → prototype behaviour
      }
      // Real auth error from the API — map to the existing translation keys.
      if (!result.ok && (result.error === 'farmer_not_found' || result.error === 'NOT_FOUND')) {
        return { ok: false, error: 'login.errMobile' as const };
      }
      if (otp !== undefined) return { ok: false, error: 'login.errOtp' as const };
      return { ok: false, error: 'login.errPassword' as const };
    },
    [syncFarmerData]
  );

  const loginDemoFarmer = useCallback(() => {
    setFarmer(demoFarmer);
    setAuth({ role: 'farmer', farmer: demoFarmer });
    // When the backend is reachable, log the demo farmer in there too so the
    // dashboard shows the real (seeded) bookings/notifications.
    if (BACKEND_ENABLED) {
      void (async () => {
        const result = await api.farmerLogin({ mobile: DEMO_MOBILE, otp: DEMO_OTP });
        if (result.ok && result.data.farmer) {
          backendOnlineRef.current = true;
          const profile = mapFarmer(result.data.farmer);
          setFarmer(profile);
          setAuth({ role: 'farmer', farmer: profile });
          await syncFarmerData(profile.id);
        }
      })();
    }
  }, [syncFarmerData]);

  const loginOfficer = useCallback(
    (id: string, password: string) => {
      if (!id || id.trim().length < 4) return { ok: false, error: 'off.login.errId' as const };
      if (!password || password.length < 4) {
        return { ok: false, error: 'off.login.errPassword' as const };
      }
      const localLogin = () => {
        const profile: Officer = { ...demoOfficer, id: id.trim().toUpperCase() };
        setOfficer(profile);
        setOfficerCentreId(profile.centreId);
        setAuth({ role: 'officer', officer: profile });
      };

      if (!BACKEND_ENABLED) {
        localLogin();
        return { ok: true as const };
      }
      void (async () => {
        const result = await api.officerLogin({ officerId: id.trim(), password });
        if (result.ok && result.data.officer) {
          backendOnlineRef.current = true;
          const profile = mapOfficer(result.data.officer);
          setOfficerToken(result.data.token.token);
          setOfficer(profile);
          setOfficerCentreId(profile.centreId);
          setAuth({ role: 'officer', officer: profile });
          await syncQueueForCentre(profile.centreId);
        } else {
          setOfficerToken(null);
          localLogin();
        }
      })();
      return { ok: true as const };
    },
    [syncQueueForCentre]
  );

  const loginDemoOfficer = useCallback(() => {
    setOfficer(demoOfficer);
    setOfficerCentreId(demoOfficer.centreId);
    setAuth({ role: 'officer', officer: demoOfficer });
  }, []);

  const logout = useCallback(() => {
    setAuth({ role: 'guest' });
    setOfficer(null);
  }, []);

  // --------------------------------------------------------- farmer actions

  const createBooking = useCallback<StoreValue['createBooking']>(
    async (input) => {
      const centre = procurementCentres.find((c) => c.id === input.centreId);
      const activeFarmer = farmer ?? demoFarmer;

      const localCreate = (): BookingResult => {
        if (!centre) return { ok: false, error: 'book.noSlots' };

        const slot = slots.find(
          (s) =>
            s.centreId === input.centreId &&
            s.date === input.date &&
            s.start === input.slotStart
        );
        if (!slot || slot.closed || slot.booked >= slot.capacity) {
          return { ok: false, error: 'book.slotTaken' };
        }

        const token = nextTokenForCentre(input.centreId);
        const isToday = input.date === demoBooking.date;
        const booking: Booking = {
          id: `FPP-BKG-${Math.floor(100000 + Math.random() * 899999)}`,
          token,
          farmerId: activeFarmer.id,
          farmerName: activeFarmer.name,
          centreId: centre.id,
          centreName: centre.name,
          date: input.date,
          slotStart: input.slotStart,
          slotEnd: input.slotEnd,
          produce: input.produce,
          quantityKg: input.quantityKg,
          status: isToday ? 'Waiting' : 'Upcoming',
          arrived: false,
          createdAt: Date.now(),
        };

        setBookings((current) => [booking, ...current]);
        setSlots((current) =>
          current.map((s) => (s.id === slot.id ? { ...s, booked: s.booked + 1 } : s))
        );
        setQueues((current) => {
          const queue = current[input.centreId];
          if (!queue || !isToday) return current;
          const entries: QueueEntry[] = [
            ...queue.entries,
            {
              token,
              farmerName: activeFarmer.name,
              slot: input.slotStart,
              produce: input.produce,
              status: 'Waiting',
            },
          ];
          const updated: CentreQueue = { entries, lastUpdated: Date.now() };
          publish(input.centreId, updated);
          return { ...current, [input.centreId]: updated };
        });

        addNotification({
          title: 'Booking confirmed',
          message: `Your procurement slot has been confirmed at ${centre.name}. Token: ${token}.`,
          type: 'success',
        });

        return { ok: true, booking };
      };

      // Backend-first: the API issues the concurrency-safe token.
      if (BACKEND_ENABLED) {
        const result = await api.joinQueue({
          farmerId: activeFarmer.id,
          centreId: input.centreId,
          slotId: input.slotId,
          date: input.date,
          startTime: input.slotStart,
          produce: input.produce,
          quantityKg: input.quantityKg,
        });
        if (result.ok) {
          backendOnlineRef.current = true;
          const booking = mapBooking(result.data);
          setBookings((current) => [booking, ...current]);
          setSlots((current) =>
            current.map((s) => (s.id === input.slotId ? { ...s, booked: s.booked + 1 } : s))
          );
          addNotification({
            title: 'Booking confirmed',
            message: `Your procurement slot has been confirmed at ${booking.centreName}. Token: ${booking.token}.`,
            type: 'success',
          });
          await syncQueueForCentre(booking.centreId);
          return { ok: true, booking };
        }
        if (!isNetworkError(result.error)) {
          // Definitive answer from the API (full slot / duplicate / invalid).
          return { ok: false, error: 'book.slotTaken' };
        }
        // Network failure → fall through to the mock flow so the demo works.
      }

      return localCreate();
    },
    [farmer, slots, publish, addNotification, syncQueueForCentre]
  );

  const cancelBooking = useCallback(
    (bookingId: string) => {
      // Local optimistic update (identical in mock + backend modes).
      setBookings((current) =>
        current.map((booking) => {
          if (booking.id !== bookingId) return booking;
          if (booking.status === 'Completed' || booking.status === 'Cancelled') return booking;
          return { ...booking, status: 'Cancelled' as BookingStatus };
        })
      );
      setQueues((current) => {
        const targetToken =
          bookings.find((booking) => booking.id === bookingId)?.token ?? bookingId;
        const next: Record<string, CentreQueue> = {};
        Object.entries(current).forEach(([centreId, queue]) => {
          if (!queue.entries.some((entry) => entry.token === targetToken)) {
            next[centreId] = queue;
            return;
          }
          const updated: CentreQueue = {
            entries: queue.entries.filter((entry) => entry.token !== targetToken),
            lastUpdated: Date.now(),
          };
          publish(centreId, updated);
          next[centreId] = updated;
        });
        return next;
      });
      addNotification({
        title: 'Booking cancelled',
        message: 'Your booking has been cancelled and the slot released.',
        type: 'warning',
      });

      // Persist the CANCELLED transition to PostgreSQL when connected.
      if (BACKEND_ENABLED && backendOnlineRef.current) {
        void (async () => {
          const result = await api.updateQueueStatus(bookingId, 'CANCELLED');
          if (result.ok) {
            await syncQueueForCentre(String(result.data.centre.id));
          }
        })();
      }
    },
    [bookings, publish, addNotification, syncQueueForCentre]
  );

  const markArrived = useCallback((bookingId: string) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, arrived: true } : booking
      )
    );
    if (BACKEND_ENABLED && backendOnlineRef.current) {
      void api.markArrived(bookingId);
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((note) => ({ ...note, read: true })));
    const current = farmerRef.current;
    if (BACKEND_ENABLED && backendOnlineRef.current && current) {
      void api.markAllNotificationsRead(current.id);
    }
  }, []);

  // ------------------------------------------------------- officer actions

  const setQueueEntryStatusImpl = useCallback(
    (centreId: string, token: string, status: QueueEntryStatus) => {
      let entryId: string | undefined;
      setQueues((current) => {
        const queue = current[centreId];
        if (!queue) return current;
        const entries = queue.entries.map((entry) => {
          if (entry.token !== token) return entry;
          entryId = entry.id;
          return { ...entry, status };
        });
        const updated: CentreQueue = { entries, lastUpdated: Date.now() };
        publish(centreId, updated);
        const changed = entries.find((entry) => entry.token === token);
        if (changed) syncBookingForToken(token, changed, centreId);
        return { ...current, [centreId]: updated };
      });

      // Persist the transition when the entry came from the backend.
      if (BACKEND_ENABLED && backendOnlineRef.current && entryId) {
        void (async () => {
          const result = await api.updateQueueStatus(entryId!, BACKEND_QUEUE_STATUS[status]);
          if (result.ok) {
            await syncQueueForCentre(String(result.data.centre.id));
          }
        })();
      }
    },
    [publish, syncBookingForToken, syncQueueForCentre]
  );

  const callFarmer = useCallback(
    (centreId: string, token: string) => {
      setQueueEntryStatusImpl(centreId, token, 'Called');
      addNotification({
        title: 'Farmer called',
        message: `Token ${token} has been called to the procurement counter.`,
        type: 'info',
      });
    },
    [setQueueEntryStatusImpl, addNotification]
  );

  const startProcurement = useCallback(
    (centreId: string, token: string) => {
      setQueueEntryStatusImpl(centreId, token, 'Processing');
    },
    [setQueueEntryStatusImpl]
  );

  const completeProcurement = useCallback(
    (centreId: string, token: string) => {
      setQueueEntryStatusImpl(centreId, token, 'Completed');
    },
    [setQueueEntryStatusImpl]
  );

  const toggleHold = useCallback(
    (centreId: string, token: string) => {
      setQueues((current) => {
        const queue = current[centreId];
        if (!queue) return current;
        const target = queue.entries.find((entry) => entry.token === token);
        const nextStatus: QueueEntryStatus =
          target?.status === 'On Hold' ? 'Waiting' : 'On Hold';
        const entries = queue.entries.map((entry) =>
          entry.token === token ? { ...entry, status: nextStatus } : entry
        );
        const updated: CentreQueue = { entries, lastUpdated: Date.now() };
        publish(centreId, updated);
        return { ...current, [centreId]: updated };
      });
    },
    [publish]
  );

  // ------------------------------------------------------ slot management

  const updateSlotCapacity = useCallback((slotId: string, delta: number) => {
    let result: { ok: boolean; error?: string } = { ok: true };
    let nextCapacityValue: number | null = null;
    setSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        const nextCapacity = Math.max(slot.booked, Math.min(60, slot.capacity + delta));
        if (nextCapacity === slot.capacity) {
          result = { ok: false, error: 'off.slots.capacityMax' };
          return slot;
        }
        nextCapacityValue = nextCapacity;
        return { ...slot, capacity: nextCapacity };
      })
    );
    if (BACKEND_ENABLED && backendOnlineRef.current && nextCapacityValue !== null) {
      void api.updateSlot(slotId, { capacity: nextCapacityValue });
    }
    return result;
  }, []);

  const toggleSlotClosed = useCallback((slotId: string) => {
    let nextClosed: boolean | null = null;
    setSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        nextClosed = !slot.closed;
        return { ...slot, closed: nextClosed };
      })
    );
    if (BACKEND_ENABLED && backendOnlineRef.current && nextClosed !== null) {
      void api.updateSlot(slotId, { closed: nextClosed });
    }
  }, []);

  const createSlot = useCallback<StoreValue['createSlot']>(
    (input) => {
      const newSlot: Slot = {
        id: `${input.centreId}#${input.date}#${input.start}`,
        centreId: input.centreId,
        date: input.date,
        start: input.start,
        end: input.end,
        capacity: input.capacity,
        booked: 0,
        closed: false,
      };
      setSlots((current) => [...current.filter((s) => s.id !== newSlot.id), newSlot]);
      addNotification({
        title: 'Slot created',
        message: `New slot ${input.start}–${input.end} created with capacity ${input.capacity}.`,
        type: 'success',
      });

      // Persist to PostgreSQL when connected (upsert semantics server-side).
      if (BACKEND_ENABLED && backendOnlineRef.current) {
        void (async () => {
          const result = await api.createSlot(input.centreId, {
            date: input.date,
            start: input.start,
            end: input.end,
            capacity: input.capacity,
          });
          if (result.ok) {
            const persisted = mapSlot(result.data);
            setSlots((current) => [
              ...current.filter((s) => s.id !== newSlot.id && s.id !== persisted.id),
              persisted,
            ]);
          }
        })();
      }
    },
    [addNotification]
  );

  const rescheduleBooking = useCallback(
    (bookingId: string, targetSlot: Slot) => {
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                date: targetSlot.date,
                slotStart: targetSlot.start,
                slotEnd: targetSlot.end,
                centreId: targetSlot.centreId,
                centreName:
                  procurementCentres.find((c) => c.id === targetSlot.centreId)?.name ??
                  booking.centreName,
              }
            : booking
        )
      );
      setSlots((current) =>
        current.map((slot) =>
          slot.id === targetSlot.id ? { ...slot, booked: slot.booked + 1 } : slot
        )
      );
      addNotification({
        title: 'Booking rescheduled',
        message: `Booking moved to ${targetSlot.date} ${targetSlot.start}.`,
        type: 'info',
      });

      if (BACKEND_ENABLED && backendOnlineRef.current) {
        void (async () => {
          const result = await api.moveQueueSlot(bookingId, targetSlot.id);
          if (result.ok) {
            await syncQueueForCentre(String(result.data.centre.id));
          }
        })();
      }
    },
    [addNotification, syncQueueForCentre]
  );

  // -------------------------------------------------------------- derived

  const activeBookingFor = useCallback(
    (farmerId: string) =>
      bookings.find(
        (booking) =>
          booking.farmerId === farmerId &&
          booking.status !== 'Completed' &&
          booking.status !== 'Cancelled'
      ),
    [bookings]
  );

  const queueSnapshot = useCallback<StoreValue['queueSnapshot']>(
    (centreId, token) => {
      const queue = queues[centreId];
      const entries = queue?.entries ?? [];
      const processing = entries.find((entry) => entry.status === 'Processing') ?? null;
      const processingIndex = processing ? entries.indexOf(processing) : -1;
      const myEntry = token ? entries.find((entry) => entry.token === token) : undefined;
      const myIndex = myEntry ? entries.indexOf(myEntry) : -1;
      const farmersAhead =
        myEntry && myIndex >= 0 && myEntry.status !== 'Completed'
          ? Math.max(0, myIndex - processingIndex - (processingIndex >= 0 ? 1 : 0))
          : 0;

      return {
        currentlyServing: processing?.token ?? null,
        processing,
        farmersAhead,
        estimatedWaitMinutes: farmersAhead * MINUTES_PER_FARMER,
        waitingCount: entries.filter(
          (e) => e.status === 'Waiting' || e.status === 'On Hold' || e.status === 'Called'
        ).length,
        completedCount: entries.filter((e) => e.status === 'Completed').length,
        processingCount: entries.filter((e) => e.status === 'Processing').length,
        calledCount: entries.filter((e) => e.status === 'Called').length,
        myEntry,
      };
    },
    [queues]
  );

  const value = useMemo<StoreValue>(
    () => ({
      auth,
      farmer,
      officer,
      centres,
      slots,
      bookings,
      notifications,
      queues,
      registerFarmer,
      loginFarmer,
      loginDemoFarmer,
      loginOfficer,
      loginDemoOfficer,
      logout,
      createBooking,
      cancelBooking,
      markArrived,
      markAllNotificationsRead,
      officerCentreId,
      setOfficerCentreId,
      setQueueEntryStatus: setQueueEntryStatusImpl,
      callFarmer,
      startProcurement,
      completeProcurement,
      toggleHold,
      advanceQueue,
      updateSlotCapacity,
      toggleSlotClosed,
      createSlot,
      rescheduleBooking,
      activeBookingFor,
      queueSnapshot,
    }),
    [
      auth,
      farmer,
      officer,
      centres,
      slots,
      bookings,
      notifications,
      queues,
      registerFarmer,
      loginFarmer,
      loginDemoFarmer,
      loginOfficer,
      loginDemoOfficer,
      logout,
      createBooking,
      cancelBooking,
      markArrived,
      markAllNotificationsRead,
      officerCentreId,
      setQueueEntryStatusImpl,
      callFarmer,
      startProcurement,
      completeProcurement,
      toggleHold,
      advanceQueue,
      updateSlotCapacity,
      toggleSlotClosed,
      createSlot,
      rescheduleBooking,
      activeBookingFor,
      queueSnapshot,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
}








