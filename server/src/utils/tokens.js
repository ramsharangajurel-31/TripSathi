import crypto from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

const ISSUER = "tripsathi";
const AUDIENCE = "tripsathi-api";

/**
 * Access token: a short-lived signed JWT. It names the user (sub), their role
 * and their tokenVersion. It is only the FIRST check: the server also loads
 * the account on every request.
 */
export function signAccessToken(
  user,
  { expiresInSeconds = env.auth.accessTtlSeconds, secret = env.auth.accessSecret } = {}
) {
  return jwt.sign({ role: user.role, tv: user.tokenVersion ?? 0 }, secret, {
    algorithm: "HS256",
    subject: String(user._id ?? user.id),
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: expiresInSeconds,
  });
}

/** Throws (TokenExpiredError or JsonWebTokenError) unless the token is valid. */
export function verifyAccessToken(token, { secret = env.auth.accessSecret } = {}) {
  return jwt.verify(token, secret, {
    algorithms: ["HS256"], // never accept "none" or any other algorithm
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
  });
}

// Refresh tokens are random, not JWTs: 48 random bytes, shown to the browser
// once. Only the SHA-256 hash is stored (they are already high-entropy, so a
// fast hash is correct here, unlike for passwords).
export const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");