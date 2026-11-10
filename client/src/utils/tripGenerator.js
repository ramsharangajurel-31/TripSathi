// ==========================================================================
// TripSathi – Rule-based itinerary generator (NO AI)
//
// Turns the wizard's answers into a complete trip: ordered destinations, a
// day-by-day plan with activities, and per-day costs. The result has the
// same shape as the sample trips (data/sampleTrips.js), so every page and
// calculation works on it unchanged.
//
// RULES (deterministic: the same input always gives the same itinerary)
//  1. Destinations are ordered as a nearest-neighbour route from the start.
//  2. Days are shared between destinations in proportion to each one's
//     recommended days (every destination gets at least one day).
//  3. Days with travel (arriving / returning) have fewer activity slots.
//  4. Activities above the chosen intensity are excluded. The rest are
//     ranked by matching interests, then lower cost.
//  5. If the estimate is over budget, the most expensive activities are
//     removed one by one until it fits. If it still does not fit, a note
//     says so.
//
// Everything is a sample estimate. Real AI optimisation comes later, in the
// backend phase, behind the same function signature.
// ==========================================================================

import { ACTIVITY_SLOTS, getActivitiesByDestination } from "../data/activities";
import { getDestinationById } from "../data/destinations";
import {
  ACCOMMODATION_OPTIONS,
  DEFAULT_PREFERENCES,
  INTENSITY_OPTIONS,
  PACE_OPTIONS,
  TRIP_LIMITS,
} from "../data/tripOptions";
import { formatCurrency } from "./formatCurrency";
import {
  getPlaceName,
  getRouteLeg,
  getStartDestinationId,
  orderDestinations,
} from "./routeUtils";
import { getDurationDays, getTripCosts } from "./tripUtils";

const MAX_HOURS_PER_DAY = 9;
const REMOTE_DESTINATIONS = ["mustang", "ghandruk", "everest-region"];
const HIGH_ALTITUDE_METRES = 2500;

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };

// ---------- Small helpers used by the wizard ----------

/** Each chosen destination needs at least one day. */
export const getMinimumTripDays = (destinationCount) =>
  Math.max(1, destinationCount);

/** Sum of the destinations' recommended days, capped at the trip limit. */
export function getSuggestedDays(destinationIds = []) {
  const total = destinationIds.reduce(
    (sum, id) => sum + (getDestinationById(id)?.recommendedDays || 0),
    0
  );
  return Math.min(Math.max(total, 1), TRIP_LIMITS.maxDays);
}

// ---------- Day allocation ----------

// Shares `totalDays` between destinations (largest-remainder method).
function allocateDays(destinations, totalDays) {
  const count = destinations.length;
  const extra = totalDays - count;
  const weightTotal = destinations.reduce((sum, item) => sum + item.recommendedDays, 0);

  const quotas = destinations.map((item) => (extra * item.recommendedDays) / weightTotal);
  const allocation = quotas.map((quota) => Math.floor(quota));
  let leftover = extra - allocation.reduce((sum, value) => sum + value, 0);

  quotas
    .map((quota, index) => ({ index, fraction: quota - Math.floor(quota) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
    .forEach(({ index }) => {
      if (leftover > 0) {
        allocation[index] += 1;
        leftover -= 1;
      }
    });

  return allocation.map((value) => value + 1);
}

// ---------- Activity selection ----------

function rankActivities(destinationId, interests, maxIntensityRank) {
  const rankOf = (id) => INTENSITY_OPTIONS.find((item) => item.id === id)?.rank ?? 0;

  return getActivitiesByDestination(destinationId)
    .filter((activity) => rankOf(activity.intensity) <= maxIntensityRank)
    .map((activity) => ({
      activity,
      matches: interests.includes(activity.category),
    }))
    .sort(
      (a, b) =>
        Number(b.matches) - Number(a.matches) ||
        a.activity.costPerPerson - b.activity.costPerPerson ||
        a.activity.name.localeCompare(b.activity.name)
    );
}

// Which slots a day can use, and how many activities fit.
function getDayCapacity(perDay, arrives, departs) {
  let slots = ACTIVITY_SLOTS.map((slot) => slot.id);
  let capacity = perDay;

  if (arrives && departs) {
    return { slots: ["afternoon"], capacity: Math.min(1, perDay) };
  }
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

function toItem(activity, tripKey, dayNumber, slot, index) {
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

// ---------- Main function ----------

/**
 * Builds a trip from the wizard's values.
 *
 * input: {
 *   startingLocation, destinationIds[], departureDate, returnDate,
 *   adults, children, budgetTotal, budgetCategory, interests[],
 *   preferences: { accommodation, transport, intensity, pace, special },
 *   description, notes
 * }
 *
 * Returns a trip WITHOUT id, userId, createdAt and saved: useTrips.addTrip()
 * adds those. `generationNotes` lists what the generator decided, so the
 * results page can explain it.
 *
 * Throws an Error with a readable message when the input cannot form a trip
 * (the wizard validates first, so this is a safety net).
 */
export function generateTrip(input, { fitBudget = true } = {}) {
const preferences = { ...DEFAULT_PREFERENCES, ...(input.preferences || {}) };
  const interests = input.interests || [];
  const notes = [];

  const chosenIds = [...new Set(input.destinationIds || [])].filter((id) =>
    getDestinationById(id)
  );
  if (chosenIds.length === 0) throw new Error("Choose at least one destination.");

  const totalDays = getDurationDays(input.departureDate, input.returnDate);
  if (totalDays < getMinimumTripDays(chosenIds.length)) {
    throw new Error(
      `A trip with ${chosenIds.length} destinations needs at least ${chosenIds.length} days.`
    );
  }

  const tier = ["budget", "standard", "premium"].includes(input.budgetCategory)
    ? input.budgetCategory
    : "standard";
  const accommodation =
    ACCOMMODATION_OPTIONS.find((item) => item.id === preferences.accommodation) ||
    ACCOMMODATION_OPTIONS.find((item) => item.id === DEFAULT_PREFERENCES.accommodation);
  const pace =
    PACE_OPTIONS.find((item) => item.id === preferences.pace) ||
    PACE_OPTIONS.find((item) => item.id === DEFAULT_PREFERENCES.pace);
  const maxIntensityRank =
    INTENSITY_OPTIONS.find((item) => item.id === preferences.intensity)?.rank ?? 1;

  const startId = getStartDestinationId(input.startingLocation);
  const orderedIds = orderDestinations(startId, chosenIds, preferences.transport);
  const destinations = orderedIds.map((id) => getDestinationById(id));
  const allocation = allocateDays(destinations, totalDays);

  const tripKey = `gen-${Date.now().toString(36)}`;
  const returnLeg = getRouteLeg(
    orderedIds[orderedIds.length - 1],
    startId,
    preferences.transport
  );

  // ----- Build the days -----
  const days = [];
  let dayNumber = 0;

  destinations.forEach((destination, blockIndex) => {
    const previousId = blockIndex === 0 ? startId : orderedIds[blockIndex - 1];
    const legIn = getRouteLeg(previousId, destination.id, preferences.transport);
    const ranked = rankActivities(destination.id, interests, maxIntensityRank);
    const used = new Set();

    if (ranked.length > 0 && !ranked.some((item) => item.matches)) {
      notes.push(
        `No ${destination.name} activities match your selected interests, so general activities were chosen.`
      );
    }

    for (let offset = 0; offset < allocation[blockIndex]; offset += 1) {
      dayNumber += 1;

      const isFirstOfBlock = offset === 0;
      const isLastDay = dayNumber === totalDays;
      const arrives = isFirstOfBlock && legIn.segments.length > 0;
      const departs = isLastDay && returnLeg.segments.length > 0;

      const { slots: allowedSlots, capacity } = getDayCapacity(
        pace.activitiesPerDay,
        arrives,
        departs
      );

      // Place activities: first into their best time of day, then anywhere.
      const placed = { morning: [], afternoon: [], evening: [] };
      let placedCount = 0;
      let hoursUsed = 0;

      const place = (exactSlotOnly) => {
        ranked.forEach(({ activity }) => {
          if (placedCount >= capacity || used.has(activity.id)) return;
          if (hoursUsed + activity.durationHours > MAX_HOURS_PER_DAY) return;

          const bestSlotFree =
            allowedSlots.includes(activity.bestTime) &&
            placed[activity.bestTime].length === 0;

          let slot = null;
          if (bestSlotFree) {
            slot = activity.bestTime;
          } else if (!exactSlotOnly) {
            slot = allowedSlots.find((id) => placed[id].length === 0) || null;
          }
          if (!slot) return;

          placed[slot].push(
            toItem(activity, tripKey, dayNumber, slot, placed[slot].length)
          );
          used.add(activity.id);
          placedCount += 1;
          hoursUsed += activity.durationHours;
        });
      };

      place(true);
      place(false);

      // ----- Costs for this day (per person) -----
      const costs = destination.costPerDay[tier];
      const legCost =
        (isFirstOfBlock ? legIn.costPerPerson : 0) +
        (departs ? returnLeg.costPerPerson : 0);

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
        title = firstActivity
          ? `${firstActivity.name} and return`
          : `Return to ${getPlaceName(startId)}`;
      }

      days.push({
        id: `${tripKey}-d${dayNumber}`,
        dayNumber,
        destinationId: destination.id,
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
        food: {
          label: "Local restaurants",
          costPerPerson: Math.round(costs.food * (departs ? 0.5 : 1)),
        },
        slots: placed,
        notes: "",
      });
    }
  });

  // ----- Assemble the trip -----
  const names = destinations.map((item) => item.name);
  const trip = {
    title: `${totalDays}-day ${names.join(" and ")} trip`,
    destinationIds: orderedIds,
    startingLocation: input.startingLocation,
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    travelers: {
      adults: Number(input.adults) || 1,
      children: Number(input.children) || 0,
    },
    budget: { total: Number(input.budgetTotal) || 0, category: tier },
    interests,
    preferences,
    description: input.description || "",
    notes: input.notes || "",
    days,
    generationNotes: notes,
  };

  // ----- Fit the budget by removing the costliest activities -----
  let costs = getTripCosts(trip);
  const removed = [];

    // fitBudget is false for what-if simulations, which must never remove
  // activities by themselves. (Their generationNotes are not shown.)
  while (fitBudget && costs.isOverBudget) {
    let target = null;

    trip.days.forEach((day) => {
      ACTIVITY_SLOTS.forEach(({ id: slot }) => {
        day.slots[slot].forEach((item) => {
          if (
            item.costPerPerson > 0 &&
            (!target || item.costPerPerson > target.item.costPerPerson)
          ) {
            target = { day, slot, item };
          }
        });
      });
    });

    if (!target) break;

    target.day.slots[target.slot] = target.day.slots[target.slot].filter(
      (item) => item.id !== target.item.id
    );
    removed.push(target.item.name);
    costs = getTripCosts(trip);
  }

  if (removed.length > 0) {
    notes.push(
      `To stay near your budget, these activities were left out: ${removed.join(", ")}. You can add them back by editing the itinerary.`
    );
  }

  if (costs.isOverBudget) {
    notes.push(
      `Even without optional paid activities, the estimate is ${formatCurrency(costs.overBy)} above your budget. Consider a lower accommodation level, fewer days or a cheaper transport option.`
    );
  } else if (trip.budget.total > 0 && costs.remaining > trip.budget.total * 0.25) {
    notes.push(
      `About ${formatCurrency(costs.remaining)} of your budget is unused. You could choose a higher accommodation level or add more activities.`
    );
  }

  if (orderedIds.some((id) => REMOTE_DESTINATIONS.includes(id))) {
    notes.push(
      "Trekking permits, guides and porters for remote regions are not included in these estimates."
    );
  }

  if (destinations.some((item) => item.altitudeM >= HIGH_ALTITUDE_METRES)) {
    notes.push(
      "This trip includes high-altitude areas. Allow time to acclimatise and check conditions before you travel."
    );
  }

  return trip;
}