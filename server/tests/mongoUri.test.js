import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inspectMongoUri, scrubMongoCredentials } from "../src/config/mongoUri.js";

describe("MongoDB connection string checks", () => {
  it("accepts an Atlas string and reports host and database, not credentials", () => {
    const result = inspectMongoUri(
      "mongodb+srv://user:secret@cluster0.abc12.mongodb.net/tripsathi?retryWrites=true&w=majority"
    );
    assert.equal(result.ok, true);
    assert.equal(result.host, "cluster0.abc12.mongodb.net");
    assert.equal(result.database, "tripsathi");
    assert.equal(result.hasCredentials, true);
    assert.equal(JSON.stringify(result).includes("secret"), false);
  });

  it("rejects a string with no database name (slash, then query)", () => {
    const result = inspectMongoUri("mongodb+srv://user:secret@cluster0.abc12.mongodb.net/?retryWrites=true");
    assert.equal(result.ok, false);
    assert.match(result.reason, /database name/);
    assert.equal(result.reason.includes("secret"), false);
  });

  it("rejects a string with no database name (no slash at all)", () => {
    const result = inspectMongoUri("mongodb+srv://user:secret@cluster0.abc12.mongodb.net?retryWrites=true");
    assert.equal(result.ok, false);
    assert.match(result.reason, /database name/);
  });

  it("rejects the wrong scheme and empty values", () => {
    assert.equal(inspectMongoUri("http://localhost/tripsathi").ok, false);
    assert.equal(inspectMongoUri("").ok, false);
    assert.equal(inspectMongoUri(undefined).ok, false);
  });

  it("explains an unencoded @ in the password without repeating it", () => {
    const result = inspectMongoUri("mongodb+srv://user:p@ss@cluster0.abc12.mongodb.net/tripsathi");
    assert.equal(result.ok, false);
    assert.match(result.reason, /URL-encoded/);
    assert.equal(result.reason.includes("p@ss"), false);
  });

  it("accepts a local database without credentials", () => {
    const result = inspectMongoUri("mongodb://127.0.0.1:27017/tripsathi");
    assert.equal(result.ok, true);
    assert.equal(result.hasCredentials, false);
    assert.equal(result.host, "127.0.0.1:27017");
  });

  it("hides credentials in any text", () => {
    const cleaned = scrubMongoCredentials(
      "failed for mongodb+srv://tripsathi_dev:f2mzPCMNrRzqKaEp@cluster0.abc12.mongodb.net/tripsathi, retrying"
    );
    assert.equal(cleaned.includes("secret"), false);
    assert.equal(cleaned.includes("user:"), false);
    assert.match(cleaned, /cluster0\.abc12\.mongodb\.net/);
  });
});

describe("placeholder connection strings", () => {
  it("rejects the example placeholders", () => {
    const examples = [
      "mongodb+srv://tripsathi_dev:f2mzPCMNrRzqKaEp@YOUR-CLUSTER.mongodb.net/tripsathi?retryWrites=true",
      "mongodb+srv://tripsathi_dev:<f2mzPCMNrRzqKaEp>@cluster0.abc12.mongodb.net/tripsathi",
      "mongodb+srv://tripsathi_dev:f2mzPCMNrRzqKaEp@CLUSTER.mongodb.net/tripsathi",
    ];

    for (const uri of examples) {
      const result = inspectMongoUri(uri);
      assert.equal(result.ok, false, uri);
      assert.match(result.reason, /example text/);
    }
  });

  it("still accepts a real-looking Atlas host that starts with cluster0", () => {
    const result = inspectMongoUri("mongodb+srv://tripsathi_dev:f2mzPCMNrRzqKaEp@cluster0.abc12.mongodb.net/tripsathi");
    assert.equal(result.ok, true);
  });
});