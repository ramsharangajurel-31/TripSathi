// ==========================================================================
// TripSathi – Itinerary comparison
//
// Compares two trips on cost, duration, activities, travel intensity and
// destinations. Costs come from getTripCosts(), so they always match every
// other page.
//
// DERIVED "TRAVEL INTENSITY" (my own simple rule, shown on screen):
//   activities per day = planned activities / trip days
//   up to 1.25 -> Relaxed, up to 2.25 -> Balanced, above -> Packed
// "Hardest activity" is the highest difficulty among the catalog activities
// in the plan. Custom activities have no difficulty rating and are ignored.
// ==========================================================================

import { getActivityById } from "../data/activities";
import { getDestinationById } from "../data/destinations";
import {
  ACCOMMODATION_OPTIONS,
  INTENSITY_OPTIONS,
  TRANSPORT_OPTIONS,
  getOptionLabel,
} from "../data/tripOptions";
import { formatCurrency } from "./formatCurrency";
import { formatDateRange } from "./formatDate";
import { formatTravelTime, getStartDestinationId, getTripRoute } from "./routeUtils";
import {
  getActivityCount,
  getDayActivities,
  getDurationDays,
  getHeadcount,
  getTripCosts,
} from "./tripUtils";

export const PACE_RELAXED_MAX = 1.25;
export const PACE_BALANCED_MAX = 2.25;

export const INTENSITY_RULE_TEXT = `Travel intensity is worked out from activities per day: up to ${PACE_RELAXED_MAX} is Relaxed, up to ${PACE_BALANCED_MAX} is Balanced, above that is Packed. Hardest activity is the highest difficulty among catalog activities in the plan.`;

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };

const rankOf = (id) => INTENSITY_OPTIONS.find((item) => item.id === id)?.rank ?? -1;

function getPaceLabel(perDay) {
  if (perDay <= PACE_RELAXED_MAX) return "Relaxed";
  if (perDay <= PACE_BALANCED_MAX) return "Balanced";
  return "Packed";
}

function getHardestIntensity(trip) {
  let hardest = -1;

  (trip.days || []).forEach((day) => {
    getDayActivities(day).forEach((item) => {
      const activity = item.activityId ? getActivityById(item.activityId) : null;
      if (activity) hardest = Math.max(hardest, rankOf(activity.intensity));
    });
  });

  return hardest === -1 ? null : INTENSITY_OPTIONS.find((item) => item.rank === hardest).label;
}

/** Everything the comparison needs to know about one trip. */
export function getTripMetrics(trip) {
  const costs = getTripCosts(trip);
  const duration = getDurationDays(trip.departureDate, trip.returnDate);
  const planDays = (trip.days || []).length || duration;
  const activityCount = getActivityCount(trip);
  const perDay = activityCount / planDays;

  const transport = trip.preferences?.transport || "tourist-bus";
  const route = getTripRoute(
    getStartDestinationId(trip.startingLocation),
    trip.destinationIds || [],
    transport
  );

  return {
    trip,
    costs,
    duration,
    headcount: getHeadcount(trip),
    destinations: (trip.destinationIds || [])
      .map((id) => getDestinationById(id)?.name)
      .filter(Boolean),
    activityCount,
    perDay,
    paceLabel: getPaceLabel(perDay),
    hardest: getHardestIntensity(trip),
    travelHours: route.totalHours,
  };
}

// ---------- Rows ----------

// "a" or "b" for the trip with the smaller (or larger) value; null on a tie.
function pick(valueA, valueB, lowerIsBetter) {
  if (valueA === valueB) return null;
  const aWins = lowerIsBetter ? valueA < valueB : valueA > valueB;
  return aWins ? "a" : "b";
}

const describeTravelers = (trip) => {
  const adults = trip.travelers?.adults || 0;
  const children = trip.travelers?.children || 0;
  const count = adults + children;
  return children > 0
    ? `${count} (${adults} ${adults === 1 ? "adult" : "adults"}, ${children} ${
        children === 1 ? "child" : "children"
      })`
    : `${count} ${count === 1 ? "adult" : "adults"}`;
};

const optionText = (options, id) => (id ? getOptionLabel(options, id) : "—");

function describeRemaining(costs) {
  return costs.isOverBudget
    ? `Over by ${formatCurrency(costs.overBy)}`
    : formatCurrency(costs.remaining);
}

/**
 * Compares two trips. Returns
 * {
 *   a, b            metrics of each trip
 *   groups          [{ title, rows: [{ key, label, a, b, better, tag }] }]
 *                   better is "a", "b" or null; tag is "Lower" or "Higher"
 *   insights        plain-language sentences
 * }
 */
export function compareTrips(tripA, tripB) {
  const a = getTripMetrics(tripA);
  const b = getTripMetrics(tripB);

  const row = (key, label, valueA, valueB, better = null, tag = "") => ({
    key,
    label,
    a: valueA,
    b: valueB,
    better,
    tag: better ? tag : "",
  });

  const money = (key, label, getValue, judged = true) =>
    row(
      key,
      label,
      formatCurrency(getValue(a)),
      formatCurrency(getValue(b)),
      judged ? pick(getValue(a), getValue(b), true) : null,
      "Lower"
    );

  const groups = [
    {
      title: "Overview",
      rows: [
        row("destinations", "Major destinations", a.destinations.join(" → ") || "—", b.destinations.join(" → ") || "—"),
        row(
          "dates",
          "Travel dates",
          formatDateRange(tripA.departureDate, tripA.returnDate),
          formatDateRange(tripB.departureDate, tripB.returnDate)
        ),
        row(
          "duration",
          "Trip duration",
          `${a.duration} ${a.duration === 1 ? "day" : "days"}`,
          `${b.duration} ${b.duration === 1 ? "day" : "days"}`
        ),
        row("travelers", "Travelers", describeTravelers(tripA), describeTravelers(tripB)),
      ],
    },
    {
      title: "Cost",
      rows: [
        money("total", "Total estimated cost", (m) => m.costs.total),
        money("perPerson", "Cost per person", (m) => m.costs.perPerson),
        money("transport", "Transportation", (m) => m.costs.transport),
        money("accommodation", "Accommodation", (m) => m.costs.accommodation),
        money("food", "Food", (m) => m.costs.food),
        money("activities", "Activities", (m) => m.costs.activities),
        money("misc", "Miscellaneous", (m) => m.costs.misc, false),
        money("budget", "Your budget", (m) => m.trip.budget?.total || 0, false),
        row(
          "remaining",
          "Remaining budget",
          describeRemaining(a.costs),
          describeRemaining(b.costs),
          pick(a.costs.remaining, b.costs.remaining, false),
          "Higher"
        ),
      ],
    },
    {
      title: "Plan",
      rows: [
        row("activityCount", "Activities planned", String(a.activityCount), String(b.activityCount)),
        row(
          "perDay",
          "Activities per day",
          String(Number(a.perDay.toFixed(2))),
          String(Number(b.perDay.toFixed(2)))
        ),
        row("pace", "Travel intensity", a.paceLabel, b.paceLabel),
        row("hardest", "Hardest activity", a.hardest || "Not rated", b.hardest || "Not rated"),
        row(
          "travelTime",
          "Travel time between cities",
          formatTravelTime(a.travelHours),
          formatTravelTime(b.travelHours)
        ),
        row(
          "stay",
          "Accommodation type",
          optionText(ACCOMMODATION_OPTIONS, tripA.preferences?.accommodation),
          optionText(ACCOMMODATION_OPTIONS, tripB.preferences?.accommodation)
        ),
        row(
          "transportType",
          "Transport",
          optionText(TRANSPORT_OPTIONS, tripA.preferences?.transport),
          optionText(TRANSPORT_OPTIONS, tripB.preferences?.transport)
        ),
        row(
          "level",
          "Budget level",
          TIER_LABELS[tripA.budget?.category] || "—",
          TIER_LABELS[tripB.budget?.category] || "—"
        ),
      ],
    },
  ];

  return { a, b, groups, insights: getInsights(a, b) };
}

// ---------- Plain-language summary ----------

function getInsights(a, b) {
  const insights = [];
  const nameOf = (metrics) => `"${metrics.trip.title}"`;
  const pluralDays = (count) => `${count} ${count === 1 ? "day" : "days"}`;

  // Cost: the total can mislead when the groups differ in size.
  const totalWinner = pick(a.costs.total, b.costs.total, true);
  const personWinner = pick(a.costs.perPerson, b.costs.perPerson, true);
  const metricsOf = { a, b };

  if (totalWinner) {
    const cheaper = metricsOf[totalWinner];
    const dearer = metricsOf[totalWinner === "a" ? "b" : "a"];
    const totalGap = formatCurrency(dearer.costs.total - cheaper.costs.total);

    if (personWinner === totalWinner) {
      const personGap = formatCurrency(dearer.costs.perPerson - cheaper.costs.perPerson);
      insights.push(
        `${nameOf(cheaper)} costs ${totalGap} less in total and ${personGap} less per person.`
      );
    } else if (personWinner) {
      insights.push(
        `${nameOf(cheaper)} costs less in total, but ${nameOf(
          metricsOf[personWinner]
        )} costs less per person, because the groups are different sizes.`
      );
    } else {
      insights.push(`${nameOf(cheaper)} costs ${totalGap} less in total, with the same cost per person.`);
    }
  } else {
    insights.push("Both trips have the same estimated total cost.");
  }

  // Duration
  if (a.duration !== b.duration) {
    const longer = a.duration > b.duration ? a : b;
    insights.push(
      `${nameOf(longer)} is ${pluralDays(Math.abs(a.duration - b.duration))} longer.`
    );
  }

  // Budget fit
  if (a.costs.isOverBudget !== b.costs.isOverBudget) {
    const over = a.costs.isOverBudget ? a : b;
    const within = over === a ? b : a;
    insights.push(
      `${nameOf(over)} is over its budget by ${formatCurrency(over.costs.overBy)}, while ${nameOf(
        within
      )} is within its budget.`
    );
  } else if (a.costs.isOverBudget && b.costs.isOverBudget) {
    insights.push("Both trips are estimated to cost more than their budgets.");
  }

  // Activities
  if (a.activityCount !== b.activityCount) {
    const busier = a.activityCount > b.activityCount ? a : b;
    const gap = Math.abs(a.activityCount - b.activityCount);
    insights.push(
      `${nameOf(busier)} has ${gap} more planned ${gap === 1 ? "activity" : "activities"}.`
    );
  }

  // Travel time (only when the difference is noticeable)
  const hoursGap = Math.abs(a.travelHours - b.travelHours);
  if (hoursGap >= 1) {
    const longerTravel = a.travelHours > b.travelHours ? a : b;
    insights.push(
      `${nameOf(longerTravel)} involves about ${formatTravelTime(hoursGap)} more travel between cities.`
    );
  }

  return insights;
}