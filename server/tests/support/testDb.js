import mongoose from "mongoose";

/**
 * "…/tripsathi?x=y" -> "…/tripsathi_test?x=y". Returns null when the string
 * has no database name. A name that already ends in "_test" is kept.
 */
export function deriveTestUri(uri) {
  const match = /^(mongodb(?:\+srv)?:\/\/[^/?]+\/)([^?]*)(\?.*)?$/.exec(String(uri ?? ""));
  if (!match || !match[2]) return null;

  const name = match[2].endsWith("_test") ? match[2] : `${match[2]}_test`;
  return `${match[1]}${name}${match[3] ?? ""}`;
}

// Everything that deletes data goes through this check.
export function assertTestDatabase() {
  const name = mongoose.connection.name;
  if (!/_test$/.test(String(name))) {
    throw new Error(`Refusing to continue: connected to "${name}", which is not a *_test database.`);
  }
}

/** Connects to the *_test database next to MONGODB_URI and creates the indexes. */
export async function connectTestDatabase() {
  const { connectDatabase } = await import("../../src/config/db.js");
  const { ensureIndexes } = await import("../../src/models/index.js");

  const uri = deriveTestUri(process.env.MONGODB_URI);
  if (!uri) {
    throw new Error("MONGODB_URI is missing from server/.env (it must include the database name).");
  }

  try {
    await connectDatabase(uri);
    assertTestDatabase();
    await ensureIndexes();
  } catch (error) {
    if (/not authorized|Authentication failed|requires authentication/i.test(error.message)) {
      throw new Error(
        `The database user cannot use the test database. In Atlas: Database Access -> edit the user -> add the privilege readWrite on "${mongoose.connection.name || "…_test"}". (${error.message})`
      );
    }
    throw error;
  }
}

export async function clearCollections(...models) {
  assertTestDatabase();
  for (const model of models) await model.deleteMany({});
}