// ==========================================================================
// TripSathi – Notification types and sample notifications
//
// Sample notifications for the demo traveler. Timestamps are relative to
// when the app loads, so "3 h ago" always looks current. Messages avoid
// exact dates and amounts so they never go stale as trips change.
// ==========================================================================

import { DEMO_USERS, ROLES } from "./demoUsers";
import { tripPath } from "./dashboardData";

// type -> label, badge variant and icon key (mapped to an icon in the UI)
export const NOTIFICATION_TYPES = {
  trip: { label: "Trip", variant: "primary", icon: "trip" },
  budget: { label: "Budget", variant: "warning", icon: "budget" },
  tip: { label: "Tip", variant: "info", icon: "tip" },
  system: { label: "System", variant: "neutral", icon: "system" },
};

const DEMO_TRAVELER_ID = DEMO_USERS.find((user) => user.role === ROLES.user).id;

const hoursAgo = (hours) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

// Ids of the trips below come from data/sampleTrips.js.
const SEED_NOTIFICATIONS = [
  {
    id: "n-demo-1",
    userId: DEMO_TRAVELER_ID,
    type: "trip",
    title: "Your Pokhara trip is saved",
    message:
      "Review the day-by-day itinerary and the cost breakdown before you travel.",
    link: tripPath("trip-pokhara-friends"),
    createdAt: hoursAgo(3),
    read: false,
  },
  {
    id: "n-demo-2",
    userId: DEMO_TRAVELER_ID,
    type: "budget",
    title: "Chitwan family safari is over budget",
    message:
      "The estimated cost is above your budget. Open the trip to review it and see lower-cost alternatives.",
    link: tripPath("trip-chitwan-family"),
    createdAt: hoursAgo(26),
    read: false,
  },
  {
    id: "n-demo-3",
    userId: DEMO_TRAVELER_ID,
    type: "tip",
    title: "Try the What-if simulator",
    message:
      "Change your budget or trip length to see how the estimated cost shifts. Results are simulated estimates.",
    link: null,
    createdAt: hoursAgo(50),
    read: false,
  },
  {
    id: "n-demo-4",
    userId: DEMO_TRAVELER_ID,
    type: "system",
    title: "Welcome to TripSathi",
    message:
      "Your account is ready. Create a trip to get a day-by-day plan with costs in NPR.",
    link: null,
    createdAt: hoursAgo(120),
    read: true,
  },
  {
    id: "n-demo-5",
    userId: DEMO_TRAVELER_ID,
    type: "system",
    title: "About the sample data",
    message:
      "Prices and weather in this demo are sample information, not live data.",
    link: null,
    createdAt: hoursAgo(121),
    read: true,
  },
];

export default SEED_NOTIFICATIONS;