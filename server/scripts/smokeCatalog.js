// Calls the real API against the real, seeded database:  npm run smoke:catalog
// Needs: npm run seed:catalog first. It briefly hides one destination to prove
// the visibility rule and always restores it.

import assert from "node:assert/strict";
import http from "node:http";

// Quiet logs, set BEFORE the app is loaded.
process.env.LOG_LEVEL = "silent";

const { createApp } = await import("../src/app.js");
const { connectDatabase, disconnectDatabase, explainConnectionError } = await import("../src/config/db.js");
const { scrubMongoCredentials } = await import("../src/config/mongoUri.js");
const { Destination } = await import("../src/models/index.js");

let passed = 0;
let failed = 0;
let server;
let base;

async function api(pathAndQuery) {
  const response = await fetch(`${base}${pathAndQuery}`);
  return { status: response.status, body: await response.json() };
}

const query = (params) => `?${new URLSearchParams(params)}`;

async function check(label, run) {
  try {
    await run();
    passed += 1;
    console.log(`ok    ${label}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${label}\n        ${String(error.message).replace(/\s+/g, " ")}`);
  }
}

async function expectTotal(label, pathAndQuery, expected) {
  await check(`${label} -> ${expected}`, async () => {
    const result = await api(pathAndQuery);
    assert.equal(result.status, 200);
    assert.equal(result.body.meta.total, expected);
  });
}

try {
  await connectDatabase();
  server = await new Promise((resolve) => {
    const instance = http.createServer(createApp());
    instance.listen(0, "127.0.0.1", () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;

  // ----- Destinations -----
  await expectTotal("destinations", "/api/destinations", 10);
  await check("destinations: page 2 of limit 3 has 3 items and 4 pages", async () => {
    const { body } = await api(`/api/destinations${query({ limit: 3, page: 2 })}`);
    assert.equal(body.data.length, 3);
    assert.deepEqual([body.meta.page, body.meta.limit, body.meta.total, body.meta.totalPages], [2, 3, 10, 4]);
  });
  await expectTotal("destinations in Gandaki Province", `/api/destinations${query({ province: "Gandaki Province" })}`, 4);
  await expectTotal("destinations for trekking", `/api/destinations${query({ interest: "trekking" })}`, 5);
  await expectTotal("popular destinations", `/api/destinations${query({ popular: "true" })}`, 4);
  await expectTotal("featured destinations", `/api/destinations${query({ featured: "true" })}`, 6);
  await expectTotal("destination search 'gandaki' in the list", `/api/destinations${query({ q: "gandaki" })}`, 4);
  await check("search 'pok' finds only Pokhara", async () => {
    const { status, body } = await api("/api/destinations/search?q=pok");
    assert.equal(status, 200);
    assert.deepEqual(body.data.map((item) => item.slug), ["pokhara"]);
  });
  await check("destination detail by slug has counts 4 attractions and 6 activities", async () => {
    const { status, body } = await api("/api/destinations/pokhara");
    assert.equal(status, 200);
    assert.equal(body.data.slug, "pokhara");
    assert.deepEqual(body.data.counts, { attractions: 4, activities: 6 });
    assert.equal(body.data.verificationStatus, "estimated");
  });
  await check("destination detail by id works too", async () => {
    const { body: list } = await api("/api/destinations?limit=1");
    const { status, body } = await api(`/api/destinations/${list.data[0].id}`);
    assert.equal(status, 200);
    assert.equal(body.data.id, list.data[0].id);
  });
  await check("unknown destination gives 404", async () => {
    const { status, body } = await api("/api/destinations/nowhere");
    assert.equal(status, 404);
    assert.equal(body.error.code, "DESTINATION_NOT_FOUND");
  });

  // ----- Validation and safety -----
  await check("an unknown query parameter gives 400", async () => {
    const { status, body } = await api("/api/destinations?bogus=1");
    assert.equal(status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
  await check("operator-style input (province[$ne]=x) gives 400", async () => {
    assert.equal((await api("/api/destinations?province[$ne]=x")).status, 400);
  });
  await check("limit=1000 and page=0 give 400", async () => {
    assert.equal((await api("/api/destinations?limit=1000")).status, 400);
    assert.equal((await api("/api/destinations?page=0")).status, 400);
  });
  await check("a regex-style search is matched literally (q='.*' finds nothing)", async () => {
    const { body } = await api(`/api/destinations${query({ q: ".*" })}`);
    assert.equal(body.meta.total, 0);
  });

  // ----- Attractions -----
  await expectTotal("attractions", "/api/attractions", 40);
  await expectTotal("attractions in Pokhara", "/api/attractions?destination=pokhara", 4);
  await expectTotal("religious sites", `/api/attractions${query({ type: "Religious site" })}`, 9);
  await expectTotal("attractions with unknown fee", "/api/attractions?fee=unknown", 40);
  await expectTotal("free attractions", "/api/attractions?fee=free", 0);
  await expectTotal("attractions matching 'temple'", "/api/attractions?q=temple", 4);
  await check("attraction detail, and invalid or unknown ids", async () => {
    const { body: list } = await api("/api/attractions?limit=1");
    const first = list.data[0];
    assert.equal("nameKey" in first, false);
    assert.equal("_id" in first, false);

    const found = await api(`/api/attractions/${first.id}`);
    assert.equal(found.status, 200);
    assert.equal(typeof found.body.data.destination.slug, "string");

    assert.equal((await api("/api/attractions/not-an-id")).status, 400);
    assert.equal((await api(`/api/attractions/${"0".repeat(24)}`)).status, 404);
  });

  // ----- Activities -----
  await expectTotal("activities", "/api/activities", 40);
  await expectTotal("activities in Pokhara", "/api/activities?destination=pokhara", 6);
  await expectTotal("challenging activities", "/api/activities?intensity=challenging", 2);
  await expectTotal("free activities (maxCost=0)", "/api/activities?maxCost=0", 4);
  await expectTotal("activities up to NPR 999", "/api/activities?maxCost=999", 33);
  await expectTotal("nature activities", "/api/activities?category=nature", 6);
  await expectTotal("activities matching 'museum'", "/api/activities?q=museum", 2);
  await expectTotal("activities available in June (none are seasonal yet)", "/api/activities?month=6", 40);
  await check("activities sorted by cost, highest first", async () => {
    const { body } = await api("/api/activities?sort=-cost&limit=1");
    assert.equal(body.data[0].costPerPerson, 9000);
  });

  // ----- Inactive records are hidden everywhere -----
  try {
    await Destination.updateOne({ slug: "lumbini" }, { status: "inactive" });

    await expectTotal("[Lumbini hidden] destinations", "/api/destinations", 9);
    await expectTotal("[Lumbini hidden] attractions", "/api/attractions", 36);
    await expectTotal("[Lumbini hidden] activities", "/api/activities", 37);
    await check("[Lumbini hidden] its detail page gives 404 and its children list is empty", async () => {
      assert.equal((await api("/api/destinations/lumbini")).status, 404);
      assert.equal((await api("/api/attractions?destination=lumbini")).body.meta.total, 0);
    });
  } finally {
    await Destination.updateOne({ slug: "lumbini" }, { status: "active" });
  }
  await expectTotal("[Lumbini restored] destinations", "/api/destinations", 10);

  console.log(`\n${passed} checks passed, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
} catch (error) {
  console.error(`Smoke test could not run: ${scrubMongoCredentials(error.message)}`);
  console.error(`Hint: ${explainConnectionError(error)}`);
  process.exitCode = 1;
} finally {
  if (server) server.close();
  await disconnectDatabase();
}