import { Router } from "express";

import { getActivity, listActivities } from "../controllers/catalog.controller.js";
import { validate } from "../middleware/validate.js";
import { activityListQuery, objectIdParams } from "../validators/catalog.js";

const router = Router();

router.get("/", validate({ query: activityListQuery }), listActivities);
router.get("/:id", validate({ params: objectIdParams }), getActivity);

export default router;