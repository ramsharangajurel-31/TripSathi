// ==========================================================================
// TripSathi – Dashboard configuration
//
// Routes, sidebar menu, quick actions and status badge settings for the
// traveler dashboard. Icons are referenced by KEY (a short string) so this
// data file stays free of React; the Sidebar and QuickActions components
// map each key to an icon.
// ==========================================================================

import { USER_HOME } from "../utils/authRedirect";
import { TRIP_STATUS } from "../utils/tripUtils";

// ---------- Routes (single source of truth for dashboard links) ----------
export const DASHBOARD_PATHS = {
  home: USER_HOME, // "/dashboard"
  createTrip: `${USER_HOME}/create-trip`,
  savedTrips: `${USER_HOME}/saved-trips`,
  compare: `${USER_HOME}/compare`,
  profile: `${USER_HOME}/profile`,
  notifications: `${USER_HOME}/notifications`,
};

// Trip results and details share one page: /dashboard/trips/<tripId>
export const tripPath = (tripId) => `${USER_HOME}/trips/${tripId}`;

// ---------- Sidebar menu ----------
// end: true = the link is "active" only on the exact path (needed for Overview)
// showBadge: true = the Sidebar shows the unread notification count here
export const DASHBOARD_NAV = [
  { label: "Overview", to: DASHBOARD_PATHS.home, icon: "overview", end: true },
  { label: "Create trip", to: DASHBOARD_PATHS.createTrip, icon: "create" },
  { label: "Saved trips", to: DASHBOARD_PATHS.savedTrips, icon: "saved" },
  { label: "Compare trips", to: DASHBOARD_PATHS.compare, icon: "compare" },
  {
    label: "Notifications",
    to: DASHBOARD_PATHS.notifications,
    icon: "notifications",
    showBadge: true,
  },
  { label: "Profile", to: DASHBOARD_PATHS.profile, icon: "profile" },
];

// ---------- Quick actions (dashboard overview) ----------
export const QUICK_ACTIONS = [
  {
    id: "create-trip",
    title: "Create a new trip",
    description: "Set your budget and interests and get a day-by-day plan.",
    to: DASHBOARD_PATHS.createTrip,
    icon: "create",
    primary: true,
  },
  {
    id: "saved-trips",
    title: "View saved trips",
    description: "Open, edit, compare or print the itineraries you saved.",
    to: DASHBOARD_PATHS.savedTrips,
    icon: "saved",
  },
  {
    id: "profile",
    title: "Update your profile",
    description: "Keep your name, phone number and location up to date.",
    to: DASHBOARD_PATHS.profile,
    icon: "profile",
  },
];

// ---------- Trip status badges ----------
// Variants are the ones Badge supports. The label always carries the meaning
// (colour is never the only signal).
export const TRIP_STATUS_BADGES = {
  [TRIP_STATUS.upcoming]: { label: "Upcoming", variant: "info" },
  [TRIP_STATUS.ongoing]: { label: "In progress", variant: "success" },
  [TRIP_STATUS.completed]: { label: "Completed", variant: "neutral" },
};