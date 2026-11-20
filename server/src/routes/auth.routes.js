import { Router } from "express";

import { login, logout, me, refresh, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { noStore } from "../middleware/noStore.js";
import { validate } from "../middleware/validate.js";
import { loginBody, registerBody } from "../validators/auth.js";

/** limiters: { register, login, refresh } from createAuthLimiters(). */
export function createAuthRouter(limiters) {
  const router = Router();

  router.use(noStore);

  router.post("/register", limiters.register, validate({ body: registerBody }), register);
  router.post("/login", limiters.login, validate({ body: loginBody }), login);
  router.post("/refresh", limiters.refresh, refresh);
  router.post("/logout", logout);
  router.get("/me", requireAuth, me);

  return router;
}