import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.BCRYPT_COST = "4";
process.env.LOG_LEVEL = "silent";

const { env } = await import("../src/config/env.js");
const { createApp } = await import("../src/app.js");
const { disconnectDatabase } = await import("../src/config/db.js");
const { RefreshToken, User } = await import("../src/models/index.js");
const { ensureAdmin } = await import("../src/services/adminAccount.service.js");
const { clearCollections, connectTestDatabase } = await import("./support/testDb.js");
const { TestClient, listen } = await import("./support/client.js");

const PASSWORD = "Test@12345";
const BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ORIGIN = env.clientOrigins[0];
const HIGH = { limit: 100000 };

describe("administrator access against a real database", () => {
  let server;
  let base;

  const newClient = () => new TestClient(base, ORIGIN);

  async function signUp(fullName, email) {
    const client = newClient();
    const res = await client.post("/api/auth/register", { fullName, email, phone: "9841234567", password: PASSWORD });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    return client;
  }

  const makeAdmin = (email) => User.updateOne({ email }, { role: "admin" });

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

  it("admin routes: nobody -> 401, a traveler -> 403, an administrator -> 200", async () => {
    const traveler = await signUp("Plain Traveler", "plain@example.com");
    const admin = await signUp("Some Admin", "someadmin@example.com");
    await makeAdmin("someadmin@example.com");

    const anonymous = await newClient().get("/api/admin/users");
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.json.error.code, "NOT_AUTHENTICATED");

    const refused = await traveler.get("/api/admin/users");
    assert.equal(refused.status, 403);
    assert.equal(refused.json.error.code, "FORBIDDEN");

    const allowed = await admin.get("/api/admin/users");
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers["cache-control"], "no-store");
  });

  it("lists users with filters, search, sorting and pages, and never shows secrets", async () => {
    await clearCollections(User, RefreshToken);

    const admin = await signUp("Admin Test", "admin.list@example.com");
    await signUp("Alice Test", "alice@example.com");
    await signUp("Bob Test", "bob@example.com");
    await signUp("Carol Test", "carol@example.com");
    await makeAdmin("admin.list@example.com");
    await User.updateOne({ email: "carol@example.com" }, { status: "inactive" });

    const all = await admin.get("/api/admin/users");
    assert.equal(all.status, 200);
    assert.equal(all.json.meta.total, 4);
    for (const item of all.json.data) {
      for (const key of ["passwordHash", "tokenVersion", "_id", "__v"]) assert.equal(key in item, false, key);
    }

    assert.equal((await admin.get("/api/admin/users?role=admin")).json.meta.total, 1);
    assert.equal((await admin.get("/api/admin/users?status=inactive")).json.meta.total, 1);
    assert.equal((await admin.get("/api/admin/users?q=bob")).json.meta.total, 1);

    const sorted = await admin.get("/api/admin/users?sort=name");
    assert.deepEqual(
      sorted.json.data.map((item) => item.fullName),
      ["Admin Test", "Alice Test", "Bob Test", "Carol Test"]
    );

    const second = await admin.get("/api/admin/users?sort=name&limit=2&page=2");
    assert.deepEqual(second.json.data.map((item) => item.fullName), ["Bob Test", "Carol Test"]);
    assert.deepEqual(
      [second.json.meta.page, second.json.meta.limit, second.json.meta.total, second.json.meta.totalPages],
      [2, 2, 4, 2]
    );

    assert.equal((await admin.get("/api/admin/users?bogus=1")).status, 400);
    assert.equal((await admin.get("/api/admin/users?limit=1000")).status, 400);
  });

  it("demoting an administrator takes effect on the very next request", async () => {
    const admin = await signUp("Temp Admin", "temp.admin@example.com");
    await makeAdmin("temp.admin@example.com");
    assert.equal((await admin.get("/api/admin/users")).status, 200);

    // The access token still says "admin", but the role is read from the database.
    await User.updateOne({ email: "temp.admin@example.com" }, { role: "user" });

    const res = await admin.get("/api/admin/users");
    assert.equal(res.status, 403);
    assert.equal(res.json.error.code, "FORBIDDEN");
  });

  it("a deactivated administrator is locked out at once", async () => {
    const admin = await signUp("Locked Admin", "locked.admin@example.com");
    await makeAdmin("locked.admin@example.com");
    assert.equal((await admin.get("/api/admin/users")).status, 200);

    await User.updateOne({ email: "locked.admin@example.com" }, { status: "inactive" });

    const res = await admin.get("/api/admin/users");
    assert.equal(res.status, 403);
    assert.equal(res.json.error.code, "ACCOUNT_INACTIVE");
  });

  it("the admin script creates an administrator who can sign in and use admin routes", async () => {
    const ADMIN_PASSWORD = "Admin@1234567";
    const result = await ensureAdmin({
      fullName: "Script Admin",
      email: "script.admin@example.com",
      phone: "9801112233",
      password: ADMIN_PASSWORD,
    });

    assert.equal(result.action, "created");
    assert.equal(result.user.role, "admin");

    const stored = await User.findOne({ email: "script.admin@example.com" }).select("+passwordHash");
    assert.match(stored.passwordHash, BCRYPT);
    assert.equal(stored.passwordHash.includes(ADMIN_PASSWORD), false);

    const client = newClient();
    const login = await client.post("/api/auth/login", { email: "script.admin@example.com", password: ADMIN_PASSWORD });
    assert.equal(login.status, 200);
    assert.equal(login.json.data.user.role, "admin");
    assert.equal((await client.get("/api/admin/users")).status, 200);
  });

  it("the admin script never duplicates, never promotes by accident, and promotes only on request", async () => {
    await ensureAdmin({
      fullName: "Repeat Admin",
      email: "repeat.admin@example.com",
      phone: "9801112233",
      password: "Admin@1234567",
    });
    const again = await ensureAdmin({ email: "repeat.admin@example.com" });
    assert.equal(again.action, "already-admin");
    assert.equal(await User.countDocuments({ email: "repeat.admin@example.com" }), 1);

    await signUp("Future Admin", "future.admin@example.com");

    await assert.rejects(
      () => ensureAdmin({ email: "future.admin@example.com" }),
      (error) => error.status === 409 && error.code === "EMAIL_TAKEN"
    );
    assert.equal((await User.findOne({ email: "future.admin@example.com" })).role, "user");

    const promoted = await ensureAdmin({ email: "future.admin@example.com", promote: true });
    assert.equal(promoted.action, "promoted");
    assert.equal((await User.findOne({ email: "future.admin@example.com" })).role, "admin");

    // Promotion leaves the password alone.
    const login = await newClient().post("/api/auth/login", { email: "future.admin@example.com", password: PASSWORD });
    assert.equal(login.status, 200);
  });
});