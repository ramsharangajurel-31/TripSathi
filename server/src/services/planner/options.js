// ==========================================================================
// TripSathi planner – settings
//
// Every number here is a SAMPLE ESTIMATE used for demonstration: fares,
// speeds, distances and accommodation factors are not live prices or real
// timetables. They are kept in one file so they are easy to find; when real
// transport data exists they move into the database (the Transportation
// records planned for a later step).
// ==========================================================================

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const TRIP_LIMITS = deepFreeze({
  maxDestinations: 4,
  maxDays: 30,
  minBudget: 5000,
  maxBudget: 10_000_000,
  minAdults: 1,
  maxAdults: 20,
  maxChildren: 10,
});

// Children are charged at this share of an adult. The miscellaneous buffer is
// a whole-number percentage of the other costs.
export const COST_RULES = deepFreeze({ childFactor: 0.5, miscPercent: 5 });

// Cities a trip can start from. Each maps to a destination slug, so the
// planner can estimate the travel legs. Anything else is treated as Kathmandu.
export const START_LOCATIONS = deepFreeze([
  { value: "Kathmandu", destinationId: "kathmandu" },
  { value: "Pokhara", destinationId: "pokhara" },
  { value: "Chitwan", destinationId: "chitwan" },
  { value: "Lumbini", destinationId: "lumbini" },
]);

// costFactor scales the destination's nightly stay cost (1 = the normal stay
// for the chosen budget level).
export const ACCOMMODATION_OPTIONS = deepFreeze([
  { id: "homestay", label: "Homestay", costFactor: 0.7 },
  { id: "guesthouse", label: "Guesthouse", costFactor: 0.85 },
  { id: "hotel", label: "Hotel", costFactor: 1 },
  { id: "resort", label: "Resort", costFactor: 2 },
]);

// Road options: cost per kilometre per person (shared vehicle) and average
// speed. "flight" uses FLIGHT_ROUTES where a flight exists; its road values
// are used on legs that have no flight.
export const TRANSPORT_OPTIONS = deepFreeze([
  { id: "tourist-bus", label: "Tourist bus", costPerKm: 6, speedKmh: 30 },
  { id: "private-car", label: "Private car or jeep", costPerKm: 15, speedKmh: 40 },
  { id: "flight", label: "Domestic flight where available", costPerKm: 6, speedKmh: 30 },
]);

// Sample one-way fares (NPR per person) and total travel hours. Keys are two
// destination slugs in ALPHABETICAL order.
export const FLIGHT_ROUTES = deepFreeze({
  "kathmandu|pokhara": { fare: 8000, hours: 0.5 },
  "everest-region|kathmandu": { fare: 18000, hours: 0.6 },
  "kathmandu|lumbini": { fare: 9000, hours: 1 },
  "ilam|kathmandu": { fare: 12000, hours: 6 }, // flight plus road transfer
  "mustang|pokhara": { fare: 7000, hours: 0.5 },
});

// Places normally reached by air: a flight is used where one exists,
// whatever transport was chosen.
export const MUST_FLY_DESTINATIONS = deepFreeze(["everest-region"]);

// Approximate road distances (km) between places that are NOT linked through
// Kathmandu. Any other pair is estimated as a trip through Kathmandu.
export const ROAD_ROUTE_OVERRIDES = deepFreeze({
  "chitwan|pokhara": { distanceKm: 170 },
  "bandipur|pokhara": { distanceKm: 90 },
  "lumbini|pokhara": { distanceKm: 200 },
  "ghandruk|pokhara": { distanceKm: 45 },
  "mustang|pokhara": { distanceKm: 160 },
});

// A higher rank is harder. An intensity setting allows activities up to its rank.
export const INTENSITY_OPTIONS = deepFreeze([
  { id: "easy", label: "Easy", rank: 0 },
  { id: "moderate", label: "Moderate", rank: 1 },
  { id: "challenging", label: "Challenging", rank: 2 },
]);

export const PACE_OPTIONS = deepFreeze([
  { id: "relaxed", label: "Relaxed", activitiesPerDay: 1 },
  { id: "balanced", label: "Balanced", activitiesPerDay: 2 },
  { id: "packed", label: "Packed", activitiesPerDay: 3 },
]);

export const DEFAULT_PREFERENCES = deepFreeze({
  accommodation: "hotel",
  transport: "tourist-bus",
  intensity: "moderate",
  pace: "balanced",
  special: "",
});