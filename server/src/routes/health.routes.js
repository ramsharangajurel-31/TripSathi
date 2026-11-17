import { Router } from "express";

import { getHealth, getReady } from "../controllers/health.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", getHealth);
router.get("/ready", asyncHandler(getReady));

export default router;