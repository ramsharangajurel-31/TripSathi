import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createCatalog } from "../src/services/planner/catalog.js";

const catalog = createCatalog({
  destinations: [
    { slug: "pokhara", name: "Pokhara" },
    { slug: "chitwan", name: "Chitwan" },
  ],
  activities: [
    { id: "a1", destination: "pokhara", name: "Boating" },
    { id: "a2", destination: "pokhara", name: "Hiking" },
    { id: "a3", destination: "chitwan", name: "Safari" },
  ],
});

describe("planner catalog", () => {
  it("finds destinations and activities, and gives null for unknown ones", () => {
    assert.equal(catalog.getDestination("pokhara").name, "Pokhara");
    assert.equal(catalog.getActivity("a3").name, "Safari");
    assert.equal(catalog.getDestination("nowhere"), null);
    assert.equal(catalog.getActivity("zzz"), null);
  });

  it("groups activities by destination and hands out copies", () => {
    const list = catalog.getActivitiesByDestination("pokhara");
    assert.deepEqual(list.map((item) => item.id), ["a1", "a2"]);

    list.pop();
    assert.equal(catalog.getActivitiesByDestination("pokhara").length, 2);
    assert.deepEqual(catalog.getActivitiesByDestination("nowhere"), []);
  });

  it("falls back to the id when a place has no name", () => {
    assert.equal(catalog.getPlaceName("chitwan"), "Chitwan");
    assert.equal(catalog.getPlaceName("atlantis"), "atlantis");
  });
});