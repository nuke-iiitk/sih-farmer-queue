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
  loginFarmer: (mobile: string, password?: string, otp?: string) => { ok: boolean; error?: string };
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
  }) => BookingResult;
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
  const [centres] = useState<ProcurementCentre[]>(procurementCentres);
  const [slots, setSlots] = useState<Slot[]>(() => buildAllSlots());
  const [bookings, setBookings] = useState<Booking[]>(() => initialBookings);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => initialNotifications);
  const [queues, setQueues] = useState<Record<string, CentreQueue>>(() => buildAllQueues());

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
    },
    [publish, syncBookingForToken]
  );

  // ------------------------------------------------------- simulation loop
  // Stands in for the future WebSocket stream: publishes queue updates on a
  // fixed cadence so the UI can be wired to real events without changes.
  const tickCountRef = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => {
      advanceQueue('c1');
      tickCountRef.current += 1;
      if (tickCountRef.current % 3 === 0) {
        advanceQueue('c2');
      }
    }, 9000);
    return () => clearInterval(timer);
  }, [advanceQueue]);
  // ------------------------------------------------------------- auth

  const registerFarmer = useCallback(
    (input: Farmer) => {
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
    },
    [addNotification]
  );

  const loginFarmer = useCallback(
    (mobile: string, password?: string, otp?: string) => {
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        return { ok: false, error: 'login.errMobile' as const };
      }
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
      return { ok: true };
    },
    []
  );

  const loginDemoFarmer = useCallback(() => {
    setFarmer(demoFarmer);
    setAuth({ role: 'farmer', farmer: demoFarmer });
  }, []);

  const loginOfficer = useCallback(
    (id: string, password: string) => {
      if (!id || id.trim().length < 4) return { ok: false, error: 'off.login.errId' as const };
      if (!password || password.length < 4) {
        return { ok: false, error: 'off.login.errPassword' as const };
      }
      const profile: Officer = { ...demoOfficer, id: id.trim().toUpperCase() };
      setOfficer(profile);
      setOfficerCentreId(profile.centreId);
      setAuth({ role: 'officer', officer: profile });
      return { ok: true };
    },
    []
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
    (input) => {
      const centre = procurementCentres.find((c) => c.id === input.centreId);
      const activeFarmer = farmer ?? demoFarmer;
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
    },
    [farmer, slots, publish, addNotification]
  );

  const cancelBooking = useCallback(
    (bookingId: string) => {
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
    },
    [bookings, publish, addNotification]
  );

  const markArrived = useCallback((bookingId: string) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, arrived: true } : booking
      )
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((note) => ({ ...note, read: true })));
  }, []);

  // ------------------------------------------------------- officer actions

  const setQueueEntryStatusImpl = useCallback(
    (centreId: string, token: string, status: QueueEntryStatus) => {
      setQueues((current) => {
        const queue = current[centreId];
        if (!queue) return current;
        const entries = queue.entries.map((entry) =>
          entry.token === token ? { ...entry, status } : entry
        );
        const updated: CentreQueue = { entries, lastUpdated: Date.now() };
        publish(centreId, updated);
        const changed = entries.find((entry) => entry.token === token);
        if (changed) syncBookingForToken(token, changed, centreId);
        return { ...current, [centreId]: updated };
      });
    },
    [publish, syncBookingForToken]
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
    setSlots((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        const nextCapacity = Math.max(slot.booked, Math.min(60, slot.capacity + delta));
        if (nextCapacity === slot.capacity) {
          result = { ok: false, error: 'off.slots.capacityMax' };
          return slot;
        }
        return { ...slot, capacity: nextCapacity };
      })
    );
    return result;
  }, []);

  const toggleSlotClosed = useCallback((slotId: string) => {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, closed: !slot.closed } : slot))
    );
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
    },
    [addNotification]
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








