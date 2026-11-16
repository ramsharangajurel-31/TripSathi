import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import healthRoutes from "./routes/health.routes.js";
import apiRoutes from "./routes/index.js";
import { HttpError } from "./utils/httpError.js";

const allowedOrigins = new Set(env.clientOrigins);

// Browsers send an Origin header on cross-origin requests. Requests without
// one (curl, server to server, same-origin) are let through: CORS only
// controls which WEBSITES may call the API from a browser. It is not a
// substitute for authentication.
function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  return callback(new HttpError(403, "CORS_ORIGIN_NOT_ALLOWED", "This origin is not allowed."));
}

/**
 * Builds the Express application. Kept separate from server.js so tests can
 * start it on any port.
 *
 * options.rateLimit  overrides the rate limiter (used by tests)
 */
export function createApp({ rateLimit } = {}) {
  const app = express();

  app.disable("x-powered-by");
  if (env.trustProxyHops > 0) app.set("trust proxy", env.trustProxyHops);

  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true, maxAge: 600 }));

  // Monitoring endpoint first: never rate limited.
  app.use("/api/health", healthRoutes);

  app.use("/api", createRateLimiter(rateLimit));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}