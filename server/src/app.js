import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import healthRoutes from "./routes/health.routes.js";
import { createApiRouter } from "./routes/index.js";
import { HttpError } from "./utils/httpError.js";

const allowedOrigins = new Set(env.clientOrigins);

// Browsers send an Origin header on cross-origin requests, and on every
// POST/PATCH/DELETE. A request from a website that is not on the list is
// refused BEFORE it reaches any route, which also blocks cross-site request
// forgery. Requests without an Origin (curl, server to server) are let
// through: they carry no browser cookies of a victim, and still need to
// authenticate.
function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  return callback(new HttpError(403, "CORS_ORIGIN_NOT_ALLOWED", "This origin is not allowed."));
}

/**
 * Builds the Express application. Kept separate from server.js so tests can
 * start it on any port.
 *
 * options.rateLimit   overrides the general rate limiter (used by tests)
 * options.authLimits  overrides the login / register / refresh limiters
 */
export function createApp({ rateLimit, authLimits } = {}) {
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

  app.use("/api", createApiRouter({ authLimits }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}