import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateRequirements } from "../src/services/planner/generator.js";
import { TODAY, fieldsOf, validInput } from "./support/plannerInput.js";
import { loadSeedCatalog } from "./support/seedCatalog.js";

const catalog = loadSeedCatalog();
const check = (overrides, options) =>
  validateRequirements(catalog, validInput(overrides), { today: TODAY, ...options });
const failing = (overrides, options) => fieldsOf(check(overrides, options).errors);
const messageFor = (overrides, field) => check(overrides).errors.find((error) => error.field === field)?.message;

describe("trip requirements", () => {
  it("accepts valid input and cleans it", () => {
    const { errors, value } = check({
      startingLocation: " pokhara ",
      destinationIds: ["pokhara", "chitwan"],
      budgetCategory: undefined,
      preferences: undefined,
      description: "  Family trip  ",
    });

    assert.deepEqual(errors, []);
    assert.equal(value.startingLocation, "Pokhara");
    assert.deepEqual(value.destinationIds, ["chitwan", "pokhara"]); // sorted
    assert.equal(value.budgetCategory, "standard");
    assert.deepEqual(value.preferences, {});
    assert.equal(value.children, 0);
    assert.equal(value.description, "Family trip");
    assert.equal(value.notes, "");
  });

  it("reports every problem at once, and copes with input that is not an object", () => {
    const { errors } = validateRequirements(catalog, {}, { today: TODAY });
    for (const field of ["startingLocation", "destinationIds", "departureDate", "returnDate", "adults", "budgetTotal", "interests"]) {
      assert.ok(fieldsOf(errors).includes(field), field);
    }

    for (const input of [null, "text", [], 5]) {
      assert.ok(validateRequirements(catalog, input, { today: TODAY }).errors.length >= 7);
    }
  });

  it("checks the destinations", () => {
    assert.match(messageFor({ destinationIds: ["atlantis"] }, "destinationIds"), /atlantis/);
    assert.match(messageFor({ destinationIds: ["pokhara", "pokhara"] }, "destinationIds"), /only once/);
    assert.match(messageFor({ destinationIds: ["a", "b", "c", "d", "e"] }, "destinationIds"), /up to 4/);
    assert.ok(failing({ destinationIds: [] }).includes("destinationIds"));
    assert.ok(failing({ destinationIds: [1] }).includes("destinationIds"));
    assert.ok(failing({ destinationIds: "pokhara" }).includes("destinationIds"));
    assert.ok(failing({ startingLocation: "Biratnagar" }).includes("startingLocation"));
  });

  it("checks the dates", () => {
    assert.ok(failing({ departureDate: "2027-02-31" }).includes("departureDate"));
    assert.ok(failing({ returnDate: "13/03/2027" }).includes("returnDate"));
    assert.ok(failing({ returnDate: "2027-03-09" }).includes("returnDate"));

    assert.ok(failing({ departureDate: "2026-12-31", returnDate: "2027-01-02" }).includes("departureDate"));
    assert.deepEqual(
      failing({ departureDate: "2026-12-31", returnDate: "2027-01-02" }, { allowPastDates: true }),
      []
    );

    assert.ok(failing({ departureDate: "2027-03-01", returnDate: "2027-03-31" }).includes("returnDate")); // 31 days
    assert.deepEqual(failing({ departureDate: "2027-03-01", returnDate: "2027-03-30" }), []); // 30 days

    assert.match(
      messageFor({ destinationIds: ["pokhara", "chitwan"], departureDate: "2027-03-10", returnDate: "2027-03-10" }, "returnDate"),
      /at least 2 days/
    );
  });

  it("checks travelers and budget", () => {
    for (const adults of [0, 21, 1.5, "3", null]) assert.ok(failing({ adults }).includes("adults"), String(adults));
    for (const adults of [1, 20]) assert.deepEqual(failing({ adults }), [], String(adults));

    for (const children of [-1, 11, 2.5, "1"]) assert.ok(failing({ children }).includes("children"), String(children));
    assert.deepEqual(failing({ children: 10 }), []);

    for (const budgetTotal of [4999, 10_000_001, "45000", 45000.5, null]) {
      assert.ok(failing({ budgetTotal }).includes("budgetTotal"), String(budgetTotal));
    }
    for (const budgetTotal of [5000, 10_000_000]) assert.deepEqual(failing({ budgetTotal }), [], String(budgetTotal));
  });

  it("checks interests, budget level and preferences", () => {
    for (const interests of [[], ["skydiving"], ["nature", "nature"], "nature"]) {
      assert.ok(failing({ interests }).includes("interests"), JSON.stringify(interests));
    }
    assert.ok(failing({ budgetCategory: "luxury" }).includes("budgetCategory"));

    const bad = failing({ preferences: { accommodation: "castle", transport: "teleport", intensity: "extreme", pace: "turbo" } });
    for (const field of ["accommodation", "transport", "intensity", "pace"]) {
      assert.ok(bad.includes(`preferences.${field}`), field);
    }
    assert.ok(failing({ preferences: "hotel" }).includes("preferences"));
  });

  it("limits the length of free text", () => {
    assert.ok(failing({ description: "a".repeat(501) }).includes("description"));
    assert.deepEqual(failing({ description: "a".repeat(500) }), []);
    assert.ok(failing({ notes: "a".repeat(501) }).includes("notes"));
    assert.ok(failing({ notes: 5 }).includes("notes"));
    assert.ok(failing({ preferences: { special: "a".repeat(301) } }).includes("preferences.special"));
  });
});