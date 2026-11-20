import { User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { forbidden, unauthorized } from "../utils/httpError.js";
import { verifyAccessToken } from "../utils/tokens.js";

const OBJECT_ID = /^[a-f0-9]{24}$/i;

/**
 * Requires a signed-in user and puts them on req.user.
 *
 * The token is only the first check. The account is also loaded from the
 * database on every request, so a deactivated account or a password change
 * takes effect at once, not when the token expires.
 *
 * Error codes the frontend reacts to:
 *   NOT_AUTHENTICATED  no cookie            -> go to the login page
 *   TOKEN_EXPIRED      expired token        -> call /api/auth/refresh, then retry
 *   INVALID_TOKEN      bad or forged token  -> go to the login page
 *   SESSION_ENDED      password was changed -> go to the login page
 *   ACCOUNT_INACTIVE   account deactivated  -> show the message
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];

  if (typeof token !== "string" || token.length === 0) {
    throw unauthorized("You need to sign in.", "NOT_AUTHENTICATED");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw unauthorized("Your session has expired.", "TOKEN_EXPIRED");
    }
    throw unauthorized("Your session is not valid. Please sign in again.", "INVALID_TOKEN");
  }

  if (typeof payload.sub !== "string" || !OBJECT_ID.test(payload.sub)) {
    throw unauthorized("Your session is not valid. Please sign in again.", "INVALID_TOKEN");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw unauthorized("Your session is not valid. Please sign in again.", "INVALID_TOKEN");
  }
  if (user.status !== "active") {
    throw forbidden("This account is inactive. Please contact the administrator.", "ACCOUNT_INACTIVE");
  }
  if ((user.tokenVersion ?? 0) !== payload.tv) {
    throw unauthorized("Your session has ended. Please sign in again.", "SESSION_ENDED");
  }

  req.user = user;
  next();
});

/**
 * Allows only the listed roles. Use AFTER requireAuth:
 *   router.get("/", requireAuth, requireRole("admin"), handler)
 * Checking on the server is what protects admin features; hiding buttons in
 * React is only for convenience.
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(unauthorized("You need to sign in.", "NOT_AUTHENTICATED"));
    if (!roles.includes(req.user.role)) {
      return next(forbidden("You are not allowed to do this.", "FORBIDDEN"));
    }
    return next();
  };