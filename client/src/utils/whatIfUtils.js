// ==========================================================================
// TripSathi – What-if simulation (deterministic, rule-based, NO AI)
//
// Given a saved trip and a "scenario" (changed budget, days, travelers,
// preferences, unticked activities), returns the simulated trip and a
// before/after comparison. The saved trip is never modified.
//
// Two ways a scenario is applied:
//   ADJUST  Budget, travelers, accommodation, transport and unticked
//           activities change the existing plan. Manual edits are kept.
//   RE-PLAN Trip length, activity intensity or travel pace change the
//           shape of the plan, so it is rebuilt with generateTrip() (the
//           same planner the wizard uses). Manual edits are NOT kept.
//
// Costs always come from getTripCosts(), so a simulation uses exactly the
// same cost model as the rest of the app. All figures are SAMPLE ESTIMATES
// and every result must be labelled "simulated estimate" in the UI.
// ==========================================================================

import activities, { ACTIVITY_SLOTS } from "../data/activities";
import { getDestinationById } from "../data/destinations";
import {
  ACCOMMODATION_OPTIONS,
  DEFAULT_PREFERENCES,
  INTENSITY_OPTIONS,
  TRIP_LIMITS,
} from "../data/tripOptions";
import { formatCurrency } from "./formatCurrency";
import { addDays } from "./formatDate";
import { getRouteLeg, getStartDestinationId } from "./routeUtils";
import { generateTrip, getMinimumTripDays } from "./tripGenerator";
import { getActivityCount, getDurationDays, getTripCosts } from "./tripUtils";

export const WHAT_IF_DISCLAIMER =
  "Simulated estimates calculated from sample data with fixed rules. This is not AI optimisation and nothing is booked or saved.";

/**
 * Key that identifies an activity across plans. Catalog activities use their
 * catalog id (stable even after a re-plan); custom activities use their own id.
 */
export const itemKey = (item) => item.activityId || item.id;

const clone = (value) => JSON.parse(JSON.stringify(value));

// ---------- Scenario basics ----------

/** The scenario that matches the trip exactly (no changes). */
export function getScenarioDefaults(trip) {
  const preferences = { ...DEFAULT_PREFERENCES, ...(trip.preferences || {}) };

  return {
    budgetTotal: trip.budget?.total || 0,
    days: getDurationDays(trip.departureDate, trip.returnDate),
    adults: trip.travelers?.adults || 1,
    children: trip.travelers?.children || 0,
    accommodation: preferences.accommodation,
    transport: preferences.transport,
    intensity: preferences.intensity,
    pace: preferences.pace,
    excluded: [],
  };
}

const normalize = (scenario) => ({
  ...scenario,
  budgetTotal: Number(scenario.budgetTotal),
  days: Number(scenario.days),
  adults: Number(scenario.adults),
  children: Number(scenario.children),
  excluded: scenario.excluded || [],
});

/** True when the scenario differs from the trip in any way. */
export function hasChanges(trip, scenario) {
  const base = getScenarioDefaults(trip);
  const next = normalize(scenario);

  return (
    next.budgetTotal !== base.budgetTotal ||
    next.days !== base.days ||
    next.adults !== base.adults ||
    next.children !== base.children ||
    next.accommodation !== base.accommodation ||
    next.transport !== base.transport ||
    next.intensity !== base.intensity ||
    next.pace !== base.pace ||
    next.excluded.length > 0
  );
}

/** True when the plan has to be rebuilt (length, intensity or pace changed). */
export function needsReplan(trip, scenario) {
  const base = getScenarioDefaults(trip);
  const next = normalize(scenario);

  return (
    next.days !== base.days ||
    next.intensity !== base.intensity ||
    next.pace !== base.pace
  );
}

// ---------- Validation ----------

/** Returns { field: message } for invalid scenario values ({} = valid). */
export function validateScenario(trip, scenario) {
  const errors = {};
  const next = normalize(scenario);

  if (!Number.isFinite(next.budgetTotal)) {
    errors.budgetTotal = "Enter a budget.";
  } else if (next.budgetTotal < TRIP_LIMITS.minBudget) {
    errors.budgetTotal = `Budget must be at least ${formatCurrency(TRIP_LIMITS.minBudget)}.`;
  } else if (next.budgetTotal > TRIP_LIMITS.maxBudget) {
    errors.budgetTotal = `Budget must be ${formatCurrency(TRIP_LIMITS.maxBudget)} or less.`;
  }

  const minDays = getMinimumTripDays((trip.destinationIds || []).length);
  if (!Number.isInteger(next.days)) {
    errors.days = "Enter a whole number of days.";
  } else if (next.days < minDays) {
    errors.days =
      minDays === 1
        ? "A trip needs at least 1 day."
        : `${minDays} destinations need at least ${minDays} days.`;
  } else if (next.days > TRIP_LIMITS.maxDays) {
    errors.days = `A trip can be at most ${TRIP_LIMITS.maxDays} days long.`;
  }

  if (!Number.isInteger(next.adults) || next.adults < TRIP_LIMITS.minAdults) {
    errors.adults = `At least ${TRIP_LIMITS.minAdults} adult is needed.`;
  } else if (next.adults > TRIP_LIMITS.maxAdults) {
    errors.adults = `At most ${TRIP_LIMITS.maxAdults} adults.`;
  }

  if (!Number.isInteger(next.children) || next.children < 0) {
    errors.children = "Children must be 0 or more.";
  } else if (next.children > TRIP_LIMITS.maxChildren) {
    errors.children = `At most ${TRIP_LIMITS.maxChildren} children.`;
  }

  return errors;
}

// ---------- Adjusting the existing plan ----------

// Re-prices every night with another accommodation type, from the same
// destination stay costs the planner uses.
function repriceAccommodation(trip, optionId) {
  const option = ACCOMMODATION_OPTIONS.find((item) => item.id === optionId);
  if (!option) return trip;

  const tier = trip.budget?.category || "standard";

  return {
    ...trip,
    days: trip.days.map((day) => {
      if (!day.accommodation) return day;

      const destination = getDestinationById(day.destinationId);
      const base = destination?.costPerDay?.[tier]?.stay;
      if (base === undefined) return day;

      return {
        ...day,
        accommodation: {
          label: `${option.label} stay in ${destination.name}`,
          costPerPerson: Math.round(base * option.costFactor),
        },
      };
    }),
  };
}

// The travel legs that land on each day, as the planner places them: the
// leg INTO a destination on its first day, and the return leg on the last day.
function getLegsByDay(trip, transportId) {
  const startId = getStartDestinationId(trip.startingLocation);
  const result = {};

  trip.days.forEach((day, index) => {
    const previous = index === 0 ? null : trip.days[index - 1];
    const isFirstOfBlock = !previous || previous.destinationId !== day.destinationId;
    const isLast = index === trip.days.length - 1;

    result[day.id] = {
      legIn: isFirstOfBlock
        ? getRouteLeg(previous ? previous.destinationId : startId, day.destinationId, transportId)
        : null,
      legOut: isLast ? getRouteLeg(day.destinationId, startId, transportId) : null,
    };
  });

  return result;
}

const legCost = (leg) => (leg ? leg.costPerPerson : 0);

// Moves every travel leg from one transport option to another. The change is
// applied as a DIFFERENCE, so hand-entered costs keep their own baseline.
function repriceTransport(trip, fromTransport, toTransport) {
  const oldLegs = getLegsByDay(trip, fromTransport);
  const newLegs = getLegsByDay(trip, toTransport);

  return {
    ...trip,
    days: trip.days.map((day) => {
      const before = oldLegs[day.id];
      const after = newLegs[day.id];

      const delta =
        legCost(after.legIn) - legCost(before.legIn) +
        legCost(after.legOut) - legCost(before.legOut);

      const labels = [after.legIn, after.legOut]
        .filter((leg) => leg && leg.segments.length > 0)
        .map((leg) => leg.label);

      if (delta === 0 && labels.length === 0) return day;

      return {
        ...day,
        transport: {
          label:
            labels.length > 0
              ? [...labels, "Local taxis and rickshaws"].join("; ")
              : day.transport?.label,
          costPerPerson: Math.max(0, (day.transport?.costPerPerson || 0) + delta),
        },
      };
    }),
  };
}

function removeExcluded(trip, excludedKeys) {
  if (excludedKeys.size === 0) return trip;

  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      slots: Object.fromEntries(
        ACTIVITY_SLOTS.map(({ id }) => [
          id,
          (day.slots?.[id] || []).filter((item) => !excludedKeys.has(itemKey(item))),
        ])
      ),
    })),
  };
}

// ---------- Re-planning ----------

function replan(trip, scenario) {
  return generateTrip(
    {
      startingLocation: trip.startingLocation,
      destinationIds: trip.destinationIds,
      departureDate: trip.departureDate,
      returnDate: addDays(trip.departureDate, scenario.days - 1),
      adults: scenario.adults,
      children: scenario.children,
      budgetTotal: scenario.budgetTotal,
      budgetCategory: trip.budget?.category,
      interests: trip.interests,
      preferences: {
        ...trip.preferences,
        accommodation: scenario.accommodation,
        transport: scenario.transport,
        intensity: scenario.intensity,
        pace: scenario.pace,
      },
      description: trip.description,
      notes: trip.notes,
    },
    { fitBudget: false }
  );
}

// ---------- Available activities ----------

/**
 * Catalog activities at a given intensity level, for the trip's
 * destinations: { total, matching } (matching = fits the trip's interests).
 */
export function getAvailableActivities(trip, intensityId) {
  const rank = INTENSITY_OPTIONS.find((item) => item.id === intensityId)?.rank ?? 0;
  const rankOf = (id) => INTENSITY_OPTIONS.find((item) => item.id === id)?.rank ?? 0;
  const interests = trip.interests || [];

  const pool = activities.filter(
    (activity) =>
      (trip.destinationIds || []).includes(activity.destinationId) &&
      rankOf(activity.intensity) <= rank
  );

  return {
    total: pool.length,
    matching: pool.filter((activity) => interests.includes(activity.category)).length,
  };
}

// ---------- Main ----------

const COST_KEYS = [
  "transport",
  "accommodation",
  "food",
  "activities",
  "misc",
  "total",
  "perPerson",
  "remaining",
];

function listActivities(trip) {
  return trip.days.flatMap((day) =>
    ACTIVITY_SLOTS.flatMap(({ id: slot, label }) =>
      (day.slots?.[slot] || []).map((item) => ({
        key: itemKey(item),
        name: item.name,
        dayNumber: day.dayNumber,
        slotLabel: label,
        costPerPerson: item.costPerPerson || 0,
      }))
    )
  );
}

/**
 * Runs a scenario. Returns
 * {
 *   errors      { field: message }; when not empty nothing was simulated
 *   simulated   the simulated trip (or null)
 *   replanned   true when the plan was rebuilt
 *   changed     true when the scenario differs from the trip
 *   warnings    strings the UI should show
 *   before, after   getTripCosts() results
 *   deltas      after minus before, for every cost figure
 *   counts      { daysBefore, daysAfter, activitiesBefore, activitiesAfter,
 *                 availableBefore, availableAfter }
 *   activityList  activities of the plan BEFORE unticking, for the checklist:
 *                 [{ key, name, dayNumber, slotLabel, costPerPerson }]
 * }
 */
export function simulateTrip(trip, rawScenario) {
  const scenario = normalize(rawScenario);
  const errors = validateScenario(trip, scenario);
  const before = getTripCosts(trip);

  const empty = {
    errors,
    simulated: null,
    replanned: false,
    changed: hasChanges(trip, scenario),
    warnings: [],
    before,
    after: before,
    deltas: Object.fromEntries(COST_KEYS.map((key) => [key, 0])),
    counts: null,
    activityList: listActivities(trip),
  };

  if (Object.keys(errors).length > 0) return empty;

  const base = getScenarioDefaults(trip);
  const warnings = [];
  const replanned = needsReplan(trip, scenario);
  let planned;

  if (replanned) {
    try {
      planned = replan(trip, scenario);
    } catch (error) {
      return { ...empty, errors: { general: error.message } };
    }

    warnings.push(
      "Changing trip length, activity intensity or pace re-plans the itinerary with the rule-based planner. Activities are chosen again from the catalog."
    );

    const hasManualEdits =
      Boolean(trip.editedAt) ||
      trip.days.some((day) =>
        ACTIVITY_SLOTS.some(({ id }) => (day.slots?.[id] || []).some((item) => !item.activityId))
      );
    if (hasManualEdits) {
      warnings.push(
        "This trip has manual edits. A re-planned itinerary does not keep them."
      );
    }
  } else {
    planned = clone(trip);

    planned.budget = { ...planned.budget, total: scenario.budgetTotal };
    planned.travelers = { adults: scenario.adults, children: scenario.children };
    planned.preferences = {
      ...planned.preferences,
      accommodation: scenario.accommodation,
      transport: scenario.transport,
    };

    if (scenario.accommodation !== base.accommodation) {
      planned = repriceAccommodation(planned, scenario.accommodation);
    }
    if (scenario.transport !== base.transport) {
      planned = repriceTransport(planned, base.transport, scenario.transport);
    }
  }

  const activityList = listActivities(planned);
  const simulated = removeExcluded(planned, new Set(scenario.excluded));
  const after = getTripCosts(simulated);

  return {
    errors: {},
    simulated,
    replanned,
    changed: hasChanges(trip, scenario),
    warnings,
    before,
    after,
    deltas: Object.fromEntries(COST_KEYS.map((key) => [key, after[key] - before[key]])),
    counts: {
      daysBefore: trip.days.length,
      daysAfter: simulated.days.length,
      activitiesBefore: getActivityCount(trip),
      activitiesAfter: getActivityCount(simulated),
      availableBefore: getAvailableActivities(trip, base.intensity),
      availableAfter: getAvailableActivities(trip, scenario.intensity),
    },
    activityList,
  };
}

/**
 * Turns a simulated trip into data for a NEW saved trip (useTrips().addTrip
 * sets the new id, owner and creation time).
 *
 *  - The title gets a " (what-if)" suffix, never doubled
 *  - The new trip starts unsaved and without an "edited" mark
 *  - Generation notes are replaced by one honest line about where it came from
 *  - The original trip is not touched
 */
export function toNewTripData(original, simulated) {
  const base = original.title.replace(/\s*\(what-if\)$/i, "");
  const data = clone(simulated);

  delete data.id;
  delete data.userId;
  delete data.createdAt;
  delete data.editedAt;

  return {
    ...data,
    title: `${base.slice(0, 90)} (what-if)`,
    saved: false,
    generationNotes: [
      `Created from a what-if simulation of "${original.title}". All figures are simulated estimates from sample data.`,
    ],
  };
}