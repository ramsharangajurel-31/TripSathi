import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Activity } from "../src/models/index.js";
import { errorPaths, findIndex, validActivity } from "./fixtures.js";

const make = (changes = {}) => new Activity({ ...validActivity(), ...changes });
const hasPath = (paths, name) => paths.some((path) => path === name || path.startsWith(`${name}.`));

describe("Activity model", () => {
  it("accepts a valid activity and applies defaults", async () => {
    const activity = make();
    assert.deepEqual(await errorPaths(activity), []);
    assert.deepEqual([...activity.seasonalAvailability], []);
    assert.deepEqual([...activity.restrictions], []);
    assert.equal(activity.status, "active");
  });

  it("limits the duration to 0.5 to 24 hours", async () => {
    for (const durationHours of [0.5, 24]) {
      assert.deepEqual(await errorPaths(make({ durationHours })), [], String(durationHours));
    }
    for (const durationHours of [0, 0.25, 25]) {
      assert.ok((await errorPaths(make({ durationHours }))).includes("durationHours"), String(durationHours));
    }
  });

  it("requires a whole, non-negative cost (0 means free)", async () => {
    assert.deepEqual(await errorPaths(make({ costPerPerson: 0 })), []);
    for (const costPerPerson of [-1, 12.5]) {
      assert.ok((await errorPaths(make({ costPerPerson }))).includes("costPerPerson"), String(costPerPerson));
    }
  });

  it("accepts months 1 to 12 once each", async () => {
    assert.deepEqual(await errorPaths(make({ seasonalAvailability: [11, 12, 1, 2] })), []);
    for (const months of [[0], [13], [3, 3], [1.5]]) {
      assert.ok(
        hasPath(await errorPaths(make({ seasonalAvailability: months })), "seasonalAvailability"),
        JSON.stringify(months)
      );
    }
  });

  it("rejects unknown intensity, time, type, and more than 10 restrictions", async () => {
    const paths = await errorPaths(make({ intensity: "extreme", bestTime: "midnight", category: "sports" }));
    for (const name of ["intensity", "bestTime", "category"]) assert.ok(paths.includes(name), name);

    const many = Array.from({ length: 11 }, (_, i) => `Note ${i}`);
    assert.ok((await errorPaths(make({ restrictions: many }))).includes("restrictions"));
  });

  it("has a unique name index per destination and a text-search index", () => {
    const unique = findIndex(Activity, (fields) => fields.destination === 1 && fields.nameKey === 1);
    assert.equal(unique?.options.unique, true);

    const text = findIndex(Activity, (fields) => fields.name === "text");
    assert.equal(text?.options.name, "activity_text");
  });
});