import { User } from "../models/index.js";
import { conflict } from "../utils/httpError.js";
import { hashPassword } from "../utils/password.js";

/**
 * Makes sure an administrator account exists for this email. Used by the
 * `npm run admin:create` script, because the public API can never create
 * an administrator.
 *
 *   created        a new administrator account was made
 *   promoted       an existing traveler account became an administrator
 *                  (only with promote: true; its password is not touched)
 *   already-admin  nothing to do
 */
export async function ensureAdmin({ fullName, email, phone, password, promote = false }) {
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === "admin") return { action: "already-admin", user: existing };

    if (!promote) {
      throw conflict(
        "This email already belongs to a traveler account. Run the script with --promote to make it an administrator.",
        "EMAIL_TAKEN"
      );
    }

    existing.role = "admin";
    await existing.save();
    return { action: "promoted", user: existing };
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ fullName, email, phone, passwordHash, role: "admin" });
  return { action: "created", user };
}