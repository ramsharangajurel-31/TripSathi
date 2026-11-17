import mongoose from "mongoose";

import { logger } from "../utils/logger.js";
import { env } from "./env.js";
import { inspectMongoUri, scrubMongoCredentials } from "./mongoUri.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// A query on a field that does not exist in the schema stays in the filter
// (and matches nothing) instead of being silently dropped. With "true", a
// mistyped ownership filter such as { usrId } would return EVERYONE's
// records. Input safety comes from validating every request with Zod.
mongoose.set("strictQuery", false);

const CONNECT_TIMEOUT_MS = 8000;
let listenersAttached = false;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  const connection = mongoose.connection;
  connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  connection.on("reconnected", () => logger.info("MongoDB reconnected"));
  connection.on("error", (error) =>
    logger.error(
      { errorName: error.name, reason: scrubMongoCredentials(error.message) },
      "MongoDB connection error"
    )
  );
}

/**
 * Connects once. The driver then reconnects by itself if the link drops.
 * Throws if the first connection fails (the caller decides what to do).
 *
  * Indexes are not created automatically by the connection: every model
 * switches autoIndex off, and indexes are created by ensureIndexes() (see
 * models/index.js) or by `npm run db:indexes`.
 */
export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  attachListeners();

  const target = inspectMongoUri(env.mongoUri);
  logger.info({ host: target.host, database: target.database }, "Connecting to MongoDB");

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    maxPoolSize: 10,
    
  });

  logger.info({ host: target.host, database: target.database }, "MongoDB connected");
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

const STATES = ["disconnected", "connected", "connecting", "disconnecting"];

export const getDatabaseState = () => STATES[mongoose.connection.readyState] || "unknown";

/** True when the database answers a ping within the time limit. */
export async function pingDatabase(timeoutMs = 2000) {
  if (mongoose.connection.readyState !== 1) return false;

  try {
    await Promise.race([
      mongoose.connection.db.admin().ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("ping timeout")), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}

/** A plain-language hint for the most common connection failures. */
export function explainConnectionError(error) {
  const text = `${error?.name || ""} ${error?.message || ""} ${error?.code || ""} ${error?.codeName || ""}`;

  if (/bad auth|AuthenticationFailed|Authentication failed/i.test(text)) {
    return "Atlas refused the username or password. Check them in Database Access, and URL-encode special characters in the password.";
  }
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(text)) {
    return "The cluster address could not be looked up. Check your internet connection and copy the connection string from Atlas again. Some networks block the lookup that mongodb+srv:// needs. If so, Atlas can show a standard (non-SRV) connection string.";
  }
  if (/ServerSelection|timed out|ECONNREFUSED/i.test(text)) {
    return "The server could not be reached. The usual cause is Network Access: add your current IP address in Atlas (it changes on many home connections). Also check your internet connection.";
  }
  return "Check MONGODB_URI in .env and your Atlas settings.";
}