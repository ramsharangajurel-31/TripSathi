import { Router } from "express";

import { createAuthLimiters } from "../middleware/authRateLimiters.js";
import activityRoutes from "./activities.routes.js";
import adminRoutes from "./admin.routes.js";
import attractionRoutes from "./attractions.routes.js";
import { createAuthRouter } from "./auth.routes.js";
import destinationRoutes from "./destinations.routes.js";
import { createUsersRouter } from "./users.routes.js";

/**
 * One router per feature, added as each is built. The health route is
 * mounted separately in app.js so that monitoring is never rate limited.
 * options.authLimits lets tests use tiny limits.
 */
export function createApiRouter({ authLimits } = {}) {
  const router = Router();
  const limiters = createAuthLimiters(authLimits);

  router.use("/auth", createAuthRouter(limiters));
  router.use("/users", createUsersRouter(limiters));
  router.use("/admin", adminRoutes);
  router.use("/destinations", destinationRoutes);
  router.use("/attractions", attractionRoutes);
  router.use("/activities", activityRoutes);

  return router;
}