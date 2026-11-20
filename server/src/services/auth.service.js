import { User } from "../models/index.js";
import { conflict, forbidden, unauthorized } from "../utils/httpError.js";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "../utils/password.js";
import { startSession } from "./session.service.js";

const EMAIL_TAKEN = () => conflict("An account with this email already exists.", "EMAIL_TAKEN");
const BAD_CREDENTIALS = () => unauthorized("Incorrect email or password.", "INVALID_CREDENTIALS");

/**
 * Creates a traveler account and signs it in. The role is ALWAYS "user":
 * administrators are created only by the server-side script.
 */
export async function register({ fullName, email, phone, password }, userAgent) {
  if (await User.exists({ email })) throw EMAIL_TAKEN();

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await User.create({ fullName, email, phone, passwordHash });
  } catch (error) {
    // Two registrations with the same email at the same moment: the unique
    // index lets only one through.
    if (error?.code === 11000) throw EMAIL_TAKEN();
    throw error;
  }

  return { user, ...(await startSession(user, userAgent)) };
}

/**
 * Checks the email and password and starts a session. "No such email" and
 * "wrong password" give the same answer (and take about the same time).
 * An inactive account is only revealed after the right password.
 */
export async function login({ email, password }, userAgent) {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    await verifyAgainstDummy(password);
    throw BAD_CREDENTIALS();
  }
  if (!(await verifyPassword(password, user.passwordHash))) throw BAD_CREDENTIALS();

  if (user.status !== "active") {
    throw forbidden("This account is inactive. Please contact the administrator.", "ACCOUNT_INACTIVE");
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  return { user, ...(await startSession(user, userAgent)) };
}