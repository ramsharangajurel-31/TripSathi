// ==========================================================================
// TripSathi planner – rule-based itinerary generator (NO AI)
//
// Turns trip requirements into a complete trip: ordered destinations, a
// day-by-day plan with activities, and per-day costs. The result has the same
// shape the cost model (costs.js) works on.
//
// RULES (deterministic: the same requirements always give the same plan)
//  1. Destinations are ordered as a nearest-neighbour route from the start.
//     They are sorted first, so the order the user listed them in never
//     changes the result.
//  2. Days are shared between destinations in proportion to each one's
//     recommended days (every destination gets at least one day).
//  3. Days with travel (arriving / returning) have fewer activity slots.
//  4. Activities above the chosen intensity, or outside their season, are
//     excluded. The rest are ranked by matching interests, then lower cost.
//  5. If the estimate is over budget, the most expensive paid activities are
//     removed one by one until it fits. If it still does not fit, a warning
//     says so.
//
// Known limitation: when a day has spare capacity, an activity can be placed
// in a time slot other than its best one (for example a sunrise viewpoint in
// the evening). The scheduling engine planned for later fixes this.
//
// Everything is a sample estimate. AI is added later ONLY to read natural
// language into the requirements; this planner stays in charge of the plan.
// ==========================================================================

import { BUDGET_TIERS, INTERESTS, TIME_SLOTS } from "../../constants.js";
import { getTripCosts } from "./costs.js";
import { addDays, getDurationDays, parseDate, todayISO } from "./dates.js";
import { formatCurrency } from "./format.js";
import {
  ACCOMMODATION_OPTIONS,
  DEFAULT_PREFERENCES,
  INTENSITY_OPTIONS,
  PACE_OPTIONS,
  START_LOCATIONS,
  TRANSPORT_OPTIONS,
  TRIP_LIMITS,
} from "./options.js";
import { getRouteLeg, getStartDestinationId, orderDestinations } from "./route.js";

export const PLANNER_VERSION = 1;

const MAX_HOURS_PER_DAY = 9;
const REMOTE_DESTINATIONS = ["mustang", "ghandruk", "everest-region"];
const HIGH_ALTITUDE_METRES = 2500;
const TEXT_LIMITS = { special: 300, description: 500, notes: 500 };

export class PlanningError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "PlanningError";
    this.code = "INVALID_TRIP_REQUIREMENTS";
    this.details = details; // [{ field, message }]
  }
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const listWithOr = (items) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;

const joinNames = (names) =>
  names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

// ---------- Small helpers used by callers ----------

/** Each chosen destination needs at least one day. */
export const getMinimumTripDays = (destinationCount) => Math.max(1, destinationCount);

/** The sum of the destinations' recommended days, kept within the trip limit. */
export function getSuggestedDays(catalog, destinationIds = []) {
  const total = destinationIds.reduce(
    (sum, id) => sum + (catalog.getDestination(id)?.recommendedDays || 0),
    0
  );
  return Math.min(Math.max(total, 1), TRIP_LIMITS.maxDays);
}

// ---------- Validation ----------

const PREFERENCE_OPTIONS = {
  accommodation: ACCOMMODATION_OPTIONS,
  transport: TRANSPORT_OPTIONS,
  intensity: INTENSITY_OPTIONS,
  pace: PACE_OPTIONS,
};

/**
 * Checks and cleans the trip requirements. Returns { errors, value }:
 * errors is a list of { field, message } (empty when valid), value the
 * cleaned requirements (only meaningful when there are no errors).
 *
 * options.today          "YYYY-MM-DD" in Nepal time (tests set it)
 * options.allowPastDates allow departure dates in the past (re-planning an
 *                        existing trip)
 */
export function validateRequirements(catalog, input, { today = todayISO(), allowPastDates = false } = {}) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const source = isObject(input) ? input : {};

  // ----- Start -----
  const startText = typeof source.startingLocation === "string" ? source.startingLocation.trim().toLowerCase() : "";
  const start = START_LOCATIONS.find((item) => item.value.toLowerCase() === startText);
  if (!start) {
    add("startingLocation", `Choose where the trip starts: ${listWithOr(START_LOCATIONS.map((item) => item.value))}.`);
  }

  // ----- Destinations (sorted, so the result never depends on the order given) -----
  let destinationIds = [];
  const given = source.destinationIds;

  if (!Array.isArray(given) || given.length === 0) {
    add("destinationIds", "Choose at least one destination.");
  } else if (given.length > TRIP_LIMITS.maxDestinations) {
    add("destinationIds", `Choose up to ${TRIP_LIMITS.maxDestinations} destinations.`);
  } else if (given.some((id) => typeof id !== "string")) {
    add("destinationIds", "Destinations must be given by their slug.");
  } else if (new Set(given).size !== given.length) {
    add("destinationIds", "Choose each destination only once.");
  } else {
    const unknown = given.filter((id) => !catalog.getDestination(id));
    if (unknown.length > 0) add("destinationIds", `Unknown or unavailable destination: ${unknown.join(", ")}.`);
    else destinationIds = [...given].sort();
  }

  // ----- Dates -----
  const departureOk = typeof source.departureDate === "string" && parseDate(source.departureDate) !== null;
  const returnOk = typeof source.returnDate === "string" && parseDate(source.returnDate) !== null;

  if (!departureOk) add("departureDate", "Enter a valid departure date (YYYY-MM-DD).");
  if (!returnOk) add("returnDate", "Enter a valid return date (YYYY-MM-DD).");

  if (departureOk && returnOk) {
    if (!allowPastDates && source.departureDate < today) {
      add("departureDate", "Departure date cannot be in the past.");
    }
    if (source.returnDate < source.departureDate) {
      add("returnDate", "Return date must be on or after the departure date.");
    } else {
      const days = getDurationDays(source.departureDate, source.returnDate);
      if (days > TRIP_LIMITS.maxDays) {
        add("returnDate", `A trip can be at most ${TRIP_LIMITS.maxDays} days long.`);
      } else if (destinationIds.length > 0 && days < getMinimumTripDays(destinationIds.length)) {
        add("returnDate", `${destinationIds.length} destinations need at least ${destinationIds.length} days.`);
      }
    }
  }

  // ----- Travellers -----
  const { adults } = source;
  if (!Number.isInteger(adults) || adults < TRIP_LIMITS.minAdults || adults > TRIP_LIMITS.maxAdults) {
    add("adults", `Adults must be a whole number from ${TRIP_LIMITS.minAdults} to ${TRIP_LIMITS.maxAdults}.`);
  }

  const children = source.children === undefined ? 0 : source.children;
  if (!Number.isInteger(children) || children < 0 || children > TRIP_LIMITS.maxChildren) {
    add("children", `Children must be a whole number from 0 to ${TRIP_LIMITS.maxChildren}.`);
  }

  // ----- Budget -----
  const { budgetTotal } = source;
  if (!Number.isInteger(budgetTotal) || budgetTotal < TRIP_LIMITS.minBudget || budgetTotal > TRIP_LIMITS.maxBudget) {
    add(
      "budgetTotal",
      `Budget must be a whole number from ${formatCurrency(TRIP_LIMITS.minBudget)} to ${formatCurrency(TRIP_LIMITS.maxBudget)}.`
    );
  }

  const budgetCategory = source.budgetCategory === undefined ? "standard" : source.budgetCategory;
  if (!BUDGET_TIERS.includes(budgetCategory)) add("budgetCategory", `Choose one of: ${BUDGET_TIERS.join(", ")}.`);

  // ----- Interests -----
  const interests = source.interests;
  if (!Array.isArray(interests) || interests.length === 0) {
    add("interests", "Choose at least one interest.");
  } else if (interests.some((item) => !INTERESTS.includes(item))) {
    add("interests", `Interests must be from: ${INTERESTS.join(", ")}.`);
  } else if (new Set(interests).size !== interests.length) {
    add("interests", "Choose each interest only once.");
  }

  // ----- Preferences -----
  const preferences = {};
  if (source.preferences !== undefined) {
    if (!isObject(source.preferences)) {
      add("preferences", "Preferences must be an object.");
    } else {
      for (const [key, options] of Object.entries(PREFERENCE_OPTIONS)) {
        const chosen = source.preferences[key];
        if (chosen === undefined) continue;

        if (options.some((option) => option.id === chosen)) preferences[key] = chosen;
        else add(`preferences.${key}`, `Choose one of: ${options.map((option) => option.id).join(", ")}.`);
      }

      const { special } = source.preferences;
      if (special !== undefined) {
        if (typeof special !== "string" || special.length > TEXT_LIMITS.special) {
          add("preferences.special", `Special requirements must be text of at most ${TEXT_LIMITS.special} characters.`);
        } else {
          preferences.special = special.trim();
        }
      }
    }
  }

  // ----- Free text -----
  const text = (field, label) => {
    const raw = source[field];
    if (raw === undefined) return "";
    if (typeof raw !== "string" || raw.length > TEXT_LIMITS[field]) {
      add(field, `${label} must be text of at most ${TEXT_LIMITS[field]} characters.`);
      return "";
    }
    return raw.trim();
  };
  const description = text("description", "Description");
  const notes = text("notes", "Notes");

  return {
    errors,
    value: {
      startingLocation: start ? start.value : "",
      destinationIds,
      departureDate: source.departureDate,
      returnDate: source.returnDate,
      adults,
      children,
      budgetTotal,
      budgetCategory,
      interests: Array.isArray(interests) ? [...interests] : [],
      preferences,
      description,
      notes,
    },
  };
}

// ---------- Day allocation ----------

// Shares `totalDays` between destinations in proportion to their recommended
// days (largest-remainder method), using whole numbers only so a floating-
// point rounding quirk can never move a day to the wrong destination.
function allocateDays(destinations, totalDays) {
  const extra = totalDays - destinations.length;
  const weightTotal = destinations.reduce((sum, item) => sum + item.recommendedDays, 0);

  const shares = destinations.map((destination, index) => {
    const numerator = extra * destination.recommendedDays;
    return { index, base: Math.floor(numerator / weightTotal), remainder: numerator % weightTotal };
  });

  let leftover = extra - shares.reduce((sum, share) => sum + share.base, 0);

  [...shares]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach((share) => {
      if (leftover > 0) {
        share.base += 1;
        leftover -= 1;
      }
    });

  return shares.map((share) => share.base + 1); // every destination gets its first day
}

// ---------- Activity selection ----------

const rankOf = (intensityId) => INTENSITY_OPTIONS.find((item) => item.id === intensityId)?.rank ?? 0;

function rankActivities(catalog, destinationSlug, interests, maxRank) {
  return catalog
    .getActivitiesByDestination(destinationSlug)
    .filter((activity) => rankOf(activity.intensity) <= maxRank)
    .map((activity) => ({ activity, matches: interests.includes(activity.category) }))
    .sort(
      (a, b) =>
        Number(b.matches) - Number(a.matches) ||
        a.activity.costPerPerson - b.activity.costPerPerson ||
        a.activity.name.localeCompare(b.activity.name, "en") ||
        String(a.activity.id).localeCompare(String(b.activity.id))
    );
}

// An empty season list means "available all year".
function isAvailableOn(activity, isoDate) {
  const months = activity.seasonalAvailability ?? [];
  return months.length === 0 || months.includes(Number(isoDate.slice(5, 7)));
}

// Which time slots a day can use, and how many activities fit.
function getDayCapacity(perDay, arrives, departs) {
  let slots = [...TIME_SLOTS];
  let capacity = perDay;

  if (arrives && departs) return { slots: ["afternoon"], capacity: Math.min(1, perDay) };

  if (arrives) {
    slots = slots.filter((slot) => slot !== "morning");
    capacity -= 1;
  }
  if (departs) {
    slots = slots.filter((slot) => slot === "morning");
    capacity -= 1;
  }
  return { slots, capacity: Math.max(0, capacity) };
}

// Ids are made from the position, never from the clock, so a plan is the same
// every time it is generated.
const toItem = (activity, dayNumber, slot, index) => ({
  id: `d${dayNumber}-${slot}-${index}`,
  activityId: activity.id,
  name: activity.name,
  category: activity.category,
  durationHours: activity.durationHours,
  costPerPerson: activity.costPerPerson,
  notes: "",
});

// ---------- Main function ----------

/**
 * Builds a trip from requirements.
 *
 * input: { startingLocation, destinationIds[], departureDate, returnDate,
 *          adults, children, budgetTotal, budgetCategory, interests[],
 *          preferences: { accommodation, transport, intensity, pace, special },
 *          description, notes }
 *
 * options.fitBudget       true (default) removes costly activities to fit the
 *                         budget. What-if simulations pass false: they must
 *                         never remove anything by themselves
 * options.today           see validateRequirements
 * options.allowPastDates  see validateRequirements
 *
 * Returns a trip (see costs.js for the shape) plus:
 *   warnings          [{ code, message, details? }]
 *   generationNotes   the same messages as plain strings
 *   generationMetadata
 * Throws PlanningError (with .details) when the requirements are invalid.
 */
export function generateTrip(catalog, input, options = {}) {
  const { fitBudget = true, today, allowPastDates = false } = options;

  const { errors, value } = validateRequirements(catalog, input, { today, allowPastDates });
  if (errors.length > 0) throw new PlanningError("The trip requirements are not valid.", errors);

  const preferences = { ...DEFAULT_PREFERENCES, ...value.preferences };
  const warnings = [];
  const warn = (code, message, details) => warnings.push(details ? { code, message, details } : { code, message });

  const totalDays = getDurationDays(value.departureDate, value.returnDate);
  const tier = value.budgetCategory;
  const accommodation = ACCOMMODATION_OPTIONS.find((item) => item.id === preferences.accommodation);
  const pace = PACE_OPTIONS.find((item) => item.id === preferences.pace);
  const maxRank = rankOf(preferences.intensity);

  const startId = getStartDestinationId(value.startingLocation);
  const orderedIds = orderDestinations(catalog, startId, value.destinationIds, preferences.transport);
  const destinations = orderedIds.map((id) => catalog.getDestination(id));
  const allocation = allocateDays(destinations, totalDays);

  const lastId = orderedIds[orderedIds.length - 1];
  const returnLeg = getRouteLeg(catalog, lastId, startId, preferences.transport);

  // ----- Build the days -----
  const days = [];
  let dayNumber = 0;

  destinations.forEach((destination, blockIndex) => {
    const previousId = blockIndex === 0 ? startId : orderedIds[blockIndex - 1];
    const legIn = getRouteLeg(catalog, previousId, destination.slug, preferences.transport);
    const ranked = rankActivities(catalog, destination.slug, value.interests, maxRank);
    const used = new Set();

    if (ranked.length > 0 && !ranked.some((item) => item.matches)) {
      warn(
        "INTEREST_FALLBACK",
        `No ${destination.name} activities match your selected interests, so general activities were chosen.`,
        { destination: destination.slug }
      );
    }
    if (previousId !== destination.slug && legIn.segments.length === 0) {
      warn(
        "ROUTE_UNKNOWN",
        `No travel estimate is available between ${catalog.getPlaceName(previousId)} and ${destination.name}, so that travel is not included in the cost.`,
        { from: previousId, to: destination.slug }
      );
    }

    for (let offset = 0; offset < allocation[blockIndex]; offset += 1) {
      dayNumber += 1;

      const date = addDays(value.departureDate, dayNumber - 1);
      const isFirstOfBlock = offset === 0;
      const isLastDay = dayNumber === totalDays;
      const arrives = isFirstOfBlock && legIn.segments.length > 0;
      const departs = isLastDay && returnLeg.segments.length > 0;

      const { slots: allowedSlots, capacity } = getDayCapacity(pace.activitiesPerDay, arrives, departs);

      const placed = { morning: [], afternoon: [], evening: [] };
      let placedCount = 0;
      let hoursUsed = 0;

      // First pass puts each activity in its best time of day; the second
      // fills any free slot that is left.
      const place = (exactSlotOnly) => {
        for (const { activity } of ranked) {
          if (placedCount >= capacity) return;
          if (used.has(activity.id) || !isAvailableOn(activity, date)) continue;
          if (hoursUsed + activity.durationHours > MAX_HOURS_PER_DAY) continue;

          const bestSlotFree =
            allowedSlots.includes(activity.bestTime) && placed[activity.bestTime].length === 0;

          let slot = null;
          if (bestSlotFree) slot = activity.bestTime;
          else if (!exactSlotOnly) slot = allowedSlots.find((id) => placed[id].length === 0) ?? null;
          if (!slot) continue;

          placed[slot].push(toItem(activity, dayNumber, slot, placed[slot].length));
          used.add(activity.id);
          placedCount += 1;
          hoursUsed += activity.durationHours;
        }
      };

      place(true);
      place(false);

      // ----- Costs for this day (per person) -----
      const costs = destination.costPerDay[tier];
      const legCost = (isFirstOfBlock ? legIn.costPerPerson : 0) + (departs ? returnLeg.costPerPerson : 0);

      const transportParts = [
        isFirstOfBlock && legIn.label,
        departs && returnLeg.label,
        "Local taxis and rickshaws",
      ].filter(Boolean);

      const firstActivity = [...placed.morning, ...placed.afternoon, ...placed.evening][0];

      let title = firstActivity ? firstActivity.name : `Explore ${destination.name}`;
      if (arrives && departs) title = `Day trip to ${destination.name}`;
      else if (arrives) title = `Arrive in ${destination.name}`;
      else if (departs) {
        title = firstActivity ? `${firstActivity.name} and return` : `Return to ${catalog.getPlaceName(startId)}`;
      }

      days.push({
        id: `d${dayNumber}`,
        dayNumber,
        destinationId: destination.slug,
        title,
        transport: {
          label: transportParts.join("; "),
          costPerPerson: costs.localTransport + legCost,
        },
        accommodation: isLastDay
          ? null
          : {
              label: `${accommodation.label} stay in ${destination.name}`,
              costPerPerson: Math.round(costs.stay * accommodation.costFactor),
            },
        food: { label: "Local restaurants", costPerPerson: Math.round(costs.food * (departs ? 0.5 : 1)) },
        slots: placed,
        notes: "",
      });
    }
  });

  if (lastId !== startId && returnLeg.segments.length === 0) {
    warn(
      "ROUTE_UNKNOWN",
      `No travel estimate is available between ${catalog.getPlaceName(lastId)} and ${catalog.getPlaceName(startId)}, so the return travel is not included in the cost.`,
      { from: lastId, to: startId }
    );
  }

  // ----- Assemble the trip -----
  const trip = {
    title: `${totalDays}-day ${joinNames(destinations.map((item) => item.name))} trip`,
    destinationIds: orderedIds,
    startingLocation: value.startingLocation,
    departureDate: value.departureDate,
    returnDate: value.returnDate,
    travelers: { adults: value.adults, children: value.children },
    budget: { total: value.budgetTotal, category: tier },
    interests: value.interests,
    preferences,
    description: value.description,
    notes: value.notes,
    days,
  };

  // ----- Fit the budget by removing the costliest paid activities -----
  let costs = getTripCosts(trip);
  const removed = [];

  while (fitBudget && costs.isOverBudget) {
    let target = null;

    for (const day of trip.days) {
      for (const slot of TIME_SLOTS) {
        for (const item of day.slots[slot]) {
          // Strictly greater: on a tie the earliest activity is removed first.
          if (item.costPerPerson > 0 && (!target || item.costPerPerson > target.item.costPerPerson)) {
            target = { day, slot, item };
          }
        }
      }
    }
    if (!target) break;

    target.day.slots[target.slot] = target.day.slots[target.slot].filter((item) => item.id !== target.item.id);
    removed.push(target.item.name);
    costs = getTripCosts(trip);
  }

  if (fitBudget) {
    if (removed.length > 0) {
      warn(
        "ACTIVITIES_REMOVED",
        `To stay near your budget, these activities were left out: ${removed.join(", ")}. You can add them back by editing the itinerary.`,
        { activities: removed }
      );
    }

    if (costs.isOverBudget) {
      warn(
        "OVER_BUDGET",
        `Even without optional paid activities, the estimate is ${formatCurrency(costs.overBy)} above your budget. Consider a lower accommodation level, fewer days or a cheaper transport option.`,
        { overBy: costs.overBy }
      );
    } else if (costs.remaining * 4 > value.budgetTotal) {
      warn(
        "BUDGET_UNUSED",
        `About ${formatCurrency(costs.remaining)} of your budget is unused. You could choose a higher accommodation level or add more activities.`,
        { remaining: costs.remaining }
      );
    }
  }

  if (orderedIds.some((id) => REMOTE_DESTINATIONS.includes(id))) {
    warn(
      "REMOTE_PERMITS",
      "Trekking permits, guides and porters for remote regions are not included in these estimates."
    );
  }
  if (destinations.some((item) => item.altitudeM >= HIGH_ALTITUDE_METRES)) {
    warn(
      "HIGH_ALTITUDE",
      "This trip includes high-altitude areas. Allow time to acclimatise and check conditions before you travel."
    );
  }

  return {
    ...trip,
    warnings,
    generationNotes: warnings.map((item) => item.message),
    generationMetadata: { generator: "rule-based", plannerVersion: PLANNER_VERSION, fitBudget },
  };
}