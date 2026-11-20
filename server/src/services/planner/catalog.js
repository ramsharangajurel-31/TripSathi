/**
 * The planner never touches the database. It works on a catalog:
 *
 *   destinations  [{ slug, name, altitudeM, recommendedDays, interests,
 *                    costPerDay: { budget|standard|premium: { stay, food, localTransport } },
 *                    fromKathmandu: { distanceKm, hours, mode } }]
 *   activities    [{ id, destination (a destination slug), name, category,
 *                    durationHours, costPerPerson, intensity, bestTime,
 *                    seasonalAvailability }]
 *
 * It comes from the database (catalogLoader.js) or from test data.
 */
export function createCatalog({ destinations = [], activities = [] } = {}) {
  const destinationBySlug = new Map(destinations.map((item) => [item.slug, item]));
  const activityById = new Map(activities.map((item) => [item.id, item]));

  const activitiesByDestination = new Map();
  for (const activity of activities) {
    if (!activitiesByDestination.has(activity.destination)) {
      activitiesByDestination.set(activity.destination, []);
    }
    activitiesByDestination.get(activity.destination).push(activity);
  }

  return {
    destinations,
    activities,
    getDestination: (slug) => destinationBySlug.get(slug) ?? null,
    getActivity: (id) => activityById.get(id) ?? null,
    // A copy, so callers can sort or change the list without touching the catalog.
    getActivitiesByDestination: (slug) => [...(activitiesByDestination.get(slug) ?? [])],
    getPlaceName: (slug) => destinationBySlug.get(slug)?.name ?? slug,
  };
}