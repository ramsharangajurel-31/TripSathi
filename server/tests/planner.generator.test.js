import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TIME_SLOTS } from "../src/constants.js";
import { createCatalog } from "../src/services/planner/catalog.js";
import { getDayActivities, getDayCosts, getTripCosts } from "../src/services/planner/costs.js";
import {
  PlanningError,
  generateTrip,
  getMinimumTripDays,
  getSuggestedDays,
} from "../src/services/planner/generator.js";
import { TODAY, validInput } from "./support/plannerInput.js";
import { loadSeedCatalog } from "./support/seedCatalog.js";

const catalog = loadSeedCatalog();
const plan = (overrides, options) => generateTrip(catalog, validInput(overrides), { today: TODAY, ...options });
const names = (trip) => trip.days.flatMap((day) => getDayActivities(day).map((item) => item.name));
const codes = (trip) => trip.warnings.map((warning) => warning.code);
const activityIds = (trip) => trip.days.flatMap((day) => getDayActivities(day).map((item) => item.activityId));

describe("itinerary generator: a 4-day Pokhara trip", () => {
  const trip = plan();
  const costs = getTripCosts(trip);

  it("reproduces the verified total of NPR 36,225", () => {
    assert.equal(costs.total, 36225);
    assert.equal(costs.remaining, 8775);
    assert.equal(costs.perPerson, 12075);
    assert.equal(costs.usedPercent, 81);
    assert.deepEqual(
      [costs.transport, costs.accommodation, costs.food, costs.activities, costs.misc],
      [10800, 9000, 8400, 6300, 1725]
    );
  });

  it("builds the expected days", () => {
    assert.equal(trip.title, "4-day Pokhara trip");
    assert.deepEqual(trip.destinationIds, ["pokhara"]);
    assert.deepEqual(
      trip.days.map((day) => day.title),
      ["Arrive in Pokhara", "Davis Falls and Gupteshwor Cave", "Sarangkot sunrise", "Return to Kathmandu"]
    );
    assert.deepEqual(trip.days.map((day) => getDayCosts(trip, day).total), [10800, 9600, 8400, 5700]);

    assert.equal(trip.days[0].slots.afternoon[0].name, "World Peace Pagoda hike");
    assert.equal(trip.days[0].slots.afternoon[0].activityId, "pokhara:world-peace-pagoda-hike");
    assert.equal(trip.days[0].slots.afternoon[0].id, "d1-afternoon-0");
    assert.deepEqual(
      [trip.days[1].slots.morning[0].name, trip.days[1].slots.afternoon[0].name],
      ["Davis Falls and Gupteshwor Cave", "Phewa Lake boating"]
    );
    assert.deepEqual(
      [trip.days[2].slots.morning[0].name, trip.days[2].slots.evening[0].name],
      ["Sarangkot sunrise", "Lakeside evening walk"]
    );
    assert.equal(getDayActivities(trip.days[3]).length, 0);

    assert.equal(trip.days[0].transport.label, "Tourist bus Kathmandu → Pokhara (about 6.5 hours); Local taxis and rickshaws");
    assert.equal(trip.days[3].accommodation, null);
    assert.equal(trip.days[3].food.costPerPerson, 400);

    assert.equal(trip.generationMetadata.generator, "rule-based");
    assert.equal(trip.budget.category, "budget");
  });

  it("leaves paragliding out: it is above the Moderate intensity limit", () => {
    assert.equal(names(trip).includes("Tandem paragliding"), false);
  });

  it("has no warnings when the plan sits comfortably inside the budget", () => {
    assert.deepEqual(trip.warnings, []);
    assert.deepEqual(trip.generationNotes, []);
  });
});

describe("itinerary generator: budget and length", () => {
  it("5 days cost NPR 42,840", () => {
    const trip = plan({ returnDate: "2027-03-14" });
    const costs = getTripCosts(trip);

    assert.equal(trip.days.length, 5);
    assert.equal(costs.total, 42840);
    assert.equal(costs.remaining, 2160);
    assert.equal(names(trip).length, 5);
  });

  it("drops the costliest activities until the plan fits (NPR 33,000)", () => {
    const trip = plan({ budgetTotal: 33000 });
    const costs = getTripCosts(trip);

    assert.equal(costs.total, 31500);
    assert.equal(costs.remaining, 1500);
    assert.equal(names(trip).includes("Phewa Lake boating"), false);
    assert.equal(names(trip).includes("Sarangkot sunrise"), false);
    assert.equal(names(trip).length, 3);

    assert.deepEqual(codes(trip), ["ACTIVITIES_REMOVED"]);
    assert.deepEqual(trip.warnings[0].details.activities, ["Phewa Lake boating", "Sarangkot sunrise"]);
    assert.match(trip.generationNotes[0], /Phewa Lake boating, Sarangkot sunrise/);
  });

  it("says so honestly when even that cannot fit (NPR 20,000), and fitBudget:false removes nothing", () => {
    const trip = plan({ budgetTotal: 20000 });
    const costs = getTripCosts(trip);

    assert.equal(costs.total, 29610);
    assert.equal(costs.overBy, 9610);
    assert.deepEqual(names(trip), ["Lakeside evening walk"]); // the free one stays
    assert.deepEqual(codes(trip), ["ACTIVITIES_REMOVED", "OVER_BUDGET"]);
    assert.match(trip.warnings[1].message, /NPR 9,610/);
    assert.equal(trip.warnings[1].details.overBy, 9610);

    const untouched = plan({ budgetTotal: 20000 }, { fitBudget: false });
    assert.equal(getTripCosts(untouched).total, 36225);
    assert.equal(getTripCosts(untouched).isOverBudget, true);
    assert.deepEqual(untouched.warnings, []);
    assert.equal(untouched.generationMetadata.fitBudget, false);
  });

  it("points out a budget that is mostly unused", () => {
    const trip = plan({ budgetTotal: 100000 });

    assert.deepEqual(codes(trip), ["BUDGET_UNUSED"]);
    assert.match(trip.warnings[0].message, /NPR 63,775/);
  });

  it("a packed pace at Challenging intensity brings in paragliding", () => {
    const trip = plan({
      budgetTotal: 100000,
      preferences: { accommodation: "hotel", transport: "tourist-bus", intensity: "challenging", pace: "packed" },
    });

    assert.ok(names(trip).includes("Tandem paragliding"));
    assert.equal(trip.days[2].slots.morning[0].name, "Tandem paragliding");
    assert.equal(getTripCosts(trip).total, 64575);
    assert.equal(codes(trip).includes("ACTIVITIES_REMOVED"), false);
  });

  it("a one-day trip is a day trip, with no overnight stay and one afternoon activity", () => {
    const trip = plan({ departureDate: "2027-03-10", returnDate: "2027-03-10", adults: 1, budgetTotal: 6000 });
    const [day] = trip.days;

    assert.equal(trip.days.length, 1);
    assert.equal(day.title, "Day trip to Pokhara");
    assert.equal(day.accommodation, null);
    assert.equal(day.slots.morning.length, 0);
    assert.equal(day.slots.evening.length, 0);
    assert.equal(day.slots.afternoon.length, 1);
    assert.equal(getTripCosts(trip).total, 3570);
  });
});

describe("itinerary generator: several destinations", () => {
  const input = {
    destinationIds: ["mustang", "chitwan", "pokhara"],
    departureDate: "2027-03-10",
    returnDate: "2027-03-17",
    adults: 2,
    budgetTotal: 300000,
    budgetCategory: "standard",
    interests: ["trekking", "photography", "nature"],
  };

  it("orders the stops, shares the days and prices the travel legs", () => {
    const trip = plan(input);

    assert.deepEqual(trip.destinationIds, ["chitwan", "pokhara", "mustang"]);
    assert.equal(trip.title, "8-day Chitwan, Pokhara and Mustang trip");
    assert.deepEqual(
      trip.days.map((day) => day.destinationId),
      ["chitwan", "chitwan", "pokhara", "pokhara", "pokhara", "mustang", "mustang", "mustang"]
    );

    // 1000 (to Chitwan) + 1000 (to Pokhara) + 950 (to Mustang) + 2000 (back to Kathmandu)
    const intercity = trip.days.reduce(
      (sum, day) => sum + day.transport.costPerPerson - catalog.getDestination(day.destinationId).costPerDay.standard.localTransport,
      0
    );
    assert.equal(intercity, 4950);

    assert.equal(trip.days[0].transport.label.startsWith("Tourist bus Kathmandu → Chitwan"), true);
    assert.equal(trip.days[2].transport.label.startsWith("Tourist bus Chitwan → Pokhara"), true);
    assert.equal(trip.days[7].transport.label.includes("Mustang → Kathmandu"), true);
    assert.equal(trip.days[7].accommodation, null);
  });

  it("warns about permits and altitude for remote, high places", () => {
    const trip = plan(input);

    assert.ok(codes(trip).includes("REMOTE_PERMITS"));
    assert.ok(codes(trip).includes("HIGH_ALTITUDE"));
  });

  it("gives the same plan whatever order the destinations were listed in", () => {
    const one = plan({ ...input, destinationIds: ["mustang", "chitwan", "pokhara"] });
    const two = plan({ ...input, destinationIds: ["pokhara", "mustang", "chitwan"] });

    assert.deepEqual(one, two);
  });
});

describe("itinerary generator: rules", () => {
  it("is deterministic: the same requirements give an identical plan", () => {
    assert.deepEqual(plan(), plan());
  });

  it("falls back to general activities, with a warning, when no interest matches", () => {
    const trip = plan({ interests: ["food", "wildlife"] });

    assert.ok(codes(trip).includes("INTEREST_FALLBACK"));
    assert.match(trip.warnings.find((item) => item.code === "INTEREST_FALLBACK").message, /Pokhara/);
    assert.ok(names(trip).length > 0);
  });

  it("skips activities outside their season", () => {
    const tiers = {
      budget: { stay: 1000, food: 500, localTransport: 100 },
      standard: { stay: 1500, food: 700, localTransport: 150 },
      premium: { stay: 3000, food: 1200, localTransport: 300 },
    };
    const mini = createCatalog({
      destinations: [
        {
          slug: "kathmandu", name: "Kathmandu", altitudeM: 1400, recommendedDays: 2, interests: ["nature"],
          costPerDay: tiers, fromKathmandu: { distanceKm: 0, hours: 0, mode: "Starting point" },
        },
      ],
      activities: [
        {
          id: "monsoon-walk", destination: "kathmandu", name: "Monsoon walk", category: "nature",
          durationHours: 2, costPerPerson: 100, intensity: "easy", bestTime: "morning", seasonalAvailability: [6, 7, 8],
        },
        {
          id: "year-round", destination: "kathmandu", name: "Year-round walk", category: "nature",
          durationHours: 2, costPerPerson: 100, intensity: "easy", bestTime: "afternoon", seasonalAvailability: [],
        },
      ],
    });
    const build = (departureDate, returnDate) =>
      generateTrip(
        mini,
        validInput({ destinationIds: ["kathmandu"], departureDate, returnDate, adults: 1, budgetTotal: 100000, interests: ["nature"] }),
        { today: TODAY }
      );

    assert.deepEqual(activityIds(build("2027-03-10", "2027-03-11")), ["year-round"]);
    assert.deepEqual(activityIds(build("2027-07-10", "2027-07-11")), ["monsoon-walk", "year-round"]);
  });

  it("throws a PlanningError that lists every problem", () => {
    assert.throws(
      () => generateTrip(catalog, validInput({ adults: 0, interests: [] }), { today: TODAY }),
      (error) =>
        error instanceof PlanningError &&
        error.code === "INVALID_TRIP_REQUIREMENTS" &&
        error.details.some((item) => item.field === "adults") &&
        error.details.some((item) => item.field === "interests")
    );
  });

  it("offers helpers for the minimum and suggested trip length", () => {
    assert.equal(getMinimumTripDays(0), 1);
    assert.equal(getMinimumTripDays(3), 3);

    assert.equal(getSuggestedDays(catalog, ["pokhara", "chitwan"]), 7);
    assert.equal(getSuggestedDays(catalog, []), 1);
    assert.equal(getSuggestedDays(catalog, catalog.destinations.map((item) => item.slug)), 30); // 39 days, capped
  });

  it("only ever fills the three time slots", () => {
    const trip = plan({ preferences: { pace: "packed", intensity: "challenging" }, budgetTotal: 200000 });

    for (const day of trip.days) assert.deepEqual(Object.keys(day.slots).sort(), [...TIME_SLOTS].sort());
  });
});