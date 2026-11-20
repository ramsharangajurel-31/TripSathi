import crypto from "node:crypto";

import { env } from "../config/env.js";
import { RefreshToken, User } from "../models/index.js";
import { forbidden, unauthorized } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";
import { generateRefreshToken, hashToken, signAccessToken } from "../utils/tokens.js";

/**
 * What to do with a refresh token that was looked up:
 *   "ok"               use it
 *   "expired"          too old
 *   "rotated-recently" already used, but only just: two tabs refreshing at
 *                      the same moment. Refuse, do NOT treat as theft
 *   "reused"           already used a while ago: possible theft
 * Pure function, so it is tested without a database.
 */
export function evaluateRefreshRecord(record, now = Date.now(), graceMs = env.auth.refreshGraceMs) {
  if (record.revokedAt) {
    return now - record.revokedAt.getTime() < graceMs ? "rotated-recently" : "reused";
  }
  if (record.expiresAt.getTime() <= now) return "expired";
  return "ok";
}

export const revokeFamily = (familyId) =>
  RefreshToken.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: new Date() } });

export const revokeAllForUser = (userId) =>
  RefreshToken.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });

/** Creates the tokens for a new login (or the next token of an existing family). */
export async function startSession(user, userAgent = "", familyId = crypto.randomUUID()) {
  const refreshToken = generateRefreshToken();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    familyId,
    expiresAt: new Date(Date.now() + env.auth.refreshTtlMs),
    userAgent: String(userAgent ?? "").slice(0, 200),
  });

  return { accessToken: signAccessToken(user), refreshToken, familyId };
}

/**
 * Exchanges a refresh token for a new pair. Each token works once: the old
 * one is revoked in the same step, so it cannot be used again.
 */
export async function rotateSession(rawToken, userAgent = "") {
  const record = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!record) throw unauthorized("Please sign in again.", "SESSION_INVALID");

  const verdict = evaluateRefreshRecord(record);

  if (verdict === "reused") {
    await revokeFamily(record.familyId);
    logger.warn({ userId: String(record.user) }, "Refresh token reuse detected; session revoked");
    throw unauthorized("Your session ended. Please sign in again.", "SESSION_INVALID");
  }
  if (verdict === "rotated-recently") {
    throw unauthorized("Your session was just refreshed. Please retry.", "SESSION_ROTATED");
  }
  if (verdict === "expired") {
    throw unauthorized("Your session expired. Please sign in again.", "SESSION_EXPIRED");
  }

  // Claim the token. If another request claimed it first, this finds nothing.
  const claimed = await RefreshToken.findOneAndUpdate(
    { _id: record._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  if (!claimed) throw unauthorized("Your session was just refreshed. Please retry.", "SESSION_ROTATED");

  const user = await User.findById(record.user);
  if (!user) {
    await revokeFamily(record.familyId);
    throw unauthorized("Please sign in again.", "SESSION_INVALID");
  }
  if (user.status !== "active") {
    await revokeFamily(record.familyId);
    throw forbidden("This account is inactive. Please contact the administrator.", "ACCOUNT_INACTIVE");
  }

  return { user, ...(await startSession(user, userAgent, record.familyId)) };
}

/** Ends the session that owns this refresh token. Safe to call with anything. */
export async function endSession(rawToken) {
  if (typeof rawToken !== "string" || rawToken.length === 0) return;

  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}