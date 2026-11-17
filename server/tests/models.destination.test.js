import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Destination } from "../src/models/index.js";
import { errorPaths, findIndex, validDestination } from "./fixtures.js";

const make = (changes = {}) => new Destination({ ...validDestination(), ...changes });
const hasPath = (paths, name) => paths.some((path) => path === name || path.startsWith(`${name}.`));

describe("Destination model", () => {
  it("accepts a valid destination and applies honest defaults", async () => {
    const destination = make();
    assert.deepEqual(await errorPaths(destination), []);
    assert.equal(destination.status, "active");
    assert.equal(destination.verificationStatus, "estimated");
    assert.equal(destination.dataSource.name, "TripSathi sample estimate");
  });

  it("makes the slug from the name", async () => {
    const destination = make({ name: "Everest Region" });
    await errorPaths(destination);
    assert.equal(destination.slug, "everest-region");
  });

  it("reports every missing required field", async () => {
    const paths = await errorPaths(new Destination({}));
    for (const name of [
      "name", "slug", "province", "tagline", "description", "interests",
      "bestSeason", "altitudeM", "recommendedDays", "costPerDay", "fromKathmandu",
    ]) {
      assert.ok(hasPath(paths, name), `${name} should be required`);
    }
  });

  it("accepts coordinates inside Nepal and rejects swapped or distant ones", async () => {
    const good = make({ location: { type: "Point", coordinates: [83.9856, 28.2096] } });
    assert.deepEqual(await errorPaths(good), []);

    for (const coordinates of [[28.2096, 83.9856], [0, 0], [83.9856]]) {
      const paths = await errorPaths(make({ location: { type: "Point", coordinates } }));
      assert.ok(hasPath(paths, "location"), JSON.stringify(coordinates));
    }
  });

  it("only allows 'verified' with a date and a real source", async () => {
    const proofless = await errorPaths(make({ verificationStatus: "verified" }));
    assert.ok(proofless.includes("lastVerifiedAt"));
    assert.ok(proofless.includes("dataSource.name"));

    const proven = make({
      verificationStatus: "verified",
      lastVerifiedAt: new Date("2026-01-15"),
      dataSource: { name: "Operator price list 2026 (test)", url: "https://example.org/prices" },
    });
    assert.deepEqual(await errorPaths(proven), []);

    const future = make({ lastVerifiedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    assert.ok((await errorPaths(future)).includes("lastVerifiedAt"));
  });

  it("accepts image addresses and paths but not embedded or protocol-relative images", async () => {
    const good = make({
      images: [{ url: "https://images.example.org/a.jpg", alt: "Lake" }, { url: "/images/pokhara.jpg" }],
    });
    assert.deepEqual(await errorPaths(good), []);

    for (const url of ["data:image/png;base64,AAAA", "//evil.example/x.png", "javascript:alert(1)"]) {
      assert.ok(hasPath(await errorPaths(make({ images: [{ url }] })), "images"), url);
    }

    const tooMany = Array.from({ length: 11 }, (_, i) => ({ url: `/images/${i}.jpg` }));
    assert.ok((await errorPaths(make({ images: tooMany }))).includes("images"));
  });

  it("rejects negative and fractional costs", async () => {
    const costs = validDestination().costPerDay;
    costs.budget.stay = -1;
    costs.standard.food = 10.5;

    const paths = await errorPaths(make({ costPerDay: costs }));
    assert.ok(paths.some((path) => path.endsWith("budget.stay")));
    assert.ok(paths.some((path) => path.endsWith("standard.food")));
  });

  it("rejects empty, unknown and repeated interests", async () => {
    for (const interests of [[], ["nature", "skydiving"], ["nature", "nature"]]) {
      assert.ok(hasPath(await errorPaths(make({ interests })), "interests"), JSON.stringify(interests));
    }
  });

  it("has a unique slug index and a text-search index", () => {
    const slug = findIndex(Destination, (fields) => fields.slug === 1);
    assert.equal(slug?.options.unique, true);

    const text = findIndex(Destination, (fields) => fields.name === "text");
    assert.equal(text?.options.name, "destination_text");
  });

  it("returns clean JSON", async () => {
    const destination = make();
    await errorPaths(destination);

    const json = destination.toJSON();
    assert.equal(json.slug, "pokhara");
    assert.equal(typeof json.id, "string");
    assert.equal("_id" in json, false);
    assert.equal("nameKey" in json, false);
  });
});