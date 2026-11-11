// ==========================================================================
// TripSathi – Admin statistics (pure functions)
//
// Counts and groupings for the admin overview. Everything is derived from
// the same lists the rest of the app uses, so the numbers always agree.
// ==========================================================================

import { INTERESTS } from "../data/destinations";

const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);
const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" });

const byValueThenName = (a, b) => b.value - a.value || a.name.localeCompare(b.name);

/** Trips created in each of the last `months` calendar months, oldest first. */
export function getTripsPerMonth(trips, months = 6, now = new Date()) {
  const buckets = [];

  for (let back = months - 1; back >= 0; back -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - back, 1);
    buckets.push({
      year: start.getFullYear(),
      month: start.getMonth(),
      name: monthFormatter.format(start),
      value: 0,
    });
  }

  trips.forEach((trip) => {
    const created = new Date(trip.createdAt);
    if (Number.isNaN(created.getTime())) return;

    const bucket = buckets.find(
      (item) => item.year === created.getFullYear() && item.month === created.getMonth()
    );
    if (bucket) bucket.value += 1;
  });

  return buckets.map(({ name, value }) => ({ name, value }));
}

/** Trips per budget level. All three levels are always listed. */
export function getBudgetLevelCounts(trips) {
  return Object.entries(TIER_LABELS).map(([id, name]) => ({
    name,
    value: trips.filter((trip) => trip.budget?.category === id).length,
  }));
}

/** Catalog activities per type, largest group first. */
export function getActivitiesByType(activities) {
  const counts = {};
  activities.forEach((activity) => {
    counts[activity.category] = (counts[activity.category] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([id, value]) => ({ name: INTEREST_LABELS[id] || id, value }))
    .sort(byValueThenName);
}

/** The destinations that appear in the most trips. */
export function getMostPlannedDestinations(trips, getName, limit = 5) {
  const counts = {};
  trips.forEach((trip) => {
    (trip.destinationIds || []).forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([id, value]) => ({ name: getName(id), value }))
    .sort(byValueThenName)
    .slice(0, limit);
}

export function getRecentUsers(users, limit = 5) {
  return [...users]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

/**
 * A feed of what happened recently, newest first, built from account and
 * trip creation dates: [{ id, type: "user" | "trip", time, text }].
 */
export function getRecentActivity(users, trips, limit = 8) {
  const nameOf = new Map(users.map((user) => [user.id, user.fullName]));

  const events = [
    ...users.map((user) => ({
      id: `user-${user.id}`,
      type: "user",
      time: user.createdAt,
      text: `${user.fullName} joined TripSathi`,
    })),
    ...trips.map((trip) => ({
      id: `trip-${trip.id}`,
      type: "trip",
      time: trip.createdAt,
      text: `${nameOf.get(trip.userId) || "A deleted account"} created the trip "${trip.title}"`,
    })),
  ];

  return events
    .filter((event) => !Number.isNaN(new Date(event.time).getTime()))
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, limit);
}