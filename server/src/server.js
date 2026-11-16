import { createApp } from "./app.js";
import {
  connectDatabase,
  disconnectDatabase,
  explainConnectionError,
} from "./config/db.js";
import { env } from "./config/env.js";
import { scrubMongoCredentials } from "./config/mongoUri.js";
import { logger } from "./utils/logger.js";

let server = null;
let shuttingDown = false;

// Graceful shutdown: stop taking new requests, let running ones finish, close
// the database connection, then exit. Forced after 10 seconds so a stuck
// connection can never block it.
function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, "Shutting down");

  const timer = setTimeout(() => {
    logger.error("Forced shutdown after 10 seconds.");
    process.exit(1);
  }, 10_000);
  timer.unref();

  const finish = async (error) => {
    if (error) logger.error({ err: error }, "Error while closing the server.");

    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      logger.error({ err: disconnectError }, "Error while closing the database connection.");
    }

    logger.info("Shutdown complete.");
    process.exit(error ? 1 : exitCode);
  };

  if (server) server.close(finish);
  else finish();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// A bug nobody handled: log it, then restart cleanly (a process manager or
// the host brings it back) rather than carry on in an unknown state.
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  shutdown("uncaughtException", 1);
});

// ---------- Start ----------
try {
  await connectDatabase();
} catch (error) {
  logger.fatal(
    { reason: scrubMongoCredentials(error.message) },
    `Could not connect to MongoDB. ${explainConnectionError(error)}`
  );
  process.exit(1);
}

server = createApp().listen(env.port, () => {
  logger.info({ port: env.port, environment: env.nodeEnv }, "TripSathi API listening");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.fatal(`Port ${env.port} is already in use. Stop the other process or change PORT in .env.`);
  } else {
    logger.fatal({ err: error }, "The server could not start.");
  }
  process.exit(1);
});