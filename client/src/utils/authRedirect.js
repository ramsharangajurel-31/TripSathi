import { ROLES } from "../data/demoUsers";

export const USER_HOME = "/dashboard";
export const ADMIN_HOME = "/admin";

/** The landing page for a signed-in user, based on their role. */
export function getHomePath(user) {
  return user && user.role === ROLES.admin ? ADMIN_HOME : USER_HOME;
}

/** Turns a router location object (or a string) into "/path?query#hash". */
export function toPath(location) {
  if (!location) return "";
  if (typeof location === "string") return location;
  return `${location.pathname || ""}${location.search || ""}${location.hash || ""}`;
}

const isInternalPath = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//");

/**
 * Decides where to send someone after login or registration.
 *
 *  - Returns the page they originally wanted ("from"), INCLUDING its
 *    query string, so /dashboard/create-trip?q=... survives the login step
 *  - Ignores anything that is not an internal path (blocks open redirects)
 *  - Ignores the login and register pages themselves
 *  - Never sends a role to an area it cannot open: admins go to /admin,
 *    travelers go to /dashboard
 */
export function resolveRedirect(from, user) {
  const home = getHomePath(user);
  const path = toPath(from);

  if (!isInternalPath(path)) return home;
  if (path === "/login" || path === "/register") return home;

  const isAdmin = user && user.role === ROLES.admin;
  const wantsAdminArea = path === ADMIN_HOME || path.startsWith(`${ADMIN_HOME}/`);
  const wantsUserArea = path === USER_HOME || path.startsWith(`${USER_HOME}/`);

  if (isAdmin && wantsUserArea) return home;
  if (!isAdmin && wantsAdminArea) return home;

  return path;
}