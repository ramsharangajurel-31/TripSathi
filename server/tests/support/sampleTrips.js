// The three sample trips from the frontend (client/src/data/sampleTrips.js),
// rebuilt from the seeded catalog. Their verified totals are the reference
// numbers the server's cost model must reproduce:
//   Pokhara    NPR 36,225   Chitwan    NPR 69,300   Kathmandu  NPR 36,750

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };

export function buildSampleTrips(catalog) {
  const find = (destination, name) => {
    const found = catalog.getActivitiesByDestination(destination).find((item) => item.name === name);
    if (!found) throw new Error(`Seed activity not found: ${destination} / ${name}`);
    return found;
  };

  const slotItems = (tripKey, dayNumber, slot, destination, names) =>
    names.map((name, index) => {
      const activity = find(destination, name);
      return {
        id: `${tripKey}-d${dayNumber}-${slot}-${index}`,
        activityId: activity.id,
        name: activity.name,
        category: activity.category,
        durationHours: activity.durationHours,
        costPerPerson: activity.costPerPerson,
        notes: "",
      };
    });

  const makeDay = ({
    tripKey,
    dayNumber,
    destination,
    tier,
    title,
    intercity = null,
    staysOvernight = true,
    foodFactor = 1,
    morning = [],
    afternoon = [],
    evening = [],
  }) => {
    const place = catalog.getDestination(destination);
    const costs = place.costPerDay[tier];

    return {
      id: `${tripKey}-d${dayNumber}`,
      dayNumber,
      destinationId: destination,
      title,
      transport: {
        label: intercity ? `${intercity.label}; local taxis and rickshaws` : "Local taxis and rickshaws",
        costPerPerson: costs.localTransport + (intercity ? intercity.costPerPerson : 0),
      },
      accommodation: staysOvernight
        ? { label: `${TIER_LABELS[tier]} stay in ${place.name}`, costPerPerson: costs.stay }
        : null,
      food: { label: "Local restaurants", costPerPerson: Math.round(costs.food * foodFactor) },
      slots: {
        morning: slotItems(tripKey, dayNumber, "morning", destination, morning),
        afternoon: slotItems(tripKey, dayNumber, "afternoon", destination, afternoon),
        evening: slotItems(tripKey, dayNumber, "evening", destination, evening),
      },
      notes: "",
    };
  };

  const pokhara = {
    id: "trip-pokhara-friends",
    title: "Pokhara getaway with friends",
    destinationIds: ["pokhara"],
    startingLocation: "Kathmandu",
    departureDate: "2027-03-10",
    returnDate: "2027-03-13",
    travelers: { adults: 3, children: 0 },
    budget: { total: 45000, category: "budget" },
    preferences: { accommodation: "hotel", transport: "tourist-bus", intensity: "moderate", pace: "balanced" },
    days: [
      makeDay({
        tripKey: "pokhara", dayNumber: 1, destination: "pokhara", tier: "budget", title: "Arrive in Pokhara",
        intercity: { label: "Tourist bus Kathmandu → Pokhara (about 6.5 hours)", costPerPerson: 1200 },
        evening: ["Lakeside evening walk"],
      }),
      makeDay({
        tripKey: "pokhara", dayNumber: 2, destination: "pokhara", tier: "budget", title: "Sunrise and the Peace Pagoda",
        morning: ["Sarangkot sunrise"], afternoon: ["World Peace Pagoda hike"],
      }),
      makeDay({
        tripKey: "pokhara", dayNumber: 3, destination: "pokhara", tier: "budget", title: "Waterfalls and the lake",
        morning: ["Davis Falls and Gupteshwor Cave"], afternoon: ["Phewa Lake boating"],
      }),
      makeDay({
        tripKey: "pokhara", dayNumber: 4, destination: "pokhara", tier: "budget", title: "Return to Kathmandu",
        intercity: { label: "Tourist bus Pokhara → Kathmandu (about 6.5 hours)", costPerPerson: 1200 },
        staysOvernight: false, foodFactor: 0.5,
      }),
    ],
  };

  const chitwan = {
    id: "trip-chitwan-family",
    title: "Chitwan family safari",
    destinationIds: ["chitwan"],
    startingLocation: "Kathmandu",
    departureDate: "2027-05-01",
    returnDate: "2027-05-03",
    travelers: { adults: 2, children: 2 },
    budget: { total: 65000, category: "standard" },
    preferences: { accommodation: "hotel", transport: "tourist-bus", intensity: "easy", pace: "relaxed" },
    days: [
      makeDay({
        tripKey: "chitwan", dayNumber: 1, destination: "chitwan", tier: "standard", title: "Arrive in Chitwan",
        intercity: { label: "Tourist bus Kathmandu → Chitwan (about 5.5 hours)", costPerPerson: 1000 },
        afternoon: ["Elephant Breeding Centre visit"], evening: ["Tharu cultural show"],
      }),
      makeDay({
        tripKey: "chitwan", dayNumber: 2, destination: "chitwan", tier: "standard", title: "Safari day",
        morning: ["Jeep safari in Chitwan National Park"], afternoon: ["Rapti River canoe ride"],
      }),
      makeDay({
        tripKey: "chitwan", dayNumber: 3, destination: "chitwan", tier: "standard", title: "Village walk and return",
        intercity: { label: "Tourist bus Chitwan → Kathmandu (about 5.5 hours)", costPerPerson: 1000 },
        staysOvernight: false, foodFactor: 0.5, morning: ["Village nature walk"],
      }),
    ],
  };

  const kathmandu = {
    id: "trip-kathmandu-heritage",
    title: "Kathmandu heritage weekend",
    destinationIds: ["kathmandu"],
    startingLocation: "Pokhara",
    departureDate: "2027-01-15",
    returnDate: "2027-01-17",
    travelers: { adults: 2, children: 0 },
    budget: { total: 40000, category: "standard" },
    preferences: { accommodation: "hotel", transport: "tourist-bus", intensity: "easy", pace: "balanced" },
    days: [
      makeDay({
        tripKey: "kathmandu", dayNumber: 1, destination: "kathmandu", tier: "standard", title: "Arrive and Boudhanath",
        intercity: { label: "Tourist bus Pokhara → Kathmandu (about 6.5 hours)", costPerPerson: 1200 },
        afternoon: ["Boudhanath Stupa walk"], evening: ["Newari food trail"],
      }),
      makeDay({
        tripKey: "kathmandu", dayNumber: 2, destination: "kathmandu", tier: "standard", title: "Temples and the old square",
        morning: ["Pashupatinath Temple visit"], afternoon: ["Kathmandu Durbar Square"],
      }),
      makeDay({
        tripKey: "kathmandu", dayNumber: 3, destination: "kathmandu", tier: "standard", title: "Swayambhunath and departure",
        intercity: { label: "Tourist bus Kathmandu → Pokhara (about 6.5 hours)", costPerPerson: 1200 },
        staysOvernight: false, foodFactor: 0.5, morning: ["Swayambhunath Stupa"],
      }),
    ],
  };

  return { pokhara, chitwan, kathmandu };
}