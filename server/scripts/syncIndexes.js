// Makes the database indexes match the models:  npm run db:indexes
// It creates missing indexes AND removes indexes that no model defines
// any more, so run it as a deliberate step (for example on every deploy).

import {
  connectDatabase,
  disconnectDatabase,
  explainConnectionError,
} from "../src/config/db.js";
import { scrubMongoCredentials } from "../src/config/mongoUri.js";
import { models } from "../src/models/index.js";

try {
  await connectDatabase();

  for (const model of models) {
    await model.syncIndexes();
    const indexes = await model.collection.indexes();
    console.log(`${model.collection.collectionName}: ${indexes.map((index) => index.name).join(", ")}`);
  }

  console.log("Indexes are up to date.");
} catch (error) {
  console.error(`Index sync FAILED: ${scrubMongoCredentials(error.message)}`);
  console.error(`Hint: ${explainConnectionError(error)}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}