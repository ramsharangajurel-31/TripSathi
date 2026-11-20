// ==========================================================================
// TripSathi planner – route estimates
//
// Estimates the travel legs of a trip (start -> destinations -> start):
// distance, time and cost per person, from sample data (see options.js). It
// is NOT live routing or a real timetable.
//
// A leg is { fromId, toId, segments[], distanceKm, hours, costPerPerson, label }.
// A leg between two places that are not directly linked goes through
// Kathmandu and has two segments. An empty leg (same place, or no known
// route) has no segments.
// ==========================================================================

import {
  FLIGHT_ROUTES,
  MUST_FLY_DESTINATIONS,
  ROAD_ROUTE_OVERRIDES,
  START_LOCATIONS,
  TRANSPORT_OPTIONS,
} from "./options.js";

export const HUB_ID = "kathmandu";

export const MODE_LABELS = Object.freeze({
  "tourist-bus": "Tourist bus",
  "private-car": "Private car",
  flight: "Domestic flight",
});

const pairKey = (a, b) => [a, b].sort().join("|");
const roundToHalf = (value) => Math.round(value * 2) / 2;
const roundToFifty = (value) => Math.round(value / 50) * 50;
const roundToTenth = (value) => Math.round(value * 10) / 10;

/** "30 min", "1 hour", "6.5 hours" */
export function formatTravelTime(hours) {
  if (hours < 1) return `${Math.max(5, Math.round((hours * 60) / 5) * 5)} min`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

/** Maps the "starting location" text to a destination slug (default: Kathmandu). */
export function getStartDestinationId(startingLocation) {
  const text = String(startingLocation ?? "").trim().toLowerCase();
  const found = START_LOCATIONS.find((item) => item.value.toLowerCase() === text);
  return found ? found.destinationId : HUB_ID;
}

// Road distance when known (an override, or a pair that includes Kathmandu).
function getRoadDistance(catalog, fromId, toId) {
  const override = ROAD_ROUTE_OVERRIDES[pairKey(fromId, toId)];
  if (override) return override.distanceKm;

  if (fromId === HUB_ID) return catalog.getDestination(toId)?.fromKathmandu?.distanceKm ?? null;
  if (toId === HUB_ID) return catalog.getDestination(fromId)?.fromKathmandu?.distanceKm ?? null;
  return null;
}

// One direct segment, or null when the pair has no direct link.
function resolveDirectSegment(catalog, fromId, toId, transportId) {
  const flight = FLIGHT_ROUTES[pairKey(fromId, toId)];
  const mustFly = MUST_FLY_DESTINATIONS.includes(fromId) || MUST_FLY_DESTINATIONS.includes(toId);
  const distanceKm = getRoadDistance(catalog, fromId, toId);

  if (flight && (transportId === "flight" || mustFly)) {
    return {
      from: fromId,
      to: toId,
      mode: "flight",
      distanceKm: distanceKm ?? 0,
      hours: flight.hours,
      costPerPerson: flight.fare,
    };
  }

  if (distanceKm === null || mustFly) return null;

  const mode = transportId === "private-car" ? "private-car" : "tourist-bus";
  const option = TRANSPORT_OPTIONS.find((item) => item.id === mode);

  return {
    from: fromId,
    to: toId,
    mode,
    distanceKm,
    hours: roundToHalf(distanceKm / option.speedKmh),
    costPerPerson: Math.max(100, roundToFifty(distanceKm * option.costPerKm)),
  };
}

const emptyLeg = (fromId, toId) => ({
  fromId,
  toId,
  segments: [],
  distanceKm: 0,
  hours: 0,
  costPerPerson: 0,
  label: "",
});

/** Estimated travel between two places (destination slugs). */
export function getRouteLeg(catalog, fromId, toId, transportId = "tourist-bus") {
  if (fromId === toId) return emptyLeg(fromId, toId);

  const direct = resolveDirectSegment(catalog, fromId, toId, transportId);
  const segments = direct
    ? [direct]
    : [
        resolveDirectSegment(catalog, fromId, HUB_ID, transportId),
        resolveDirectSegment(catalog, HUB_ID, toId, transportId),
      ];

  if (segments.some((segment) => !segment)) return emptyLeg(fromId, toId);

  const distanceKm = segments.reduce((sum, item) => sum + item.distanceKm, 0);
  const hours = roundToTenth(segments.reduce((sum, item) => sum + item.hours, 0));
  const costPerPerson = segments.reduce((sum, item) => sum + item.costPerPerson, 0);

  const modes = [...new Set(segments.map((item) => MODE_LABELS[item.mode]))];
  const path = [fromId, ...segments.map((item) => item.to)].map((id) => catalog.getPlaceName(id));

  return {
    fromId,
    toId,
    segments,
    distanceKm,
    hours,
    costPerPerson,
    label: `${modes.join(" + ")} ${path.join(" → ")} (about ${formatTravelTime(hours)})`,
  };
}

/**
 * Orders destinations as a nearest-neighbour route from the start, so a trip
 * visits nearby places together instead of zig-zagging.
 */
export function orderDestinations(catalog, startId, destinationIds, transportId) {
  const remaining = [...destinationIds];
  const ordered = [];
  let current = startId;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    remaining.forEach((id, index) => {
      const leg = getRouteLeg(catalog, current, id, transportId);
      // No segments means "same place" (distance 0) or an unknown route.
      const distance = leg.segments.length > 0 ? leg.distanceKm : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    current = remaining.splice(bestIndex, 1)[0];
    ordered.push(current);
  }

  return ordered;
}

/**
 * Full route: start -> each destination in order -> back to the start.
 * Returns { legs: [{ kind: "outbound" | "between" | "return", ...leg }],
 *           totalDistanceKm, totalHours, totalCostPerPerson }
 */
export function getTripRoute(catalog, startId, orderedIds, transportId) {
  if (orderedIds.length === 0) {
    return { legs: [], totalDistanceKm: 0, totalHours: 0, totalCostPerPerson: 0 };
  }

  const stops = [startId, ...orderedIds, startId];

  const legs = stops.slice(0, -1).map((fromId, index) => {
    const leg = getRouteLeg(catalog, fromId, stops[index + 1], transportId);
    let kind = "between";
    if (index === 0) kind = "outbound";
    if (index === stops.length - 2) kind = "return";
    return { kind, ...leg };
  });

  return {
    legs,
    totalDistanceKm: legs.reduce((sum, leg) => sum + leg.distanceKm, 0),
    totalHours: roundToTenth(legs.reduce((sum, leg) => sum + leg.hours, 0)),
    totalCostPerPerson: legs.reduce((sum, leg) => sum + leg.costPerPerson, 0),
  };
}