import { Router } from "express";

import { getAttraction, listAttractions } from "../controllers/catalog.controller.js";
import { validate } from "../middleware/validate.js";
import { attractionListQuery, objectIdParams } from "../validators/catalog.js";

const router = Router();

router.get("/", validate({ query: attractionListQuery }), listAttractions);
router.get("/:id", validate({ params: objectIdParams }), getAttraction);

export default router;