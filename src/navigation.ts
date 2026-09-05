import type { Href } from 'expo-router';

/** Central route map so navigation strings stay in sync with src/app. */
export const path = {
  home: '/' as Href,
  about: '/about' as Href,
  howItWorks: '/how-it-works' as Href,
  centres: '/centres' as Href,
  help: '/help' as Href,
  login: '/login' as Href,
  register: '/register' as Href,
  dashboard: '/dashboard' as Href,
  booking: '/booking' as Href,
  queue: '/queue' as Href,
  bookings: '/bookings' as Href,
  status: '/status' as Href,
  notifications: '/notifications' as Href,
  profile: '/profile' as Href,
  notices: '/notices' as Href,
  officialLogin: '/official/login' as Href,
  officialDashboard: '/official' as Href,
  officialQueue: '/official/queue' as Href,
  officialSlots: '/official/slots' as Href,
  officialAnalytics: '/official/analytics' as Href,
};

