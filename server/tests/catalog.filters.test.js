import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildActivityFilter,
  buildAttractionFilter,
  buildDestinationFilter,
} from "../src/services/catalog.service.js";
import { getPaging, paginationMeta } from "../src/utils/pagination.js";
import { escapeRegex } from "../src/utils/regex.js";

describe("catalog filters", () => {
  it("destinations: only active records unless filtered further", () => {
    assert.deepEqual(buildDestinationFilter({}), { status: "active" });
  });

  it("destinations: builds province, interest, flags and a search over three fields", () => {
    const filter = buildDestinationFilter({ province: "Gandaki Province", interest: "nature", popular: false, q: "po.k" });

    assert.equal(filter.province, "Gandaki Province");
    assert.equal(filter.interests, "nature");
    assert.equal(filter.popular, false);
    assert.equal(filter.$or.length, 3);
    assert.equal(filter.$or[0].name.source, "po\\.k");
    assert.equal(filter.$or[0].name.flags, "i");
  });

  it("escapeRegex makes text match literally", () => {
    const text = ".*+?^${}()|[]\\";
    assert.equal(new RegExp(escapeRegex(text)).test(text), true);
    assert.equal(new RegExp(escapeRegex(".*")).test("abc"), false);
  });

  it("attractions: maps the fee options (unknown is null, never 'free')", () => {
    const ids = ["a", "b"];

    assert.equal(buildAttractionFilter({ fee: "free" }, ids).entryFee, 0);
    assert.deepEqual(buildAttractionFilter({ fee: "paid" }, ids).entryFee, { $gt: 0 });
    assert.equal(buildAttractionFilter({ fee: "unknown" }, ids).entryFee, null);
    assert.equal("entryFee" in buildAttractionFilter({}, ids), false);

    const filter = buildAttractionFilter({ type: "Museum" }, ids);
    assert.deepEqual(filter.destination, { $in: ids });
    assert.equal(filter.status, "active");
    assert.equal(filter.type, "Museum");
  });

  it("activities: combines simple filters, season and search", () => {
    const ids = ["a"];
    const filter = buildActivityFilter(
      { category: "nature", intensity: "easy", bestTime: "morning", maxCost: 999, month: 6, q: "walk" },
      ids
    );

    assert.equal(filter.category, "nature");
    assert.equal(filter.intensity, "easy");
    assert.equal(filter.bestTime, "morning");
    assert.deepEqual(filter.costPerPerson, { $lte: 999 });
    assert.equal(filter.$and.length, 2);
    assert.deepEqual(filter.$and[0].$or[0], { seasonalAvailability: { $size: 0 } });

    assert.equal("$and" in buildActivityFilter({}, ids), false);
    assert.deepEqual(buildActivityFilter({ maxCost: 0 }, ids).costPerPerson, { $lte: 0 });
  });

  it("paging: defaults, skip and page counts", () => {
    assert.deepEqual(getPaging({}), { page: 1, limit: 20, skip: 0 });
    assert.deepEqual(getPaging({ page: 3, limit: 5 }), { page: 3, limit: 5, skip: 10 });
    assert.equal(paginationMeta(2, 5, 12).totalPages, 3);
    assert.equal(paginationMeta(1, 20, 0).totalPages, 0);
  });
});