import { User } from "../models/index.js";
import { badRequest, conflict, unauthorized } from "../utils/httpError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { revokeAllForUser, startSession } from "./session.service.js";

// The ONLY fields a user may change on their own profile.
const EDITABLE = ["fullName", "email", "phone", "location", "profileImage", "travelPreferences"];

const NO_ACCOUNT = () => unauthorized("Your session is not valid. Please sign in again.", "INVALID_TOKEN");

async function requireCurrentPassword(user, currentPassword, missingMessage) {
  if (!currentPassword) {
    throw badRequest(
      missingMessage,
      [{ field: "currentPassword", message: "Current password is required." }],
      "PASSWORD_REQUIRED"
    );
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    // 400, not 401: a 401 would make the frontend think the SESSION failed.
    throw badRequest(
      "Your current password is incorrect.",
      [{ field: "currentPassword", message: "Your current password is incorrect." }],
      "INVALID_CURRENT_PASSWORD"
    );
  }
}

export async function updateProfile(userId, input) {
  const { currentPassword, ...changes } = input;

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw NO_ACCOUNT();

  if (changes.email !== undefined) {
    if (changes.email === user.email) {
      delete changes.email; // same address (maybe in another letter case): nothing to change
    } else {
      await requireCurrentPassword(user, currentPassword, "Enter your current password to change your email.");
    }
  }

  for (const field of EDITABLE) {
    if (field in changes) {
      user.set(field, changes[field] === null ? undefined : changes[field]);
    }
  }

  try {
    await user.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw conflict("An account with this email already exists.", "EMAIL_TAKEN");
    }
    throw error;
  }

  return user;
}

/**
 * Changes the password and ends every other session:
 *   1. save the new hash and raise tokenVersion (old access tokens stop working)
 *   2. revoke every refresh token (no old session can renew itself)
 *   3. start a fresh session for the device that made the change
 * The order is deliberate: if something fails after step 1, the user ends up
 * signed out everywhere, never with an old session left alive.
 */
export async function changePassword(userId, { currentPassword, newPassword }, userAgent) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw NO_ACCOUNT();

  await requireCurrentPassword(user, currentPassword, "Enter your current password.");

  const passwordHash = await hashPassword(newPassword);

  await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash, passwordChangedAt: new Date() }, $inc: { tokenVersion: 1 } }
  );
  await revokeAllForUser(user._id, "password");

  const fresh = await User.findById(user._id);
  return { user: fresh, ...(await startSession(fresh, userAgent)) };
}