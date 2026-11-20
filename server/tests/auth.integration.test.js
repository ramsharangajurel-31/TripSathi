import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.BCRYPT_COST = "4";
process.env.REFRESH_GRACE_SECONDS = "0"; // a replayed token is always treated as theft in these tests
process.env.LOG_LEVEL = "silent";

const jwt = (await import("jsonwebtoken")).default;
const { env } = await import("../src/config/env.js");
const { createApp } = await import("../src/app.js");
const { disconnectDatabase } = await import("../src/config/db.js");
const { RefreshToken, User } = await import("../src/models/index.js");
const { clearCollections, connectTestDatabase } = await import("./support/testDb.js");
const { TestClient, listen } = await import("./support/client.js");

const PASSWORD = "Test@12345";
const BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ORIGIN = env.clientOrigins[0];

let counter = 0;
const newBody = (overrides = {}) => ({
  fullName: "Test Person",
  email: `person${++counter}@example.com`,
  phone: "9841234567",
  password: PASSWORD,
  ...overrides,
});

describe("authentication against a real database", () => {
  let server;
  let base;

  const newClient = () => new TestClient(base, ORIGIN);

  async function signUp(overrides) {
    const client = newClient();
    const body = newBody(overrides);
    const res = await client.post("/api/auth/register", body);
    assert.equal(res.status, 201, JSON.stringify(res.json));
    return { client, body, user: res.json.data.user };
  }

  before(async () => {
    await connectTestDatabase();
    await clearCollections(User, RefreshToken);

    server = await listen(
      createApp({
        rateLimit: { limit: 100000 },
        authLimits: { register: { limit: 100000 }, login: { limit: 100000 }, refresh: { limit: 100000 } },
      })
    );
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server?.close();
    await clearCollections(User, RefreshToken);
    await disconnectDatabase();
  });

  it("registers a user, sets httpOnly cookies and returns no secrets", async () => {
    const { client, body, user } = await signUp();

    assert.equal(user.email, body.email);
    assert.equal(user.role, "user");
    assert.equal(user.status, "active");
    for (const key of ["passwordHash", "tokenVersion", "_id", "__v"]) {
      assert.equal(key in user, false, key);
    }

    assert.ok(client.cookies.has("ts_access"));
    assert.ok(client.cookies.has("ts_refresh"));
    assert.equal(client.lastSetCookies.length, 2);
    for (const line of client.lastSetCookies) assert.match(line, /HttpOnly/i);
  });

  it("stores only a bcrypt hash of the password", async () => {
    const { body } = await signUp();
    const stored = await User.findOne({ email: body.email }).select("+passwordHash");

    assert.match(stored.passwordHash, BCRYPT);
    assert.equal(stored.passwordHash.includes(PASSWORD), false);
  });

  it("rejects a duplicate email in any letter case, bad input, and a smuggled role", async () => {
    const { body } = await signUp();
    const client = newClient();

    const duplicate = await client.post("/api/auth/register", newBody({ email: body.email.toUpperCase() }));
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.json.error.code, "EMAIL_TAKEN");

    const weak = await client.post("/api/auth/register", newBody({ password: "short" }));
    assert.equal(weak.status, 400);
    assert.equal(weak.json.error.code, "VALIDATION_ERROR");
    assert.ok(weak.json.error.details.some((item) => item.field === "password"));

    const smuggled = await client.post("/api/auth/register", { ...newBody(), role: "admin" });
    assert.equal(smuggled.status, 400);
    assert.equal(await User.countDocuments({ role: "admin" }), 0);
  });

  it("GET /me needs the cookie and answers with the public user", async () => {
    const { client, body } = await signUp();

    const anonymous = await newClient().get("/api/auth/me");
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.json.error.code, "NOT_AUTHENTICATED");

    const me = await client.get("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.json.data.user.email, body.email);
    assert.equal(me.json.data.user.fullName, "Test Person");
  });

  it("logs in with the right password; wrong passwords and unknown emails get the same answer", async () => {
    const { body } = await signUp();
    const client = newClient();

    const wrong = await client.post("/api/auth/login", { email: body.email, password: "Wrong@12345" });
    const unknown = await client.post("/api/auth/login", { email: "nobody@example.com", password: PASSWORD });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.json.error.code, "INVALID_CREDENTIALS");
    assert.deepEqual(wrong.json.error, unknown.json.error);

    const ok = await client.post("/api/auth/login", { email: body.email.toUpperCase(), password: PASSWORD });
    assert.equal(ok.status, 200);
    assert.ok(client.cookies.has("ts_access"));

    const stored = await User.findOne({ email: body.email });
    assert.ok(stored.lastLoginAt instanceof Date);
  });

  it("an inactive account cannot log in, and an open session ends at once", async () => {
    const { client, body } = await signUp();
    assert.equal((await client.get("/api/auth/me")).status, 200);

    await User.updateOne({ email: body.email }, { status: "inactive" });

    const me = await client.get("/api/auth/me");
    assert.equal(me.status, 403);
    assert.equal(me.json.error.code, "ACCOUNT_INACTIVE");

    const login = await newClient().post("/api/auth/login", { email: body.email, password: PASSWORD });
    assert.equal(login.status, 403);
    assert.equal(login.json.error.code, "ACCOUNT_INACTIVE");
  });

  it("refresh rotates the session: new cookies each time, and they keep working", async () => {
    const { client } = await signUp();
    const first = client.cookies.get("ts_refresh");

    assert.equal((await client.post("/api/auth/refresh")).status, 200);
    const second = client.cookies.get("ts_refresh");
    assert.notEqual(second, first);

    assert.equal((await client.post("/api/auth/refresh")).status, 200);
    assert.notEqual(client.cookies.get("ts_refresh"), second);

    assert.equal((await client.get("/api/auth/me")).status, 200);
  });

  it("replaying an old refresh token ends the whole session", async () => {
    const { client, user } = await signUp();
    const stolen = client.cookies.get("ts_refresh");

    assert.equal((await client.post("/api/auth/refresh")).status, 200); // legitimate use
    const current = client.cookies.get("ts_refresh");
    assert.notEqual(current, stolen);

    const thief = newClient();
    thief.cookies.set("ts_refresh", stolen);
    const replay = await thief.post("/api/auth/refresh");
    assert.equal(replay.status, 401);
    assert.equal(replay.json.error.code, "SESSION_INVALID");

    // The rightful owner's newer token is revoked too.
    const owner = await client.post("/api/auth/refresh");
    assert.equal(owner.status, 401);
    assert.equal(await RefreshToken.countDocuments({ user: user.id, revokedAt: null }), 0);
  });

  it("logout ends the session and clears the cookies; logging out twice is fine", async () => {
    const { client } = await signUp();
    const refreshToken = client.cookies.get("ts_refresh");

    const out = await client.post("/api/auth/logout");
    assert.equal(out.status, 200);
    assert.equal(client.cookies.size, 0);
    assert.equal((await client.get("/api/auth/me")).status, 401);

    const replay = newClient();
    replay.cookies.set("ts_refresh", refreshToken);
    assert.equal((await replay.post("/api/auth/refresh")).status, 401);

    assert.equal((await newClient().post("/api/auth/logout")).status, 200);
  });

  it("sets the right cookie flags and does not let account data be cached", async () => {
    const { body } = await signUp();
    const client = newClient();
    await client.post("/api/auth/login", { email: body.email, password: PASSWORD });

    const access = client.lastSetCookies.find((line) => line.startsWith("ts_access="));
    const refresh = client.lastSetCookies.find((line) => line.startsWith("ts_refresh="));

    assert.match(access, /HttpOnly/i);
    assert.match(access, /SameSite=Lax/i);
    assert.match(access, /Path=\/api(;|$)/);
    assert.match(access, /Max-Age=900/);
    assert.match(refresh, /Path=\/api\/auth(;|$)/);
    assert.match(refresh, /Max-Age=604800/);
    assert.doesNotMatch(access, /Secure/i); // only added in production

    const me = await client.get("/api/auth/me");
    assert.equal(me.headers["cache-control"], "no-store");
  });

  it("refuses a refresh without a cookie", async () => {
    const res = await newClient().post("/api/auth/refresh");
    assert.equal(res.status, 401);
    assert.equal(res.json.error.code, "NOT_AUTHENTICATED");
  });

  it("refuses a tampered cookie, and tells an expired one apart", async () => {
    const { client, user } = await signUp();
    const token = client.cookies.get("ts_access");

    client.cookies.set("ts_access", `${token.slice(0, -4)}AAAA`);
    const tampered = await client.get("/api/auth/me");
    assert.equal(tampered.status, 401);
    assert.equal(tampered.json.error.code, "INVALID_TOKEN");

    const expired = jwt.sign(
      { role: "user", tv: 0, exp: Math.floor(Date.now() / 1000) - 120 },
      env.auth.accessSecret,
      { algorithm: "HS256", subject: user.id, issuer: "tripsathi", audience: "tripsathi-api" }
    );
    client.cookies.set("ts_access", expired);
    const late = await client.get("/api/auth/me");
    assert.equal(late.status, 401);
    assert.equal(late.json.error.code, "TOKEN_EXPIRED");
  });

  it("limits failed sign-ins only: successes never count, then 429", async () => {
    const { body } = await signUp();
    const limited = await listen(
      createApp({ rateLimit: { limit: 100000 }, authLimits: { login: { limit: 2 } } })
    );

    try {
      const client = new TestClient(`http://127.0.0.1:${limited.address().port}`, ORIGIN);
      const right = { email: body.email, password: PASSWORD };
      const wrong = { email: body.email, password: "Wrong@12345" };

      for (let attempt = 0; attempt < 3; attempt += 1) {
        assert.equal((await client.post("/api/auth/login", right)).status, 200);
      }
      assert.equal((await client.post("/api/auth/login", wrong)).status, 401);
      assert.equal((await client.post("/api/auth/login", wrong)).status, 401);

      const blocked = await client.post("/api/auth/login", wrong);
      assert.equal(blocked.status, 429);
      assert.equal(blocked.json.error.code, "RATE_LIMITED");
      assert.equal((await client.post("/api/auth/login", right)).status, 429);
    } finally {
      limited.close();
    }
  });

  it("refuses to sign in from a website that is not on the allow list", async () => {
    const { body } = await signUp();
    const res = await newClient().post(
      "/api/auth/login",
      { email: body.email, password: PASSWORD },
      { headers: { Origin: "http://evil.example" } }
    );

    assert.equal(res.status, 403);
    assert.equal(res.json.error.code, "CORS_ORIGIN_NOT_ALLOWED");
  });

  it("raising the token version ends access tokens issued before it", async () => {
    const { client, body } = await signUp();
    assert.equal((await client.get("/api/auth/me")).status, 200);

    await User.updateOne({ email: body.email }, { $inc: { tokenVersion: 1 } });

    const me = await client.get("/api/auth/me");
    assert.equal(me.status, 401);
    assert.equal(me.json.error.code, "SESSION_ENDED");
  });
});