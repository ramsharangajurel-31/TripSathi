import * as authService from "../services/auth.service.js";
import { endSession, rotateSession } from "../services/session.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import { HttpError, unauthorized } from "../utils/httpError.js";

// Tokens travel ONLY in httpOnly cookies, never in a response body.

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.valid.body,
    req.get("user-agent")
  );
  setAuthCookies(res, { accessToken, refreshToken });
  sendSuccess(res, { user }, { status: 201 });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.valid.body,
    req.get("user-agent")
  );
  setAuthCookies(res, { accessToken, refreshToken });
  sendSuccess(res, { user });
});

// When a session is dead for good, the cookies are cleared. SESSION_ROTATED
// is NOT one of those: another request just refreshed, and clearing here
// would wipe the cookies that request is setting.
const DEAD_SESSION_CODES = new Set(["SESSION_INVALID", "SESSION_EXPIRED", "ACCOUNT_INACTIVE"]);

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (typeof token !== "string" || token.length === 0 || token.length > 200) {
    throw unauthorized("You need to sign in.", "NOT_AUTHENTICATED");
  }

  try {
    const { user, accessToken, refreshToken } = await rotateSession(token, req.get("user-agent"));
    setAuthCookies(res, { accessToken, refreshToken });
    sendSuccess(res, { user });
  } catch (error) {
    if (error instanceof HttpError && DEAD_SESSION_CODES.has(error.code)) clearAuthCookies(res);
    throw error;
  }
});

// Logging out twice, or without a session, is not an error.
export const logout = asyncHandler(async (req, res) => {
  await endSession(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  sendSuccess(res, { loggedOut: true });
});

export const me = (req, res) => {
  sendSuccess(res, { user: req.user });
};