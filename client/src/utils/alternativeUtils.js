// ==========================================================================
// TripSathi – Alternative suggestions (rule-based, calculated from data)
//
// For a trip, finds:
//   activities     cheaper swaps for paid activities, plus more things that
//                  match the traveller's interests
//   attractions    other well-known places in the chosen destinations
//   destinations   similar places that are cheaper per day or closer to
//                  the starting city
//   accommodation  cheaper stay types, with the saving for this trip
//
// Every suggestion carries a plain-language `reason`. Savings use the same
// cost model as the rest of the app (getPayingUnits), so they match the
// budget breakdown. All amounts are sample estimates.
// ==========================================================================

import activities, {
  getActivitiesByDestination,
  getActivityById,
} from "../data/activities";
import destinations, {
  INTERESTS,
  getDailyCost,
  getDestinationById,
} from "../data/destinations";
import {
  ACCOMMODATION_OPTIONS,
  INTENSITY_OPTIONS,
} from "../data/tripOptions";
import { formatCurrency } from "./formatCurrency";
import {
  formatTravelTime,
  getRouteLeg,
  getStartDestinationId,
} from "./routeUtils";
import { getDayActivities, getPayingUnits } from "./tripUtils";

export const ALTERNATIVES_DISCLAIMER =
  "Suggestions and savings are calculated from sample estimates.";

const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);

const MAX_PER_GROUP = { swaps: 4, explore: 4, destinations: 3, stays: 2 };
const MIN_DAILY_SAVING_RATE = 0.1; // a destination must be 10% cheaper per day...
const MIN_HOURS_SAVED = 1; // ...or at least 1 hour closer
const TRAVEL_HOURS_MARGIN = 2; // and not much farther than the current plan
const TRAVEL_COST_RATIO = 1.5; // nor much dearer to reach

const rankOf = (intensityId) =>
  INTENSITY_OPTIONS.find((item) => item.id === intensityId)?.rank ?? 0;

const average = (numbers) =>
  numbers.length > 0
    ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
    : 0;

// ---------- Activities ----------

function findCheaperSwaps(trip, units, maxRank, usedIds) {
  const interests = trip.interests || [];
  const seen = new Set();
  const swaps = [];

  getDaysActivities(trip).forEach((item) => {
    if (item.costPerPerson <= 0 || seen.has(item.activityId)) return;
    seen.add(item.activityId);

    const original = getActivityById(item.activityId);
    if (!original) return;

    const candidates = getActivitiesByDestination(original.destinationId).filter(
      (candidate) =>
        !usedIds.has(candidate.id) &&
        rankOf(candidate.intensity) <= maxRank &&
        candidate.costPerPerson < item.costPerPerson
    );
    if (candidates.length === 0) return;

    // Prefer the same kind of activity, then one matching an interest, then
    // the one closest in value (so we do not just suggest "do nothing").
    const score = (candidate) =>
      (candidate.category === original.category ? 2 : 0) +
      (interests.includes(candidate.category) ? 1 : 0);

    const best = [...candidates].sort(
      (a, b) => score(b) - score(a) || b.costPerPerson - a.costPerPerson
    )[0];

    const savingPerPerson = item.costPerPerson - best.costPerPerson;
    swaps.push({
      id: `swap-${item.activityId}-${best.id}`,
      title: best.name,
      replaces: item.name,
      description: best.description,
      costPerPerson: best.costPerPerson,
      savingTotal: Math.round(savingPerPerson * units),
      reason:
        best.costPerPerson === 0
          ? `Free instead of ${formatCurrency(item.costPerPerson)} per person. Saves about ${formatCurrency(
              Math.round(savingPerPerson * units)
            )} for your group.`
          : `Costs ${formatCurrency(best.costPerPerson)} instead of ${formatCurrency(
              item.costPerPerson
            )} per person. Saves about ${formatCurrency(
              Math.round(savingPerPerson * units)
            )} for your group.`,
    });
  });

  return swaps
    .sort((a, b) => b.savingTotal - a.savingTotal)
    .slice(0, MAX_PER_GROUP.swaps);
}

function getDaysActivities(trip) {
  return (trip.days || []).flatMap(getDayActivities);
}

function findMoreToExplore(trip, maxRank, usedIds, excludeIds) {
  const interests = trip.interests || [];
  const destinationIds = trip.destinationIds || [];

  return activities
    .filter(
      (activity) =>
        destinationIds.includes(activity.destinationId) &&
        !usedIds.has(activity.id) &&
        !excludeIds.has(activity.id) &&
        rankOf(activity.intensity) <= maxRank &&
        interests.includes(activity.category)
    )
    .sort((a, b) => a.costPerPerson - b.costPerPerson || a.name.localeCompare(b.name))
    .slice(0, MAX_PER_GROUP.explore)
    .map((activity) => {
      const destinationName = getDestinationById(activity.destinationId)?.name;
      const interestLabel = INTEREST_LABELS[activity.category] || activity.category;

      return {
        id: `explore-${activity.id}`,
        title: activity.name,
        description: activity.description,
        costPerPerson: activity.costPerPerson,
        reason: `Matches your interest in ${interestLabel.toLowerCase()} in ${destinationName}. ${
          activity.costPerPerson === 0
            ? "Free."
            : `About ${formatCurrency(activity.costPerPerson)} per person.`
        }`,
      };
    });
}

// ---------- Attractions ----------

function listAttractions(trip) {
  return (trip.destinationIds || [])
    .map(getDestinationById)
    .filter(Boolean)
    .map((destination) => ({
      id: `attractions-${destination.id}`,
      destinationName: destination.name,
      places: destination.highlights,
    }));
}

// ---------- Destinations ----------

function findSimilarDestinations(trip) {
  const tripIds = trip.destinationIds || [];
  const tier = trip.budget?.category || "standard";
  const transport = trip.preferences?.transport || "tourist-bus";
  const interests = trip.interests || [];
  const startId = getStartDestinationId(trip.startingLocation);

  if (tripIds.length === 0) return [];

  const tripDestinations = tripIds.map(getDestinationById).filter(Boolean);
  const averageDaily = average(tripDestinations.map((item) => getDailyCost(item, tier)));

  const tripLegs = tripIds.map((id) => getRouteLeg(startId, id, transport));
  const averageHours = average(tripLegs.map((leg) => leg.hours));
  const averageLegCost = average(tripLegs.map((leg) => leg.costPerPerson));

  return destinations
    .filter((candidate) => !tripIds.includes(candidate.id) && candidate.id !== startId)
    .map((candidate) => {
      const shared = candidate.interests.filter((id) => interests.includes(id));
      const leg = getRouteLeg(startId, candidate.id, transport);
      return { candidate, shared, leg };
    })
    .filter(({ shared, leg }) => {
      if (leg.segments.length === 0) return false; // no known route
      if (interests.length > 0 && shared.length === 0) return false;
      if (leg.hours > averageHours + TRAVEL_HOURS_MARGIN) return false;
      return leg.costPerPerson <= averageLegCost * TRAVEL_COST_RATIO;
    })
    .map(({ candidate, shared, leg }) => ({
      candidate,
      shared,
      leg,
      dailySaving: Math.round(averageDaily - getDailyCost(candidate, tier)),
      hoursSaved: Math.round((averageHours - leg.hours) * 2) / 2,
    }))
    .filter(
      ({ dailySaving, hoursSaved }) =>
        dailySaving >= averageDaily * MIN_DAILY_SAVING_RATE ||
        hoursSaved >= MIN_HOURS_SAVED
    )
    .sort(
      (a, b) =>
        b.shared.length - a.shared.length ||
        b.hoursSaved - a.hoursSaved ||
        b.dailySaving - a.dailySaving
    )
    .slice(0, MAX_PER_GROUP.destinations)
    .map(({ candidate, shared, leg, dailySaving, hoursSaved }) => {
      const parts = [];

      if (hoursSaved >= MIN_HOURS_SAVED) {
        parts.push(`about ${formatTravelTime(hoursSaved)} less travel from your starting city`);
      }
      parts.push(
        dailySaving > 0
          ? `about ${formatCurrency(dailySaving)} less per person per day`
          : dailySaving < 0
            ? `about ${formatCurrency(Math.abs(dailySaving))} more per person per day`
            : "a similar daily cost"
      );

      const reason = `${parts[0][0].toUpperCase()}${parts[0].slice(1)}${
        parts.length > 1 ? `, ${parts.slice(1).join(", ")}` : ""
      }.`;

      return {
        id: `dest-${candidate.id}`,
        destinationId: candidate.id,
        title: candidate.name,
        description: candidate.tagline,
        interests: shared.map((id) => INTEREST_LABELS[id] || id),
        travelHours: leg.hours,
        reason,
      };
    });
}

// ---------- Accommodation ----------

function findCheaperStays(trip, units) {
  const tier = trip.budget?.category || "standard";
  const nights = (trip.days || []).filter((day) => day.accommodation);
  if (nights.length === 0) return [];

  const currentTotal = nights.reduce(
    (sum, day) => sum + day.accommodation.costPerPerson,
    0
  );

  return ACCOMMODATION_OPTIONS.map((option) => {
    const optionTotal = nights.reduce((sum, day) => {
      const base = getDestinationById(day.destinationId)?.costPerDay?.[tier]?.stay || 0;
      return sum + Math.round(base * option.costFactor);
    }, 0);

    return { option, savingTotal: Math.round((currentTotal - optionTotal) * units) };
  })
    .filter(({ savingTotal }) => savingTotal > 0)
    .sort((a, b) => b.savingTotal - a.savingTotal)
    .slice(0, MAX_PER_GROUP.stays)
    .map(({ option, savingTotal }) => ({
      id: `stay-${option.id}`,
      title: option.label,
      description: option.description,
      savingTotal,
      reason: `Saves about ${formatCurrency(savingTotal)} over ${nights.length} ${
        nights.length === 1 ? "night" : "nights"
      } for your group.`,
    }));
}

// ---------- Main ----------

/**
 * Returns { activities: { swaps[], explore[] }, attractions[],
 *           destinations[], accommodation[] }.
 * Any group can be empty, and the UI shows only the groups that have items.
 */
export function getAlternatives(trip) {
  const units = getPayingUnits(trip);
  const maxRank = rankOf(trip.preferences?.intensity);
  const usedIds = new Set(getDaysActivities(trip).map((item) => item.activityId));

    const swaps = findCheaperSwaps(trip, units, maxRank, usedIds);
  return {
    activities: {
      swaps,
      explore: findMoreToExplore(trip, maxRank, usedIds, new Set()),
    },
    attractions: listAttractions(trip),
    destinations: findSimilarDestinations(trip),
    accommodation: findCheaperStays(trip, units),
  };
}