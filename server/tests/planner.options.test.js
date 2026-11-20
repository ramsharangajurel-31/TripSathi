import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACCOMMODATION_TYPES,
  INTENSITIES,
  PACES,
  TRANSPORT_TYPES,
} from "../src/constants.js";
import {
  ACCOMMODATION_OPTIONS,
  FLIGHT_ROUTES,
  INTENSITY_OPTIONS,
  MUST_FLY_DESTINATIONS,
  PACE_OPTIONS,
  ROAD_ROUTE_OVERRIDES,
  START_LOCATIONS,
  TRANSPORT_OPTIONS,
} from "../src/services/planner/options.js";
import { loadSeedCatalog } from "./support/seedCatalog.js";

describe("planner settings", () => {
  it("use the same option ids as the models and validators", () => {
    assert.deepEqual(ACCOMMODATION_OPTIONS.map((item) => item.id), ACCOMMODATION_TYPES);
    assert.deepEqual(TRANSPORT_OPTIONS.map((item) => item.id), TRANSPORT_TYPES);
    assert.deepEqual(INTENSITY_OPTIONS.map((item) => item.id), INTENSITIES);
    assert.deepEqual(PACE_OPTIONS.map((item) => item.id), PACES);
  });

  it("write every route key as two slugs in alphabetical order", () => {
    for (const key of [...Object.keys(FLIGHT_ROUTES), ...Object.keys(ROAD_ROUTE_OVERRIDES)]) {
      const parts = key.split("|");
      assert.equal(parts.length, 2, key);
      assert.equal(key, [...parts].sort().join("|"), `${key} must be in alphabetical order`);
    }
  });

  it("only mention destinations that exist in the catalog", () => {
    const catalog = loadSeedCatalog();
    const slugs = [
      ...Object.keys(FLIGHT_ROUTES).flatMap((key) => key.split("|")),
      ...Object.keys(ROAD_ROUTE_OVERRIDES).flatMap((key) => key.split("|")),
      ...MUST_FLY_DESTINATIONS,
      ...START_LOCATIONS.map((item) => item.destinationId),
    ];

    for (const slug of slugs) assert.ok(catalog.getDestination(slug), `unknown destination "${slug}"`);
  });
});