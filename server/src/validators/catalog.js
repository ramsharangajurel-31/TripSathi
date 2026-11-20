import { z } from "zod";

import { ATTRACTION_TYPES, INTENSITIES, INTERESTS, PROVINCES, TIME_SLOTS } from "../constants.js";
import {
  flagParam,
  intParam,
  objectIdParam,
  pagingShape,
  slugOrIdParam,
  textParam,
} from "./common.js";

// strictObject rejects any parameter that is not listed. That also blocks
// operator-style input such as ?province[$ne]=x.

export const destinationListQuery = z.strictObject({
  ...pagingShape(),
  province: z.enum(PROVINCES).optional(),
  interest: z.enum(INTERESTS).optional(),
  popular: flagParam.optional(),
  featured: flagParam.optional(),
  q: textParam.optional(),
  sort: z
    .enum(["name", "-name", "rating", "-rating", "recommendedDays", "-recommendedDays"])
    .optional(),
});

export const destinationSearchQuery = z.strictObject({
  q: textParam,
  limit: intParam({ min: 1, max: 20, label: "limit" }).optional(),
});

export const slugOrIdParams = z.strictObject({ id: slugOrIdParam });
export const objectIdParams = z.strictObject({ id: objectIdParam });

export const attractionListQuery = z.strictObject({
  ...pagingShape(),
  destination: slugOrIdParam.optional(),
  type: z.enum(ATTRACTION_TYPES).optional(),
  fee: z.enum(["free", "paid", "unknown"]).optional(),
  q: textParam.optional(),
  sort: z.enum(["name", "-name"]).optional(),
});

export const activityListQuery = z.strictObject({
  ...pagingShape(),
  destination: slugOrIdParam.optional(),
  category: z.enum(INTERESTS).optional(),
  intensity: z.enum(INTENSITIES).optional(),
  bestTime: z.enum(TIME_SLOTS).optional(),
  maxCost: intParam({ min: 0, max: 1_000_000, label: "maxCost" }).optional(),
  month: intParam({ min: 1, max: 12, label: "month" }).optional(),
  q: textParam.optional(),
  sort: z.enum(["name", "-name", "cost", "-cost", "duration", "-duration"]).optional(),
});