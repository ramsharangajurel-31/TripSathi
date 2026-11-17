import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Attraction } from "../src/models/index.js";
import { errorPaths, findIndex, validAttraction } from "./fixtures.js";

const make = (changes = {}) => new Attraction({ ...validAttraction(), ...changes });

describe("Attraction model", () => {
  it("accepts a valid attraction; the fee is unknown (null) unless set", async () => {
    const attraction = make();
    assert.deepEqual(await errorPaths(attraction), []);
    assert.equal(attraction.entryFee, null);
    assert.equal(attraction.status, "active");
    assert.equal(attraction.verificationStatus, "estimated");
  });

  it("accepts unknown, free and paid fees, and rejects negative or fractional ones", async () => {
    for (const entryFee of [null, 0, 200]) {
      assert.deepEqual(await errorPaths(make({ entryFee })), [], String(entryFee));
    }
    for (const entryFee of [-5, 12.5, 100001]) {
      assert.ok((await errorPaths(make({ entryFee }))).includes("entryFee"), String(entryFee));
    }
  });

  it("derives a lowercase name key with single spaces", async () => {
    const attraction = make({ name: "  Phewa   Lake " });
    await errorPaths(attraction);
    assert.equal(attraction.nameKey, "phewa lake");
  });

  it("checks opening hours", async () => {
    const good = make({ openingHours: [{ day: 1, opens: "06:00", closes: "18:00" }] });
    assert.deepEqual(await errorPaths(good), []);

    const backwards = make({ openingHours: [{ day: 1, opens: "18:00", closes: "06:00" }] });
    assert.ok((await errorPaths(backwards)).some((path) => path.startsWith("openingHours")));

    const malformed = make({ openingHours: [{ day: 8, opens: "6am", closes: "18:00" }] });
    assert.ok((await errorPaths(malformed)).some((path) => path.startsWith("openingHours")));
  });

  it("rejects an unknown type", async () => {
    assert.ok((await errorPaths(make({ type: "Spaceport" }))).includes("type"));
  });

  it("has a unique name index per destination", () => {
    const index = findIndex(Attraction, (fields) => fields.destination === 1 && fields.nameKey === 1);
    assert.equal(index?.options.unique, true);
  });
});