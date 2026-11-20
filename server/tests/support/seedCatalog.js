import fs from "node:fs";

import { createCatalog } from "../../src/services/planner/catalog.js";
import { slugify } from "../../src/utils/slug.js";

const read = (name) =>
  JSON.parse(fs.readFileSync(new URL(`../../data/seed/${name}`, import.meta.url), "utf8"));

/**
 * The seeded catalog (data/seed/*.json) as a planner catalog. Activity ids are
 * made from the destination and name, e.g. "pokhara:phewa-lake-boating".
 */
export function loadSeedCatalog() {
  let destinations;
  let activities;

  try {
    destinations = read("destinations.json");
    activities = read("activities.json");
  } catch {
    throw new Error("The seed files are missing. Run: npm run seed:export");
  }

  return createCatalog({
    destinations,
    activities: activities.map((activity) => ({
      ...activity,
      id: `${activity.destination}:${slugify(activity.name)}`,
    })),
  });
}