import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adminPasswordField } from "../src/validators/auth.js";
import { adminUsersQuery, changePasswordBody, updateProfileBody } from "../src/validators/users.js";

const failedFields = (result) => result.error.issues.map((issue) => issue.path.join("."));

describe("profile validation", () => {
  it("accepts a partial update and cleans the values", () => {
    const result = updateProfileBody.safeParse({
      fullName: "  New Name ",
      phone: "+977 985-111-2222",
      location: "  Pokhara ",
      email: " New@Example.COM ",
    });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, {
      fullName: "New Name",
      phone: "9851112222",
      location: "Pokhara",
      email: "new@example.com",
    });
  });

  it("rejects an empty update and every field a user must not set", () => {
    assert.equal(updateProfileBody.safeParse({}).success, false);
    assert.equal(updateProfileBody.safeParse({ currentPassword: "x" }).success, false);

    for (const forbidden of [
      { role: "admin" },
      { status: "inactive" },
      { passwordHash: "x" },
      { tokenVersion: 5 },
      { id: "x" },
      { createdAt: "2020-01-01" },
      { lastLoginAt: "2020-01-01" },
    ]) {
      const result = updateProfileBody.safeParse({ fullName: "Valid Name", ...forbidden });
      assert.equal(result.success, false, JSON.stringify(forbidden));
    }
  });

  it("only accepts image addresses and paths, or an empty string to remove it", () => {
    for (const profileImage of ["", "https://img.example.org/a.png", "/images/me.png"]) {
      assert.equal(updateProfileBody.safeParse({ profileImage }).success, true, profileImage);
    }
    for (const profileImage of ["data:image/png;base64,AAAA", "//evil.example/x.png", "javascript:alert(1)"]) {
      assert.equal(updateProfileBody.safeParse({ profileImage }).success, false, profileImage);
    }
  });

  it("rejects a bad name, email, phone or location", () => {
    const result = updateProfileBody.safeParse({
      fullName: "R2D2",
      email: "nope",
      phone: "0141234567",
      location: "x".repeat(101),
    });

    assert.equal(result.success, false);
    for (const field of ["fullName", "email", "phone", "location"]) {
      assert.ok(failedFields(result).includes(field), field);
    }
  });

  it("checks travel preferences, and null removes them", () => {
    const good = {
      interests: ["nature", "food"],
      budgetCategory: "budget",
      accommodation: "hotel",
      transport: "flight",
      intensity: "easy",
      pace: "relaxed",
    };
    assert.equal(updateProfileBody.safeParse({ travelPreferences: good }).success, true);
    assert.equal(updateProfileBody.safeParse({ travelPreferences: null }).success, true);

    for (const travelPreferences of [
      { interests: ["skydiving"] },
      { interests: ["nature", "nature"] },
      { budgetCategory: "luxury" },
      { surprise: true },
    ]) {
      assert.equal(
        updateProfileBody.safeParse({ travelPreferences }).success,
        false,
        JSON.stringify(travelPreferences)
      );
    }
  });
});

describe("password change validation", () => {
  const body = { currentPassword: "Test@12345", newPassword: "Fresh@67890" };

  it("accepts a different, strong new password", () => {
    assert.equal(changePasswordBody.safeParse(body).success, true);
  });

  it("rejects a repeated, weak, missing or extra value", () => {
    const same = changePasswordBody.safeParse({ ...body, newPassword: body.currentPassword });
    assert.equal(same.success, false);
    assert.ok(failedFields(same).includes("newPassword"));

    assert.equal(changePasswordBody.safeParse({ ...body, newPassword: "short1" }).success, false);
    assert.equal(changePasswordBody.safeParse({ currentPassword: "x" }).success, false);
    assert.equal(changePasswordBody.safeParse({ ...body, role: "admin" }).success, false);
  });
});

describe("administrator input", () => {
  it("needs at least 12 characters, a letter and a number", () => {
    assert.equal(adminPasswordField.safeParse("Short@123").success, false);
    assert.equal(adminPasswordField.safeParse("alllettersonlylong").success, false);
    assert.equal(adminPasswordField.safeParse("LongEnough1x").success, true);
  });

  it("validates the admin user-list query", () => {
    const good = adminUsersQuery.safeParse({ role: "admin", status: "inactive", q: "al", sort: "-createdAt", page: "2", limit: "10" });
    assert.equal(good.success, true);
    assert.equal(good.data.page, 2);

    for (const bad of [{ role: "root" }, { sort: "passwordHash" }, { q: "a" }, { extra: "1" }, { limit: "1000" }]) {
      assert.equal(adminUsersQuery.safeParse(bad).success, false, JSON.stringify(bad));
    }
  });
});