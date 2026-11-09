// ==========================================================================
// TripSathi – Trip options and sample travel data
//
// Choices offered by the trip wizard (accommodation, transport, intensity,
// pace) plus the sample figures the itinerary generator uses.
//
// ALL AMOUNTS, DISTANCES AND TIMES ARE ROUGH SAMPLE ESTIMATES for
// demonstration. Real fares and road conditions vary by season, operator
// and day. Verify anything you quote in a report against current sources.
// ==========================================================================

import { ACTIVITY_INTENSITIES } from "./activities";

// ---------- Limits used by wizard validation ----------
export const TRIP_LIMITS = {
  maxDestinations: 4,
  maxDays: 30,
  minBudget: 5000,
  maxBudget: 10000000,
  minAdults: 1,
  maxAdults: 20,
  maxChildren: 10,
};

// ---------- Where the trip starts ----------
// `destinationId` links each starting city to the destination data, so the
// generator can estimate the travel legs. Only cities in the destination
// list are supported for now.
export const START_LOCATIONS = [
  { value: "Kathmandu", destinationId: "kathmandu" },
  { value: "Pokhara", destinationId: "pokhara" },
  { value: "Chitwan", destinationId: "chitwan" },
  { value: "Lumbini", destinationId: "lumbini" },
];

// ---------- Accommodation ----------
// costFactor scales the destination's nightly stay cost for the chosen
// budget category (1 = the category's normal stay).
export const ACCOMMODATION_OPTIONS = [
  {
    id: "homestay",
    label: "Homestay",
    description: "Stay with a local family. Simple and affordable.",
    costFactor: 0.7,
  },
  {
    id: "guesthouse",
    label: "Guesthouse",
    description: "Small, friendly lodges with basic comforts.",
    costFactor: 0.85,
  },
  {
    id: "hotel",
    label: "Hotel",
    description: "Comfortable mid-range hotels. The standard choice.",
    costFactor: 1,
  },
  {
    id: "resort",
    label: "Resort",
    description: "Higher-end resorts with extra facilities.",
    costFactor: 2,
  },
];

// ---------- Transport ----------
// Road options use a cost per kilometre per person (shared vehicle) and an
// average speed. Flights use fixed sample fares (see FLIGHT_ROUTES).
export const TRANSPORT_OPTIONS = [
  {
    id: "tourist-bus",
    label: "Tourist bus",
    description: "The most affordable way to travel between cities.",
    costPerKm: 6,
    speedKmh: 30,
  },
  {
    id: "private-car",
    label: "Private car or jeep",
    description: "More comfortable and flexible. Costs shared in a group.",
    costPerKm: 15,
    speedKmh: 40,
  },
  {
    id: "flight",
    label: "Domestic flight where available",
    description:
      "Faster on routes with flights. Other routes use a tourist bus.",
    costPerKm: 6, // used for the road legs of routes without a flight
    speedKmh: 30,
  },
];

// Fixed sample fares (NPR per person, one way) and total travel time in
// hours. Keys are the two destination ids sorted alphabetically.
export const FLIGHT_ROUTES = {
  "kathmandu|pokhara": { fare: 8000, hours: 0.5 },
  "everest-region|kathmandu": { fare: 18000, hours: 0.6 },
  "kathmandu|lumbini": { fare: 9000, hours: 1 },
  "ilam|kathmandu": { fare: 12000, hours: 6 }, // flight plus road transfer
  "mustang|pokhara": { fare: 7000, hours: 0.5 },
};

// Destinations that are normally reached by air. Trips to them always fly
// on the legs where a flight exists, whatever transport was chosen.
export const MUST_FLY_DESTINATIONS = ["everest-region"];

// Approximate road distances (km) between destinations that are NOT
// Kathmandu. Any other pair is estimated as a trip through Kathmandu.
export const ROAD_ROUTE_OVERRIDES = {
  "chitwan|pokhara": { distanceKm: 170 },
  "bandipur|pokhara": { distanceKm: 90 },
  "lumbini|pokhara": { distanceKm: 200 },
  "ghandruk|pokhara": { distanceKm: 45 },
  "mustang|pokhara": { distanceKm: 160 },
};

// ---------- Activity intensity ----------
const INTENSITY_DESCRIPTIONS = {
  easy: "Short, gentle activities. Little walking.",
  moderate: "Some walking or light hiking.",
  challenging: "Long or demanding days, suited to fit travelers.",
};

export const INTENSITY_OPTIONS = ACTIVITY_INTENSITIES.map((item, index) => ({
  ...item,
  rank: index,
  description: INTENSITY_DESCRIPTIONS[item.id],
}));

// ---------- Travel pace ----------
export const PACE_OPTIONS = [
  {
    id: "relaxed",
    label: "Relaxed",
    description: "About 1 activity a day, with plenty of free time.",
    activitiesPerDay: 1,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "About 2 activities a day.",
    activitiesPerDay: 2,
  },
  {
    id: "packed",
    label: "Packed",
    description: "Up to 3 activities a day to see as much as possible.",
    activitiesPerDay: 3,
  },
];

export const DEFAULT_PREFERENCES = {
  accommodation: "hotel",
  transport: "tourist-bus",
  intensity: "moderate",
  pace: "balanced",
  special: "",
};

// ---------- Helpers ----------
export const getOptionLabel = (options, id) =>
  options.find((option) => option.id === id)?.label || id;