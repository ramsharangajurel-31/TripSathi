import rateLimit from "express-rate-limit";

import { env } from "../config/env.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Creates a rate limiter. Defaults come from the environment; any
 * express-rate-limit option (such as skipSuccessfulRequests) can be added.
 */
export function createRateLimiter({
  windowMs = env.rateLimit.windowMs,
  limit = env.rateLimit.max,
  message = "Too many requests. Please try again later.",
  ...options
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => sendError(res, 429, "RATE_LIMITED", message),
    ...options,
  });
}