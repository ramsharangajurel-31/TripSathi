import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deriveTestUri } from "./support/testDb.js";

describe("test database address", () => {
  it("adds _test to the database name and keeps the rest", () => {
    assert.equal(
      deriveTestUri("mongodb+srv://u:p@c.mongodb.net/tripsathi?retryWrites=true&w=majority"),
      "mongodb+srv://u:p@c.mongodb.net/tripsathi_test?retryWrites=true&w=majority"
    );
  });

  it("keeps a name that already ends in _test", () => {
    assert.equal(
      deriveTestUri("mongodb://127.0.0.1:27017/tripsathi_test"),
      "mongodb://127.0.0.1:27017/tripsathi_test"
    );
  });

  it("returns null without a database name or for nonsense", () => {
    assert.equal(deriveTestUri("mongodb+srv://u:p@c.mongodb.net/?retryWrites=true"), null);
    assert.equal(deriveTestUri("not a uri"), null);
    assert.equal(deriveTestUri(undefined), null);
  });
});