import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.BCRYPT_COST = "4";
process.env.LOG_LEVEL = "silent";

const { env } = await import("../src/config/env.js");
const { createApp } = await import("../src/app.js");
const { disconnectDatabase } = await import("../src/config/db.js");
const { RefreshToken, User } = await import("../src/models/index.js");
const { clearCollections, connectTestDatabase } = await import("./support/testDb.js");
const { TestClient, listen } = await import("./support/client.js");
const { HASH } = await import("./fixtures.js");

const PASSWORD = "Test@12345";
const BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ORIGIN = env.clientOrigins[0];
const HIGH = { limit: 100000 };

let counter = 0;
const newBody = (overrides = {}) => ({
  fullName: "Test Person",
  email: `person${++counter}@example.com`,
  phone: "9841234567",
  password: PASSWORD,
  ...overrides,
});

describe("profile and password against a real database", () => {
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

  const noSecrets = (user) => {
    for (const key of ["passwordHash", "tokenVersion", "_id", "__v"]) assert.equal(key in user, false, key);
  };

  before(async () => {
    await connectTestDatabase();
    await clearCollections(User, RefreshToken);

    server = await listen(
      createApp({
        rateLimit: HIGH,
        authLimits: { register: HIGH, login: HIGH, refresh: HIGH, credentials: HIGH },
      })
    );
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server?.close();
    await clearCollections(User, RefreshToken);
    await disconnectDatabase();
  });

  it("GET /profile needs a session and returns the public user", async () => {
    const { client, body } = await signUp();

    assert.equal((await newClient().get("/api/users/profile")).status, 401);

    const res = await client.get("/api/users/profile");
    assert.equal(res.status, 200);
    assert.equal(res.json.data.user.email, body.email);
    assert.equal(res.headers["cache-control"], "no-store");
    noSecrets(res.json.data.user);
  });

  it("updates profile fields, saves them, and can remove the preferences", async () => {
    const { client, body } = await signUp();

    const res = await client.patch("/api/users/profile", {
      fullName: "  New Name ",
      phone: "+977 985-111-2222",
      location: " Pokhara ",
      travelPreferences: { interests: ["nature", "food"], budgetCategory: "budget", pace: "relaxed" },
    });

    assert.equal(res.status, 200, JSON.stringify(res.json));
    const { user } = res.json.data;
    assert.equal(user.fullName, "New Name");
    assert.equal(user.phone, "9851112222");
    assert.equal(user.location, "Pokhara");
    assert.deepEqual(user.travelPreferences.interests, ["nature", "food"]);
    assert.equal(user.email, body.email);
    noSecrets(user);

    const stored = await User.findOne({ email: body.email });
    assert.equal(stored.fullName, "New Name");
    assert.equal(stored.phone, "9851112222");

    const cleared = await client.patch("/api/users/profile", { travelPreferences: null });
    assert.equal(cleared.status, 200);
    assert.equal("travelPreferences" in cleared.json.data.user, false);
  });

  it("cannot change role, status or any other protected field", async () => {
    const { client, body } = await signUp();

    for (const forbidden of [
      { role: "admin" },
      { status: "inactive" },
      { passwordHash: HASH },
      { tokenVersion: 5 },
      { id: "abc" },
    ]) {
      const res = await client.patch("/api/users/profile", { fullName: "Hacker", ...forbidden });
      assert.equal(res.status, 400, JSON.stringify(forbidden));
      assert.equal(res.json.error.code, "VALIDATION_ERROR");
    }

    const stored = await User.findOne({ email: body.email });
    assert.equal(stored.role, "user");
    assert.equal(stored.status, "active");
    assert.equal(stored.fullName, "Test Person");
  });

  it("changing the email needs the current password", async () => {
    const { client, body } = await signUp();
    const newEmail = `moved.${body.email}`;

    // Same address, different letter case: nothing to change, no password needed.
    const same = await client.patch("/api/users/profile", { email: body.email.toUpperCase(), location: "Here" });
    assert.equal(same.status, 200);

    const missing = await client.patch("/api/users/profile", { email: newEmail });
    assert.equal(missing.status, 400);
    assert.equal(missing.json.error.code, "PASSWORD_REQUIRED");
    assert.equal(missing.json.error.details[0].field, "currentPassword");

    const wrong = await client.patch("/api/users/profile", { email: newEmail, currentPassword: "Wrong@12345" });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.json.error.code, "INVALID_CURRENT_PASSWORD");
    assert.equal((await client.get("/api/users/profile")).json.data.user.email, body.email);

    const right = await client.patch("/api/users/profile", { email: newEmail, currentPassword: PASSWORD });
    assert.equal(right.status, 200);
    assert.equal(right.json.data.user.email, newEmail);

    assert.equal((await newClient().post("/api/auth/login", { email: newEmail, password: PASSWORD })).status, 200);
    assert.equal((await newClient().post("/api/auth/login", { email: body.email, password: PASSWORD })).status, 401);
  });

  it("refuses an email that another account already uses", async () => {
    const first = await signUp();
    const second = await signUp();

    const res = await second.client.patch("/api/users/profile", {
      email: first.body.email,
      currentPassword: PASSWORD,
    });

    assert.equal(res.status, 409);
    assert.equal(res.json.error.code, "EMAIL_TAKEN");
    assert.equal((await second.client.get("/api/users/profile")).json.data.user.email, second.body.email);
  });

  it("rejects a wrong current password, a repeated password and a weak one", async () => {
    const { client } = await signUp();

    const wrong = await client.patch("/api/users/password", { currentPassword: "Wrong@12345", newPassword: "Fresh@67890" });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.json.error.code, "INVALID_CURRENT_PASSWORD");

    const same = await client.patch("/api/users/password", { currentPassword: PASSWORD, newPassword: PASSWORD });
    assert.equal(same.status, 400);
    assert.equal(same.json.error.code, "VALIDATION_ERROR");
    assert.ok(same.json.error.details.some((item) => item.field === "newPassword"));

    const weak = await client.patch("/api/users/password", { currentPassword: PASSWORD, newPassword: "short" });
    assert.equal(weak.status, 400);
  });

  it("changes the password: the old one stops working, the new one works", async () => {
    const { client, body, user } = await signUp();
    const NEW = "Fresh@67890";
    const oldRefresh = client.cookies.get("ts_refresh");

    const res = await client.patch("/api/users/password", { currentPassword: PASSWORD, newPassword: NEW });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    assert.equal(res.setCookies.length, 2);
    assert.notEqual(client.cookies.get("ts_refresh"), oldRefresh);

    const stored = await User.findOne({ email: body.email }).select("+passwordHash");
    assert.match(stored.passwordHash, BCRYPT);
    assert.equal(stored.passwordHash.includes(NEW), false);
    assert.ok(stored.passwordChangedAt instanceof Date);
    assert.equal(stored.tokenVersion, 1);

    assert.equal((await client.get("/api/auth/me")).status, 200); // this device stays signed in
    assert.equal((await newClient().post("/api/auth/login", { email: body.email, password: PASSWORD })).status, 401);
    assert.equal((await newClient().post("/api/auth/login", { email: body.email, password: NEW })).status, 200);
    assert.equal(user.email, body.email);
  });

  it("a password change ends every other device, including their refresh tokens", async () => {
    const { client: phone, body, user } = await signUp();

    const laptop = newClient();
    assert.equal((await laptop.post("/api/auth/login", { email: body.email, password: PASSWORD })).status, 200);
    assert.equal((await laptop.get("/api/auth/me")).status, 200);

    const res = await phone.patch("/api/users/password", { currentPassword: PASSWORD, newPassword: "Fresh@67890" });
    assert.equal(res.status, 200);

    const me = await laptop.get("/api/auth/me");
    assert.equal(me.status, 401);
    assert.equal(me.json.error.code, "SESSION_ENDED");

    const refresh = await laptop.post("/api/auth/refresh");
    assert.equal(refresh.status, 401);
    assert.equal(refresh.json.error.code, "SESSION_INVALID");

    // Only the session that changed the password is left.
    assert.equal(await RefreshToken.countDocuments({ user: user.id, revokedAt: null }), 1);
  });

  it("one person's password change does not affect anyone else", async () => {
    const alice = await signUp();
    const bob = await signUp();

    const res = await alice.client.patch("/api/users/password", {
      currentPassword: PASSWORD,
      newPassword: "Fresh@67890",
    });
    assert.equal(res.status, 200);

    assert.equal((await bob.client.get("/api/auth/me")).status, 200);
    assert.equal((await bob.client.post("/api/auth/refresh")).status, 200);
  });

  it("limits wrong current-password attempts, then answers 429", async () => {
    const limited = await listen(
      createApp({
        rateLimit: HIGH,
        authLimits: { register: HIGH, login: HIGH, refresh: HIGH, credentials: { limit: 2 } },
      })
    );

    try {
      const client = new TestClient(`http://127.0.0.1:${limited.address().port}`, ORIGIN);
      assert.equal((await client.post("/api/auth/register", newBody())).status, 201);

      const wrong = { currentPassword: "Wrong@12345", newPassword: "Fresh@67890" };
      assert.equal((await client.patch("/api/users/password", wrong)).status, 400);
      assert.equal((await client.patch("/api/users/password", wrong)).status, 400);

      const blocked = await client.patch("/api/users/password", wrong);
      assert.equal(blocked.status, 429);
      assert.equal(blocked.json.error.code, "RATE_LIMITED");
    } finally {
      limited.close();
    }
  });
});