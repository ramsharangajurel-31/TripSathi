import { env } from "../config/env.js";

export const ACCESS_COOKIE = "ts_access";
export const REFRESH_COOKIE = "ts_refresh";

// The access cookie goes to every API call. The refresh cookie only goes to
// /api/auth, so it is not sent with ordinary requests.
const ACCESS_PATH = "/api";
const REFRESH_PATH = "/api/auth";

const baseOptions = () => ({
  httpOnly: true, // page JavaScript can never read these cookies
  secure: env.auth.cookie.secure,
  sameSite: env.auth.cookie.sameSite,
  ...(env.auth.cookie.domain ? { domain: env.auth.cookie.domain } : {}),
});

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions(),
    path: ACCESS_PATH,
    maxAge: env.auth.accessTtlSeconds * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions(),
    path: REFRESH_PATH,
    maxAge: env.auth.refreshTtlMs,
  });
}

// Path and domain must match the ones used when setting, or the browser
// keeps the cookie.
export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: ACCESS_PATH });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: REFRESH_PATH });
}