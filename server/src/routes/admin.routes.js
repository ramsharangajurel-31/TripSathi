import { Router } from "express";

import { listUsers } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { noStore } from "../middleware/noStore.js";
import { validate } from "../middleware/validate.js";
import { adminUsersQuery } from "../validators/users.js";

// Everything under /api/admin needs a signed-in ADMINISTRATOR. The role is
// read from the database on every request, not from the token.
const router = Router();

router.use(requireAuth, requireRole("admin"), noStore);

router.get("/users", validate({ query: adminUsersQuery }), listUsers);

export default router;