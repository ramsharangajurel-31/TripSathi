import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";

// Must be set before the app (and its configuration) is loaded.
process.env.NODE_ENV = "test";

const { createApp } = await import("../src/app.js");
const { env } = await import("../src/config/env.js");

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function request(server, { method = "GET", path, headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: server.address().port, method, path, headers, agent: false },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            // not JSON
          }
          resolve({ status: res.statusCode, headers: res.headers, json });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

describe("API foundation", () => {
  let server;

  before(async () => {
    server = await listen(createApp());
  });
  after(() => server.close());

  it("GET /api/health answers ok in the standard format", async () => {
    const res = await request(server, { path: "/api/health" });
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
    assert.equal(res.json.data.status, "ok");
    assert.equal(typeof res.json.data.uptimeSeconds, "number");
  });

  it("sends security headers, a request id, and hides the framework", async () => {
    const res = await request(server, { path: "/api/health" });
    assert.equal(res.headers["x-powered-by"], undefined);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.match(res.headers["x-request-id"], /^[0-9a-f-]{36}$/);
  });

  it("answers unknown routes with a JSON 404", async () => {
    const res = await request(server, { path: "/api/nothing-here" });
    assert.equal(res.status, 404);
    assert.equal(res.json.success, false);
    assert.equal(res.json.error.code, "NOT_FOUND");
  });

  it("rejects a malformed JSON body with a 400", async () => {
    const res = await request(server, {
      method: "POST",
      path: "/api/nothing-here",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error.code, "INVALID_JSON");
  });

  it("blocks a browser origin that is not on the allow list", async () => {
    const res = await request(server, {
      path: "/api/health",
      headers: { origin: "http://evil.example" },
    });
    assert.equal(res.status, 403);
    assert.equal(res.json.error.code, "CORS_ORIGIN_NOT_ALLOWED");
  });

  it("allows the configured frontend origin, with credentials", async () => {
    const origin = env.clientOrigins[0];
    const res = await request(server, { path: "/api/health", headers: { origin } });
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], origin);
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });
});

describe("rate limiting", () => {
  let server;

  before(async () => {
    server = await listen(createApp({ rateLimit: { limit: 2 } }));
  });
  after(() => server.close());

  it("returns 429 after the limit, but never limits the health check", async () => {
    const first = await request(server, { path: "/api/some-route" });
    const second = await request(server, { path: "/api/some-route" });
    const third = await request(server, { path: "/api/some-route" });

    assert.equal(first.status, 404);
    assert.equal(second.status, 404);
    assert.equal(third.status, 429);
    assert.equal(third.json.error.code, "RATE_LIMITED");

    const health = await request(server, { path: "/api/health" });
    assert.equal(health.status, 200);
  });
});