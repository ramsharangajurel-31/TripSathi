import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCurrency } from "../src/services/planner/format.js";

describe("currency formatting", () => {
  it("groups digits the Nepali way and rounds to whole rupees", () => {
    assert.equal(formatCurrency(36225), "NPR 36,225");
    assert.equal(formatCurrency(125000), "NPR 1,25,000");
    assert.equal(formatCurrency(10000000), "NPR 1,00,00,000");
    assert.equal(formatCurrency(0), "NPR 0");
    assert.equal(formatCurrency(999.5), "NPR 1,000");
    assert.equal(formatCurrency("4300"), "NPR 4,300");
  });

  it("shows a dash for missing or invalid values", () => {
    for (const value of [null, undefined, "", "abc", NaN, Infinity]) {
      assert.equal(formatCurrency(value), "—", String(value));
    }
  });
});