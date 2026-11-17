import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { slugify } from "../src/utils/slug.js";

describe("slugify", () => {
  it("makes lowercase hyphenated slugs", () => {
    assert.equal(slugify("Everest Region"), "everest-region");
    assert.equal(slugify("  Ghandruk (Annapurna)! "), "ghandruk-annapurna");
  });

  it("removes accents", () => {
    assert.equal(slugify("Café Réveil"), "cafe-reveil");
  });

  it("returns an empty string when there are no Latin letters or digits", () => {
    assert.equal(slugify("   "), "");
    assert.equal(slugify("काठमाडौं"), "");
  });
});