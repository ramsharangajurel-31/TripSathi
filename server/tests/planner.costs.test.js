import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TRIP_STATUS,
  getActivityCount,
  getDayActivities,
  getDayCosts,
  getHeadcount,
  getPayingUnits,
  getTripCosts,
  getTripStatus,
} from "../src/services/planner/costs.js";
import { getTripRoute } from "../src/services/planner/route.js";
import { buildSampleTrips } from "./support/sampleTrips.js";
import { loadSeedCatalog } from "./support/seedCatalog.js";

const catalog = loadSeedCatalog();
const { pokhara, chitwan, kathmandu } = buildSampleTrips(catalog);
const pick = (costs, keys) => Object.fromEntries(keys.map((key) => [key, costs[key]]));

describe("cost model: the verified sample trips", () => {
  it("Pokhara getaway: NPR 36,225, within budget", () => {
    const costs = getTripCosts(pokhara);

    assert.deepEqual(pick(costs, ["transport", "accommodation", "food", "activities", "misc", "total"]), {
      transport: 10800,
      accommodation: 9000,
      food: 8400,
      activities: 6300,
      misc: 1725,
      total: 36225,
    });
    assert.equal(costs.perPerson, 12075);
    assert.equal(costs.remaining, 8775);
    assert.equal(costs.overBy, 0);
    assert.equal(costs.isOverBudget, false);
    // 80.5 exactly: must round UP to 81 (whole-number arithmetic).
    assert.equal(costs.usedPercent, 81);
    assert.equal(costs.headcount, 3);
  });

  it("Chitwan family safari: NPR 69,300, children counted at half, over budget", () => {
    const costs = getTripCosts(chitwan);

    assert.deepEqual(pick(costs, ["transport", "accommodation", "food", "activities", "misc", "total"]), {
      transport: 14100,
      accommodation: 21000,
      food: 13500,
      activities: 17400,
      misc: 3300,
      total: 69300,
    });
    assert.equal(costs.payingUnits, 3);
    assert.equal(costs.headcount, 4);
    assert.equal(costs.perPerson, 17325);
    assert.equal(costs.remaining, -4300);
    assert.equal(costs.overBy, 4300);
    assert.equal(costs.isOverBudget, true);
    assert.equal(costs.usedPercent, 107);
  });

  it("Kathmandu heritage weekend: NPR 36,750 (starting from Pokhara)", () => {
    const costs = getTripCosts(kathmandu);

    assert.deepEqual(pick(costs, ["transport", "accommodation", "food", "activities", "misc", "total"]), {
      transport: 8400,
      accommodation: 12000,
      food: 9000,
      activities: 5600,
      misc: 1750,
      total: 36750,
    });
    assert.equal(costs.perPerson, 18375);
    assert.equal(costs.remaining, 3250);
    assert.equal(costs.usedPercent, 92);
  });

  it("the sample trips' travel costs agree with the route estimates", () => {
    // Each trip pays the round-trip fare once per adult-equivalent on top of local transport.
    for (const trip of [pokhara, chitwan, kathmandu]) {
      const start = trip.startingLocation === "Pokhara" ? "pokhara" : "kathmandu";
      const route = getTripRoute(catalog, start, trip.destinationIds, "tourist-bus");
      const intercity = trip.days.reduce((sum, day) => {
        const match = /^Tourist bus/.test(day.transport.label) ? day.transport.label : null;
        return match ? sum + 1 : sum;
      }, 0);

      assert.equal(intercity, 2, `${trip.title} has an outbound and a return day`);
      assert.equal(route.legs.length, 2);
    }
    assert.equal(getTripRoute(catalog, "kathmandu", ["pokhara"], "tourist-bus").totalCostPerPerson, 2400);
    assert.equal(getTripRoute(catalog, "kathmandu", ["chitwan"], "tourist-bus").totalCostPerPerson, 2000);
    assert.equal(getTripRoute(catalog, "pokhara", ["kathmandu"], "tourist-bus").totalCostPerPerson, 2400);
  });
});

describe("cost model: details", () => {
  it("day costs add up to the trip subtotal (the buffer is not spread over days)", () => {
    assert.deepEqual(pokhara.days.map((day) => getDayCosts(pokhara, day).total), [9900, 9300, 9600, 5700]);
    assert.deepEqual(kathmandu.days.map((day) => getDayCosts(kathmandu, day).total), [16400, 12800, 5800]);

    const costs = getTripCosts(pokhara);
    const sum = pokhara.days.reduce((total, day) => total + getDayCosts(pokhara, day).total, 0);
    assert.equal(sum, costs.total - costs.misc);
  });

  it("rounds each category on its own and works the buffer out in whole numbers", () => {
    const trip = {
      travelers: { adults: 1, children: 1 },
      budget: { total: 5000 },
      days: [{ transport: { costPerPerson: 1001 } }],
    };
    const costs = getTripCosts(trip);

    assert.equal(getPayingUnits(trip), 1.5);
    assert.equal(costs.transport, 1502); // 1001 x 1.5 = 1501.5 rounds up
    assert.equal(costs.misc, 75); // 1502 x 5 / 100 = 75.1
    assert.equal(costs.total, 1577);
    assert.equal(costs.perPerson, 789); // 1577 / 2 = 788.5 rounds up
  });

  it("copes with a missing or empty trip", () => {
    for (const trip of [{}, undefined, { days: "nonsense" }, { days: [{}] }]) {
      const costs = getTripCosts(trip);
      assert.equal(costs.total, 0);
      assert.equal(costs.perPerson, 0);
      assert.equal(costs.usedPercent, 0);
      assert.equal(costs.isOverBudget, false);
    }
    assert.equal(getHeadcount(undefined), 0);
    assert.equal(getTripCosts({ days: [{ food: { costPerPerson: 100 } }], travelers: { adults: 1 } }).remaining, -105);
  });

  it("counts activities and derives the trip status from the dates", () => {
    assert.equal(getActivityCount(pokhara), 5);
    assert.equal(getDayActivities(pokhara.days[1]).length, 2);
    assert.equal(getDayActivities({}).length, 0);

    const at = (today) => getTripStatus(pokhara, today);
    assert.equal(at("2027-03-09"), TRIP_STATUS.upcoming);
    assert.equal(at("2027-03-10"), TRIP_STATUS.ongoing);
    assert.equal(at("2027-03-13"), TRIP_STATUS.ongoing);
    assert.equal(at("2027-03-14"), TRIP_STATUS.completed);
    assert.equal(getTripStatus({}, "2027-03-14"), TRIP_STATUS.upcoming);
  });
});