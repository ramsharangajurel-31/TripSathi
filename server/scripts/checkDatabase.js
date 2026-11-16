// Checks your Atlas setup end to end:  npm run db:check
// It connects, pings, writes a small test document, reads it back and
// removes it. It never touches your real collections.

import mongoose from "mongoose";

import {
  connectDatabase,
  disconnectDatabase,
  explainConnectionError,
} from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { inspectMongoUri, scrubMongoCredentials } from "../src/config/mongoUri.js";

const TEST_COLLECTION = "_connection_check";
const target = inspectMongoUri(env.mongoUri);

console.log(`Checking ${target.host}/${target.database} ...`);

try {
  await connectDatabase();
  const db = mongoose.connection.db;

  const started = Date.now();
  await db.admin().ping();
  const pingMs = Date.now() - started;

  let version = "unknown";
  try {
    version = (await db.admin().serverInfo()).version;
  } catch {
    // some accounts may not be allowed to read this; it is only informational
  }
  console.log(`Connected. MongoDB server version ${version} (ping ${pingMs} ms).`);

  const collection = db.collection(TEST_COLLECTION);
  const { insertedId } = await collection.insertOne({ createdAt: new Date() });
  const found = await collection.findOne({ _id: insertedId });
  await collection.deleteOne({ _id: insertedId });

  if (!found) throw new Error("A test document was written but could not be read back.");
  console.log("Write test passed: inserted, read back and deleted a test document.");

  const names = (await db.listCollections().toArray())
    .map((item) => item.name)
    .filter((name) => name !== TEST_COLLECTION);
  console.log(`Collections in "${target.database}": ${names.length}${names.length ? ` (${names.join(", ")})` : ""}`);

  console.log("Database check passed.");
} catch (error) {
  console.error(`Database check FAILED: ${scrubMongoCredentials(error.message)}`);
  console.error(`Hint: ${explainConnectionError(error)}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}