import { Router } from "express";

import { changePassword, getProfile, updateProfile } from "../controllers/users.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { noStore } from "../middleware/noStore.js";
import { validate } from "../middleware/validate.js";
import { changePasswordBody, updateProfileBody } from "../validators/users.js";

/** limiters: from createAuthLimiters(). Every route needs a signed-in user. */
export function createUsersRouter(limiters) {
  const router = Router();

  router.use(requireAuth, noStore);

  router.get("/profile", getProfile);
  router.patch("/profile", limiters.credentials, validate({ body: updateProfileBody }), updateProfile);
  router.patch("/password", limiters.credentials, validate({ body: changePasswordBody }), changePassword);

  return router;
}