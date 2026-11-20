import mongoose from "mongoose";

import { schemaOptions } from "./shared.js";

const { Schema } = mongoose;

/**
 * One row per refresh token. Only a SHA-256 hash of the token is stored, so
 * a leaked database cannot be used to sign in. Tokens that belong to one
 * login share a familyId: using an already-used token ends the whole family.
 * MongoDB deletes rows by itself once they expire (the TTL index).
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    familyId: { type: String, required: true, maxlength: 64 },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    // Why it was revoked. Only "rotated" tokens get the short grace window.
    revokedReason: { type: String, enum: ["rotated", "logout", "password", "reuse"] },
    userAgent: { type: String, maxlength: 200, default: "" },
  },
  schemaOptions()
);

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ familyId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RefreshToken", refreshTokenSchema);