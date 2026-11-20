import assert from "node:assert/strict";
import { describe, it } from "node:test";

import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";

const { env } = await import("../src/config/env.js");
const { generateRefreshToken, hashToken, signAccessToken, verifyAccessToken } =
  await import("../src/utils/tokens.js");

const user = { _id: "64b7f0c2a1b2c3d4e5f60718", role: "user", tokenVersion: 2 };
const claims = { algorithm: "HS256", subject: user._id, issuer: "tripsathi", audience: "tripsathi-api" };
const base64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("tokens", () => {
  it("signs an access token that verifies and carries the right claims", () => {
    const payload = verifyAccessToken(signAccessToken(user));
    assert.equal(payload.sub, user._id);
    assert.equal(payload.role, "user");
    assert.equal(payload.tv, 2);
    assert.equal(payload.iss, "tripsathi");
    assert.ok(payload.exp - payload.iat === env.auth.accessTtlSeconds);
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken(user);
    const [header, body, signature] = token.split(".");
    const forgedBody = base64url({ ...JSON.parse(Buffer.from(body, "base64url")), role: "admin" });

    assert.throws(() => verifyAccessToken(`${header}.${forgedBody}.${signature}`), /invalid signature/);
  });

  it("rejects a token signed with another secret", () => {
    const token = jwt.sign({ role: "user", tv: 0 }, "a-completely-different-secret-value-0000", {
      ...claims,
      expiresIn: 60,
    });
    assert.throws(() => verifyAccessToken(token), /invalid signature/);
  });

  it("rejects an expired token with TokenExpiredError", () => {
    const token = jwt.sign(
      { role: "user", tv: 0, exp: Math.floor(Date.now() / 1000) - 120 },
      env.auth.accessSecret,
      claims
    );
    assert.throws(() => verifyAccessToken(token), (error) => error.name === "TokenExpiredError");
  });

  it("rejects an unsigned token that claims alg=none", () => {
    const unsigned = `${base64url({ alg: "none", typ: "JWT" })}.${base64url({
      sub: user._id,
      role: "admin",
      tv: 0,
      iss: "tripsathi",
      aud: "tripsathi-api",
      exp: Math.floor(Date.now() / 1000) + 600,
    })}.`;

    assert.throws(() => verifyAccessToken(unsigned));
  });

  it("makes random refresh tokens and hashes them the same way every time", () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    assert.notEqual(first, second);
    assert.match(first, /^[A-Za-z0-9_-]{64}$/);
    assert.match(hashToken(first), /^[a-f0-9]{64}$/);
    assert.equal(hashToken(first), hashToken(first));
    assert.notEqual(hashToken(first), hashToken(second));
  });
});