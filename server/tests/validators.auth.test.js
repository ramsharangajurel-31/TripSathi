import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loginBody, registerBody } from "../src/validators/auth.js";

const valid = () => ({
  fullName: "  Sita Sharma ",
  email: "  Sita@Example.COM ",
  phone: "+977 984-123-4567",
  password: "Test@12345",
});

const failedFields = (result) => result.error.issues.map((issue) => issue.path.join("."));

describe("auth validation", () => {
  it("accepts a valid registration and cleans the values", () => {
    const result = registerBody.safeParse(valid());
    assert.equal(result.success, true);
    assert.deepEqual(result.data, {
      fullName: "Sita Sharma",
      email: "sita@example.com",
      phone: "9841234567",
      password: "Test@12345",
    });
  });

  it("rejects fields that are not listed (no smuggling in a role)", () => {
    assert.equal(registerBody.safeParse({ ...valid(), role: "admin" }).success, false);
    assert.equal(registerBody.safeParse({ ...valid(), status: "active" }).success, false);
    assert.equal(registerBody.safeParse({ ...valid(), passwordHash: "x" }).success, false);
  });

  it("rejects weak passwords", () => {
    for (const password of ["short1", "onlyletters", "12345678", "a1".repeat(40)]) {
      const result = registerBody.safeParse({ ...valid(), password });
      assert.equal(result.success, false, password);
      assert.ok(failedFields(result).includes("password"), password);
    }
    // 72 bytes is the limit; a multi-byte letter counts as more than one byte.
    assert.equal(registerBody.safeParse({ ...valid(), password: "a1".repeat(36) }).success, true);
    assert.equal(registerBody.safeParse({ ...valid(), password: `${"é".repeat(36)}1` }).success, false);
  });

  it("rejects a bad name, email or phone", () => {
    const result = registerBody.safeParse({ ...valid(), fullName: "R2D2", email: "nope", phone: "0141234567" });
    assert.equal(result.success, false);
    for (const field of ["fullName", "email", "phone"]) assert.ok(failedFields(result).includes(field), field);
  });

  it("login needs an email and a password, and nothing else", () => {
    assert.equal(loginBody.safeParse({ email: "a@b.co", password: "x" }).success, true);
    assert.equal(loginBody.safeParse({ email: "a@b.co", password: "" }).success, false);
    assert.equal(loginBody.safeParse({ email: "a@b.co" }).success, false);
    assert.equal(loginBody.safeParse({ email: "a@b.co", password: "x", extra: 1 }).success, false);
    assert.equal(loginBody.safeParse({ email: { $ne: "" }, password: "x" }).success, false);
  });
});