// ==========================================================================
// TripSathi – Sample trips (demo traveler's itineraries)
//
// Used by: dashboard, saved trips, trip results, comparison, admin stats.
//
// Costs are NOT typed in here: each day is built from the destination's
// per-day costs (data/destinations.js) and the activity catalog
// (data/activities.js), so changing a price in one place updates every trip.
// Dates are relative to "today", so the sample trips always look current
// (one upcoming, one over budget on purpose, one completed).
//
// All amounts are SAMPLE ESTIMATES for demonstration.
// ==========================================================================

import { getActivityById } from "./activities";
import { DEMO_USERS, ROLES } from "./demoUsers";
import { getDestinationById } from "./destinations";
import { addDays, todayISO } from "../utils/formatDate";

const DEMO_TRAVELER_ID = DEMO_USERS.find((user) => user.role === ROLES.user).id;

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };

const daysAgoISO = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// ---------- Builders ----------

// Copies an activity from the catalog into an editable itinerary item.
function toItem(activityId, tripKey, dayNumber, slot, index) {
  const activity = getActivityById(activityId);

  if (!activity) {
    console.warn(`TripSathi: unknown activity "${activityId}" in sample trip.`);
    return null;
  }

  return {
    id: `${tripKey}-d${dayNumber}-${slot}-${index}`,
    activityId: activity.id,
    name: activity.name,
    category: activity.category,
    durationHours: activity.durationHours,
    costPerPerson: activity.costPerPerson,
    notes: "",
  };
}

function makeDay({
  tripKey,
  dayNumber,
  destinationId,
  tier,
  title,
  intercity = null, // { label, costPerPerson } for a travel day
  staysOvernight = true,
  foodFactor = 1, // travel days eat less in the destination
  morning = [],
  afternoon = [],
  evening = [],
}) {
  const destination = getDestinationById(destinationId);
  const costs = destination.costPerDay[tier];

  const buildSlot = (ids, slot) =>
    ids
      .map((activityId, index) => toItem(activityId, tripKey, dayNumber, slot, index))
      .filter(Boolean);

  return {
    id: `${tripKey}-d${dayNumber}`,
    dayNumber,
    destinationId,
    title,
    transport: {
      label: intercity
        ? `${intercity.label}; local taxis and rickshaws`
        : "Local taxis and rickshaws",
      costPerPerson: costs.localTransport + (intercity ? intercity.costPerPerson : 0),
    },
    accommodation: staysOvernight
      ? {
          label: `${TIER_LABELS[tier]} stay in ${destination.name}`,
          costPerPerson: costs.stay,
        }
      : null,
    food: {
      label: "Local restaurants",
      costPerPerson: Math.round(costs.food * foodFactor),
    },
    slots: {
      morning: buildSlot(morning, "morning"),
      afternoon: buildSlot(afternoon, "afternoon"),
      evening: buildSlot(evening, "evening"),
    },
    notes: "",
  };
}

function makeTrip({
  key,
  title,
  destinationIds,
  startingLocation,
  startOffset,
  durationDays,
  adults,
  children,
  tier,
  budgetTotal,
  interests,
  preferences,
  description,
  notes,
  saved,
  createdDaysAgo,
  buildDays,
}) {
  const departureDate = addDays(todayISO(), startOffset);

  return {
    id: key,
    userId: DEMO_TRAVELER_ID,
    title,
    destinationIds,
    startingLocation,
    departureDate,
    returnDate: addDays(departureDate, durationDays - 1),
    travelers: { adults, children },
    budget: { total: budgetTotal, category: tier },
    interests,
    // Option ids below are the same ones the trip wizard (Phase 4) offers.
    preferences,
    description,
    notes,
    saved,
    createdAt: daysAgoISO(createdDaysAgo),
    days: buildDays(key, tier),
  };
}

// ---------- Trips ----------

const SAMPLE_TRIPS = [
  // 1. Upcoming, comfortably within budget
  makeTrip({
    key: "trip-pokhara-friends",
    title: "Pokhara getaway with friends",
    destinationIds: ["pokhara"],
    startingLocation: "Kathmandu",
    startOffset: 21,
    durationDays: 4,
    adults: 3,
    children: 0,
    tier: "budget",
    budgetTotal: 45000,
    interests: ["nature", "adventure", "photography"],
    preferences: {
      accommodation: "hotel",
      transport: "tourist-bus",
      intensity: "moderate",
      pace: "balanced",
      special: "",
    },
    description:
      "4 days in Pokhara with two friends. Total budget NPR 45,000. We enjoy nature and photography.",
    notes: "Book the sunrise ride the evening before.",
    saved: true,
    createdDaysAgo: 6,
    buildDays: (tripKey, tier) => [
      makeDay({
        tripKey, dayNumber: 1, destinationId: "pokhara", tier,
        title: "Arrive in Pokhara",
        intercity: { label: "Tourist bus Kathmandu → Pokhara (about 7 hours)", costPerPerson: 1200 },
        evening: ["p-lakeside"],
      }),
      makeDay({
        tripKey, dayNumber: 2, destinationId: "pokhara", tier,
        title: "Sunrise and the Peace Pagoda",
        morning: ["p-sarangkot"],
        afternoon: ["p-pagoda"],
      }),
      makeDay({
        tripKey, dayNumber: 3, destinationId: "pokhara", tier,
        title: "Waterfalls and the lake",
        morning: ["p-davis"],
        afternoon: ["p-boating"],
      }),
      makeDay({
        tripKey, dayNumber: 4, destinationId: "pokhara", tier,
        title: "Return to Kathmandu",
        intercity: { label: "Tourist bus Pokhara → Kathmandu (about 7 hours)", costPerPerson: 1200 },
        staysOvernight: false,
        foodFactor: 0.5,
      }),
    ],
  }),

  // 2. Upcoming, intentionally slightly OVER budget (shows the conflict warning)
  makeTrip({
    key: "trip-chitwan-family",
    title: "Chitwan family safari",
    destinationIds: ["chitwan"],
    startingLocation: "Kathmandu",
    startOffset: 60,
    durationDays: 3,
    adults: 2,
    children: 2,
    tier: "standard",
    budgetTotal: 65000,
    interests: ["wildlife", "nature", "culture"],
    preferences: {
      accommodation: "hotel",
      transport: "tourist-bus",
      intensity: "easy",
      pace: "relaxed",
      special: "Children aged 6 and 9. Prefer short activities.",
    },
    description:
      "Family trip to Chitwan for 3 days with two adults and two children. Budget NPR 65,000.",
    notes: "",
    saved: true,
    createdDaysAgo: 3,
    buildDays: (tripKey, tier) => [
      makeDay({
        tripKey, dayNumber: 1, destinationId: "chitwan", tier,
        title: "Arrive in Chitwan",
        intercity: { label: "Tourist bus Kathmandu → Pokhara (about 7 hours)", costPerPerson: 1200 },
        afternoon: ["c-breeding"],
        evening: ["c-tharu"],
      }),
      makeDay({
        tripKey, dayNumber: 2, destinationId: "chitwan", tier,
        title: "Safari day",
        morning: ["c-safari"],
        afternoon: ["c-canoe"],
      }),
      makeDay({
        tripKey, dayNumber: 3, destinationId: "chitwan", tier,
        title: "Village walk and return",
        intercity: { label: "Tourist bus Chitwan → Kathmandu (about 5 hours)", costPerPerson: 1000 },
        staysOvernight: false,
        foodFactor: 0.5,
        morning: ["c-village-walk"],
      }),
    ],
  }),

  // 3. Completed, not saved
  makeTrip({
    key: "trip-kathmandu-heritage",
    title: "Kathmandu heritage weekend",
    destinationIds: ["kathmandu"],
    startingLocation: "Pokhara",
    startOffset: -40,
    durationDays: 3,
    adults: 2,
    children: 0,
    tier: "standard",
    budgetTotal: 40000,
    interests: ["culture", "historical", "religious", "food"],
    preferences: {
      accommodation: "hotel",
      transport: "tourist-bus",
      intensity: "easy",
      pace: "balanced",
      special: "",
    },
    description:
      "A long weekend in Kathmandu for two, focused on temples, old squares and food. Budget NPR 40,000.",
    notes: "",
    saved: false,
    createdDaysAgo: 55,
    buildDays: (tripKey, tier) => [
      makeDay({
        tripKey, dayNumber: 1, destinationId: "kathmandu", tier,
        title: "Arrive and Boudhanath",
        intercity: { label: "Tourist bus Pokhara → Kathmandu (about 7 hours)", costPerPerson: 1500 },
        afternoon: ["k-boudha"],
        evening: ["k-food"],
      }),
      makeDay({
        tripKey, dayNumber: 2, destinationId: "kathmandu", tier,
        title: "Temples and the old square",
        morning: ["k-pashupatinath"],
        afternoon: ["k-durbar"],
      }),
      makeDay({
        tripKey, dayNumber: 3, destinationId: "kathmandu", tier,
        title: "Swayambhunath and departure",
        intercity: { label: "Tourist bus Kathmandu → Pokhara (about 7 hours)", costPerPerson: 1500 },
        staysOvernight: false,
        foodFactor: 0.5,
        morning: ["k-swayambhu"],
      }),
    ],
  }),
];

export default SAMPLE_TRIPS;