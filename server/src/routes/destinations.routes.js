import { Router } from "express";

import {
  getDestination,
  listDestinations,
  searchDestinations,
} from "../controllers/catalog.controller.js";
import { validate } from "../middleware/validate.js";
import {
  destinationListQuery,
  destinationSearchQuery,
  slugOrIdParams,
} from "../validators/catalog.js";

const router = Router();

router.get("/", validate({ query: destinationListQuery }), listDestinations);
// "/search" must come before "/:id", or "search" would be read as an id.
router.get("/search", validate({ query: destinationSearchQuery }), searchDestinations);
router.get("/:id", validate({ params: slugOrIdParams }), getDestination);

export default router;