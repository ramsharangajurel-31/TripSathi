import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { addDays, diffInDays, getDurationDays, parseDate, todayISO } from "../src/services/planner/dates.js";

describe("planner dates", () => {
  it("accepts real dates and rejects impossible or badly formed ones", () => {
    for (const good of ["2026-11-20", "2028-02-29", "2026-12-31"]) {
      assert.notEqual(parseDate(good), null, good);
    }
    for (const bad of ["2026-02-31", "2025-02-29", "2026-13-01", "2026-1-5", "20261120", "", null, undefined, 5]) {
      assert.equal(parseDate(bad), null, String(bad));
    }
  });

  it("adds and subtracts days across months, years and leap days", () => {
    assert.equal(addDays("2026-02-27", 2), "2026-03-01");
    assert.equal(addDays("2028-02-28", 1), "2028-02-29");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
    assert.equal(addDays("not a date", 1), "");
  });

  it("counts the days between dates, and trip days inclusively", () => {
    assert.equal(diffInDays("2026-03-10", "2026-03-13"), 3);
    assert.equal(diffInDays("2026-03-13", "2026-03-10"), -3);
    assert.equal(diffInDays("2026-03-28", "2026-04-02"), 5);
    assert.equal(diffInDays("bad", "2026-03-10"), 0);

    assert.equal(getDurationDays("2026-03-10", "2026-03-13"), 4);
    assert.equal(getDurationDays("2026-03-10", "2026-03-10"), 1);
    assert.equal(getDurationDays("2026-03-13", "2026-03-10"), 1);
    assert.equal(getDurationDays("bad", "bad"), 1);
  });

  it("works out today's date in Nepal (UTC+5:45)", () => {
    // 18:00 UTC is 23:45 in Nepal: still the same day.
    assert.equal(todayISO(Date.UTC(2026, 10, 20, 18, 0)), "2026-11-20");
    // 19:00 UTC is 00:45 the next day in Nepal.
    assert.equal(todayISO(Date.UTC(2026, 10, 20, 19, 0)), "2026-11-21");
  });
});