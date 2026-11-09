import destinations, { INTERESTS } from "../data/destinations";

const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);

/**
 * Suggests destinations the user has not planned yet.
 *
 * Rule (rule-based, no AI): collect the interests from all of the user's
 * trips, count how many of each candidate destination's interests match, and
 * rank by matches, then by rating. A user with no trips simply gets the
 * highest-rated destinations.
 *
 * Returns [{ destination, matchedInterests: ["Nature", ...] }]
 */
export function getRecommendedDestinations(trips = [], limit = 3) {
  const plannedIds = new Set(trips.flatMap((trip) => trip.destinationIds || []));
  const userInterests = new Set(trips.flatMap((trip) => trip.interests || []));

  return destinations
    .filter((destination) => !plannedIds.has(destination.id))
    .map((destination) => ({
      destination,
      matched: destination.interests.filter((id) => userInterests.has(id)),
    }))
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        b.destination.rating - a.destination.rating
    )
    .slice(0, limit)
    .map(({ destination, matched }) => ({
      destination,
      matchedInterests: matched.map((id) => INTEREST_LABELS[id] || id),
    }));
}