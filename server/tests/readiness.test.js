import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";

const { createApp } = await import("../src/app.js");
const { listen, request } = await import("./helpers.js");

// The tests never connect to a database, so readiness must say "not ready"
// while liveness keeps saying "ok".
describe("health checks without a database", () => {
  let server;

  before(async () => {
    server = await listen(createApp());
  });
  after(() => server.close());

  it("/api/health/ready answers 503 NOT_READY when the database is not connected", async () => {
    const res = await request(server, { path: "/api/health/ready" });
    assert.equal(res.status, 503);
    assert.equal(res.json.success, false);
    assert.equal(res.json.error.code, "NOT_READY");
    assert.equal(res.json.error.details.database, "disconnected");
  });

  it("/api/health still answers 200 (the process itself is fine)", async () => {
    const res = await request(server, { path: "/api/health" });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.status, "ok");
  });
});