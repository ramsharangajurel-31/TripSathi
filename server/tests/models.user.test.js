import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { User } from "../src/models/index.js";
import { errorPaths, findIndex, validUser } from "./fixtures.js";

describe("User model", () => {
  it("accepts a valid user and applies defaults", async () => {
    const user = new User(validUser());
    assert.deepEqual(await errorPaths(user), []);
    assert.equal(user.role, "user");
    assert.equal(user.status, "active");
  });

  it("lowercases the email and normalises the phone number", () => {
    const user = new User({ ...validUser(), email: "  Sita@Example.COM ", phone: "+977 984-123-4567" });
    assert.equal(user.email, "sita@example.com");
    assert.equal(user.phone, "9841234567");
  });

  it("refuses a plain-text password in passwordHash", async () => {
    const paths = await errorPaths(new User({ ...validUser(), passwordHash: "Demo@1234" }));
    assert.ok(paths.includes("passwordHash"));
  });

  it("rejects a bad name, email or phone number", async () => {
    const paths = await errorPaths(
      new User({ ...validUser(), fullName: "R2D2", email: "not-an-email", phone: "0141234567" })
    );
    for (const path of ["fullName", "email", "phone"]) assert.ok(paths.includes(path), path);
  });

  it("rejects an unknown role and status", async () => {
    const paths = await errorPaths(new User({ ...validUser(), role: "superuser", status: "banned" }));
    assert.ok(paths.includes("role"));
    assert.ok(paths.includes("status"));
  });

  it("hides the password hash and internal fields in JSON", () => {
    const json = new User(validUser()).toJSON();
    assert.equal("passwordHash" in json, false);
    assert.equal("_id" in json, false);
    assert.equal("__v" in json, false);
    assert.equal(typeof json.id, "string");
    assert.equal(json.fullName, "Sita Sharma");
  });

  it("rejects an unknown interest in travel preferences", async () => {
    const paths = await errorPaths(
      new User({ ...validUser(), travelPreferences: { interests: ["skydiving"] } })
    );
    assert.ok(paths.some((path) => path.startsWith("travelPreferences.interests")));
  });

  it("has a unique index on email", () => {
    const index = findIndex(User, (fields) => fields.email === 1);
    assert.ok(index, "email index missing");
    assert.equal(index.options.unique, true);
  });
});