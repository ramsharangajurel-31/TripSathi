import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.NODE_ENV = "test";

const { evaluateRefreshRecord } = await import("../src/services/session.service.js");
const { requireRole } = await import("../src/middleware/auth.js");

const NOW = Date.parse("2026-11-20T10:00:00Z");
const record = (changes = {}) => ({
  revokedAt: undefined,
  revokedReason: undefined,
  expiresAt: new Date(NOW + 60_000),
  ...changes,
});

describe("refresh token decisions", () => {
  it("accepts a live, unused token", () => {
    assert.equal(evaluateRefreshRecord(record(), NOW, 10_000), "ok");
  });

  it("recognises an expired token", () => {
    assert.equal(evaluateRefreshRecord(record({ expiresAt: new Date(NOW - 1) }), NOW, 10_000), "expired");
  });

  it("tells two tabs refreshing together (grace window) from a replayed token", () => {
    const rotatedAgo = (ms) => record({ revokedAt: new Date(NOW - ms), revokedReason: "rotated" });

    assert.equal(evaluateRefreshRecord(rotatedAgo(5_000), NOW, 10_000), "rotated-recently");
    assert.equal(evaluateRefreshRecord(rotatedAgo(20_000), NOW, 10_000), "reused");
    assert.equal(evaluateRefreshRecord(rotatedAgo(1), NOW, 0), "reused");
  });

  it("a token ended on purpose never gets the grace window", () => {
    for (const revokedReason of ["logout", "password", "reuse", undefined]) {
      const ended = record({ revokedAt: new Date(NOW - 1_000), revokedReason });
      assert.equal(evaluateRefreshRecord(ended, NOW, 10_000), "revoked", String(revokedReason));
    }
  });
});

describe("role check", () => {
  const run = (user, roles) => {
    let received;
    requireRole(...roles)({ user }, {}, (error) => {
      received = error;
    });
    return received;
  };

  it("lets the right role through and refuses everyone else", () => {
    assert.equal(run({ role: "admin" }, ["admin"]), undefined);
    assert.equal(run({ role: "user" }, ["admin"]).status, 403);
    assert.equal(run({ role: "user" }, ["admin", "user"]), undefined);
    assert.equal(run(undefined, ["admin"]).status, 401);
  });
});