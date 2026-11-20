import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  activityListQuery,
  attractionListQuery,
  destinationListQuery,
  destinationSearchQuery,
  objectIdParams,
  slugOrIdParams,
} from "../src/validators/catalog.js";

describe("catalog query validation", () => {
  it("accepts an empty query and converts text to numbers and booleans", () => {
    assert.equal(destinationListQuery.safeParse({}).success, true);

    const parsed = destinationListQuery.safeParse({ page: "2", limit: "5", popular: "true", featured: "false" });
    assert.equal(parsed.success, true);
    assert.deepEqual(
      [parsed.data.page, parsed.data.limit, parsed.data.popular, parsed.data.featured],
      [2, 5, true, false]
    );
  });

  it("rejects unknown and operator-style parameters", () => {
    assert.equal(destinationListQuery.safeParse({ bogus: "1" }).success, false);
    assert.equal(destinationListQuery.safeParse({ "province[$ne]": "x" }).success, false);
    assert.equal(destinationListQuery.safeParse({ province: { $ne: "x" } }).success, false);
    assert.equal(attractionListQuery.safeParse({ page: ["1", "2"] }).success, false);
  });

  it("rejects badly formed or out-of-range numbers", () => {
    for (const limit of ["0", "101", "1e3", "-1", "abc", "", "5.5"]) {
      assert.equal(destinationListQuery.safeParse({ limit }).success, false, `limit=${JSON.stringify(limit)}`);
    }
    assert.equal(destinationListQuery.safeParse({ page: "0" }).success, false);
    assert.equal(activityListQuery.safeParse({ month: "13" }).success, false);
    assert.equal(activityListQuery.safeParse({ maxCost: "0" }).success, true);
  });

  it("rejects values outside the allowed lists", () => {
    assert.equal(destinationListQuery.safeParse({ province: "Atlantis" }).success, false);
    assert.equal(destinationListQuery.safeParse({ popular: "yes" }).success, false);
    assert.equal(destinationListQuery.safeParse({ sort: "price" }).success, false);
    assert.equal(attractionListQuery.safeParse({ fee: "cheap" }).success, false);
    assert.equal(activityListQuery.safeParse({ intensity: "extreme" }).success, false);
  });

  it("requires a search text of at least 2 characters, and trims it", () => {
    assert.equal(destinationSearchQuery.safeParse({}).success, false);
    assert.equal(destinationSearchQuery.safeParse({ q: "p" }).success, false);

    const parsed = destinationSearchQuery.safeParse({ q: "  po " });
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.q, "po");
  });

  it("accepts slugs and ids in the right places only", () => {
    assert.equal(slugOrIdParams.safeParse({ id: "everest-region" }).success, true);
    assert.equal(slugOrIdParams.safeParse({ id: "a/b" }).success, false);
    assert.equal(slugOrIdParams.safeParse({ id: "x".repeat(81) }).success, false);

    assert.equal(objectIdParams.safeParse({ id: "a".repeat(24) }).success, true);
    assert.equal(objectIdParams.safeParse({ id: "pokhara" }).success, false);
  });
});