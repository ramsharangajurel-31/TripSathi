import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.NODE_ENV = "test";
process.env.BCRYPT_COST = "4"; // fast hashing for tests only

const { hashPassword, verifyAgainstDummy, verifyPassword } = await import("../src/utils/password.js");

describe("passwords", () => {
  it("hashes to the bcrypt format and only the right password verifies", async () => {
    const hash = await hashPassword("Test@12345");

    assert.match(hash, /^\$2[aby]\$04\$[./A-Za-z0-9]{53}$/);
    assert.equal(hash.includes("Test@12345"), false);
    assert.equal(await verifyPassword("Test@12345", hash), true);
    assert.equal(await verifyPassword("test@12345", hash), false);
  });

  it("gives a different hash each time (random salt)", async () => {
    assert.notEqual(await hashPassword("Test@12345"), await hashPassword("Test@12345"));
  });

  it("can run the timing-equalising check without failing", async () => {
    await assert.doesNotReject(() => verifyAgainstDummy("anything"));
  });
});