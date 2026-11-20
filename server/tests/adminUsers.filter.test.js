import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildUserFilter } from "../src/services/adminUsers.service.js";

describe("admin user filter", () => {
  it("is empty when nothing is asked for (everyone is listed)", () => {
    assert.deepEqual(buildUserFilter({}), {});
  });

  it("filters by role and status and searches name, email and phone literally", () => {
    const filter = buildUserFilter({ role: "admin", status: "active", q: "a.b" });

    assert.equal(filter.role, "admin");
    assert.equal(filter.status, "active");
    assert.equal(filter.$or.length, 3);
    assert.equal(filter.$or[0].fullName.source, "a\\.b");
    assert.equal(filter.$or[0].fullName.flags, "i");
    assert.equal(filter.$or[0].fullName.test("axb"), false);
  });
});