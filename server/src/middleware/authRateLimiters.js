import { createRateLimiter } from "./rateLimiter.js";

const MINUTE = 60 * 1000;

/**
 * Stricter limits for the endpoints attackers go after. `overrides` lets
 * tests use tiny limits. The limiter runs BEFORE validation, so malformed
 * attempts count too.
 */
export function createAuthLimiters(overrides = {}) {
  return {
    register: createRateLimiter({
      windowMs: 60 * MINUTE,
      limit: 10,
      message: "Too many accounts were created from this connection. Please try again later.",
      ...overrides.register,
    }),
    // Only FAILED sign-ins count, so normal use never hits the limit.
    login: createRateLimiter({
      windowMs: 15 * MINUTE,
      limit: 10,
      skipSuccessfulRequests: true,
      message: "Too many failed sign-in attempts. Please wait 15 minutes and try again.",
      ...overrides.login,
    }),
    refresh: createRateLimiter({
      windowMs: 15 * MINUTE,
      limit: 120,
      message: "Too many session refreshes. Please try again later.",
      ...overrides.refresh,
    }),
  };
}