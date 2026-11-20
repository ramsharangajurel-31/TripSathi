import { Router } from "express";

import { createAuthLimiters } from "../middleware/authRateLimiters.js";
import activityRoutes from "./activities.routes.js";
import attractionRoutes from "./attractions.routes.js";
import { createAuthRouter } from "./auth.routes.js";
import destinationRoutes from "./destinations.routes.js";

/**
 * One router per feature, added as each is built. The health route is
 * mounted separately in app.js so that monitoring is never rate limited.
 * options.authLimits lets tests use tiny limits.
 */
export function createApiRouter({ authLimits } = {}) {
  const router = Router();

  router.use("/auth", createAuthRouter(createAuthLimiters(authLimits)));
  router.use("/destinations", destinationRoutes);
  router.use("/attractions", attractionRoutes);
  router.use("/activities", activityRoutes);

  return router;
}