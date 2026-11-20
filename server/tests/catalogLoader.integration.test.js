import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";

const { disconnectDatabase } = await import("../src/config/db.js");
const { Activity, Destination } = await import("../src/models/index.js");
const { loadCatalog } = await import("../src/services/planner/catalogLoader.js");
const { clearCollections, connectTestDatabase } = await import("./support/testDb.js");
const { validActivity, validDestination } = await import("./fixtures.js");

describe("loading the planner catalog from the database", () => {
  before(async () => {
    await connectTestDatabase();
    await clearCollections(Destination, Activity);
  });

  after(async () => {
    await clearCollections(Destination, Activity);
    await disconnectDatabase();
  });

  it("includes active records only, with each activity pointing at its destination slug", async () => {
    const visible = await Destination.create(validDestination());
    const hidden = await Destination.create({ ...validDestination(), name: "Hidden Place", status: "inactive" });

    await Activity.create({ ...validActivity(), destination: visible._id, name: "Boating", costPerPerson: 800 });
    await Activity.create({ ...validActivity(), destination: visible._id, name: "Closed activity", status: "inactive" });
    await Activity.create({ ...validActivity(), destination: hidden._id, name: "Hidden destination activity" });

    const catalog = await loadCatalog();

    assert.deepEqual(catalog.destinations.map((item) => item.slug), ["pokhara"]);
    assert.equal(catalog.getPlaceName("pokhara"), "Pokhara");
    assert.equal(catalog.getDestination("pokhara").costPerDay.budget.stay, 1000);
    assert.equal(catalog.getDestination("hidden-place"), null);

    assert.deepEqual(catalog.activities.map((item) => item.name), ["Boating"]);
    const [activity] = catalog.activities;
    assert.match(activity.id, /^[a-f0-9]{24}$/);
    assert.equal(activity.destination, "pokhara");
    assert.equal(activity.costPerPerson, 800);
    assert.equal(catalog.getActivity(activity.id).name, "Boating");
  });
});