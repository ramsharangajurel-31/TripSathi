// Loads the catalog into the database:
//   npm run seed:catalog                 add missing records only (safe to repeat)
//   npm run seed:catalog -- --dry-run    check everything, write nothing
//   npm run seed:catalog -- --update     also refresh records still marked "estimated"
//
// Records are matched by their natural key (destination slug; destination +
// name for attractions and activities), so running it again never creates
// duplicates. Existing records are left alone unless --update is given, and
// even then records marked "verified" are never touched.
// WARNING: --update overwrites admin edits to estimated records. Use it on a
// development database, not after real data entry.

import fs from "node:fs/promises";

import {
  connectDatabase,
  disconnectDatabase,
  explainConnectionError,
} from "../src/config/db.js";
import { scrubMongoCredentials } from "../src/config/mongoUri.js";
import { Activity, Attraction, Destination, ensureIndexes } from "../src/models/index.js";
import { makeNameKey } from "../src/models/shared.js";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const update = args.has("--update");

const seedDir = new URL("../data/seed/", import.meta.url);
const load = async (file) => JSON.parse(await fs.readFile(new URL(file, seedDir), "utf8"));

const errors = [];
const newStats = () => ({ created: 0, updated: 0, unchanged: 0, protectedRecords: 0 });

async function upsert(Model, filter, data, label, stats) {
  try {
    const existing = await Model.findOne(filter);

    if (!existing) {
      const record = new Model(data);
      if (dryRun) await record.validate();
      else await record.save();
      stats.created += 1;
      return;
    }

    if (!update) {
      stats.unchanged += 1;
      return;
    }
    if (existing.verificationStatus !== "estimated") {
      stats.protectedRecords += 1;
      return;
    }

    const { slug, ...fields } = data; // the slug never changes
    existing.set(fields);
    if (!existing.isModified()) {
      stats.unchanged += 1;
      return;
    }
    if (dryRun) await existing.validate();
    else await existing.save();
    stats.updated += 1;
  } catch (error) {
    errors.push(`${label}: ${scrubMongoCredentials(error.message)}`);
  }
}

const report = (name, stats) =>
  console.log(
    `${name.padEnd(13)} ${stats.created} ${dryRun ? "would be created" : "created"}, ${stats.updated} ${
      dryRun ? "would be updated" : "updated"
    }, ${stats.unchanged} unchanged${stats.protectedRecords ? `, ${stats.protectedRecords} verified (not touched)` : ""}`
  );

try {
  const [destinations, attractions, activities] = await Promise.all([
    load("destinations.json"),
    load("attractions.json"),
    load("activities.json"),
  ]);

  await connectDatabase();
  if (!dryRun) await ensureIndexes();
  console.log(dryRun ? "DRY RUN: nothing will be written." : "Seeding the catalog ...");

  const destinationStats = newStats();
  for (const record of destinations) {
    await upsert(Destination, { slug: record.slug }, record, `destination "${record.slug}"`, destinationStats);
  }
  report("destinations", destinationStats);

  const idBySlug = new Map(
    (await Destination.find({ slug: { $in: destinations.map((d) => d.slug) } }).select("slug")).map((d) => [d.slug, d._id])
  );

  const seedChildren = async (Model, label, records, stats) => {
    for (const record of records) {
      const destination = idBySlug.get(record.destination);

      if (!destination) {
        // In a dry run nothing was written, so new destinations have no id yet.
        if (!dryRun) errors.push(`${label} "${record.name}": its destination "${record.destination}" does not exist`);
        stats.created += dryRun ? 1 : 0;
        continue;
      }
      await upsert(
        Model,
        { destination, nameKey: makeNameKey(record.name) },
        { ...record, destination },
        `${label} "${record.name}"`,
        stats
      );
    }
    report(`${label}s`, stats);
  };

  await seedChildren(Attraction, "attraction", attractions, newStats());
  await seedChildren(Activity, "activity", activities, newStats());

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):`);
    errors.forEach((message) => console.error(`  - ${message}`));
    process.exitCode = 1;
  } else {
    console.log(
      dryRun
        ? "Dry run finished with no problems."
        : "Done. Every record is marked 'estimated' (source: TripSathi sample estimate): none of it is verified data."
    );
  }
} catch (error) {
  console.error(`Seeding FAILED: ${scrubMongoCredentials(error.message)}`);
  console.error(`Hint: ${explainConnectionError(error)}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}