import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatTravelTime,
  getRouteLeg,
  getStartDestinationId,
  getTripRoute,
  orderDestinations,
} from "../src/services/planner/route.js";
import { loadSeedCatalog } from "./support/seedCatalog.js";

const catalog = loadSeedCatalog();
const summary = (leg) => [leg.distanceKm, leg.hours, leg.costPerPerson];

describe("route estimates", () => {
  it("formats travel times", () => {
    assert.equal(formatTravelTime(0.5), "30 min");
    assert.equal(formatTravelTime(0.6), "35 min");
    assert.equal(formatTravelTime(1), "1 hour");
    assert.equal(formatTravelTime(6.5), "6.5 hours");
  });

  it("maps the starting city to a destination, defaulting to Kathmandu", () => {
    assert.equal(getStartDestinationId("Pokhara"), "pokhara");
    assert.equal(getStartDestinationId("  lumbini "), "lumbini");
    assert.equal(getStartDestinationId("Biratnagar"), "kathmandu");
    assert.equal(getStartDestinationId(undefined), "kathmandu");
  });

  it("estimates Kathmandu to Pokhara by bus, car and flight", () => {
    const bus = getRouteLeg(catalog, "kathmandu", "pokhara", "tourist-bus");
    assert.deepEqual(summary(bus), [200, 6.5, 1200]);
    assert.equal(bus.label, "Tourist bus Kathmandu → Pokhara (about 6.5 hours)");

    const car = getRouteLeg(catalog, "kathmandu", "pokhara", "private-car");
    assert.deepEqual(summary(car), [200, 5, 3000]);

    const flight = getRouteLeg(catalog, "kathmandu", "pokhara", "flight");
    assert.deepEqual(summary(flight), [200, 0.5, 8000]);
    assert.equal(flight.label, "Domestic flight Kathmandu → Pokhara (about 30 min)");
  });

  it("estimates Chitwan, and uses the direct Pokhara to Chitwan road", () => {
    assert.deepEqual(summary(getRouteLeg(catalog, "kathmandu", "chitwan")), [170, 5.5, 1000]);

    const direct = getRouteLeg(catalog, "pokhara", "chitwan");
    assert.equal(direct.segments.length, 1);
    assert.deepEqual(summary(direct), [170, 5.5, 1000]);

    // A flight is only used where one exists: Chitwan has none, so it stays a bus.
    const noFlight = getRouteLeg(catalog, "kathmandu", "chitwan", "flight");
    assert.equal(noFlight.segments[0].mode, "tourist-bus");
  });

  it("goes through Kathmandu when places are not directly linked", () => {
    const leg = getRouteLeg(catalog, "pokhara", "everest-region", "tourist-bus");

    assert.equal(leg.segments.length, 2);
    assert.deepEqual(leg.segments.map((item) => item.mode), ["tourist-bus", "flight"]);
    assert.deepEqual(summary(leg), [340, 7.1, 19200]);
    assert.equal(
      leg.label,
      "Tourist bus + Domestic flight Pokhara → Kathmandu → Everest Region (about 7.1 hours)"
    );

    // Everest is always reached by air, whatever transport was chosen.
    assert.equal(getRouteLeg(catalog, "kathmandu", "everest-region", "tourist-bus").segments[0].mode, "flight");
  });

  it("gives an empty leg for the same place or an unknown one", () => {
    for (const leg of [
      getRouteLeg(catalog, "pokhara", "pokhara"),
      getRouteLeg(catalog, "kathmandu", "atlantis"),
    ]) {
      assert.deepEqual(leg.segments, []);
      assert.deepEqual(summary(leg), [0, 0, 0]);
      assert.equal(leg.label, "");
    }
  });

  it("orders destinations as a nearest-neighbour route", () => {
    assert.deepEqual(
      orderDestinations(catalog, "kathmandu", ["pokhara", "bandipur", "nagarkot"], "tourist-bus"),
      ["nagarkot", "bandipur", "pokhara"]
    );
    assert.deepEqual(orderDestinations(catalog, "kathmandu", [], "tourist-bus"), []);
  });

  it("totals a round trip", () => {
    const pokhara = getTripRoute(catalog, "kathmandu", ["pokhara"], "tourist-bus");
    assert.deepEqual(pokhara.legs.map((leg) => leg.kind), ["outbound", "return"]);
    assert.deepEqual(
      [pokhara.totalDistanceKm, pokhara.totalHours, pokhara.totalCostPerPerson],
      [400, 13, 2400]
    );

    const everest = getTripRoute(catalog, "kathmandu", ["everest-region"], "tourist-bus");
    assert.deepEqual(
      [everest.totalDistanceKm, everest.totalHours, everest.totalCostPerPerson],
      [280, 1.2, 36000]
    );

    assert.deepEqual(getTripRoute(catalog, "kathmandu", [], "tourist-bus").legs, []);
  });
});