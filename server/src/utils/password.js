import bcrypt from "bcryptjs";

import { env } from "../config/env.js";

export const hashPassword = (password) => bcrypt.hash(password, env.auth.bcryptCost);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

// When a login names an email that does not exist, a password check is still
// done against a throwaway hash, so the response takes about as long as for a
// real account and cannot be used to discover which emails are registered.
let dummyHash;
export async function verifyAgainstDummy(password) {
  dummyHash ??= await bcrypt.hash("timing-equalisation-only", env.auth.bcryptCost);
  await bcrypt.compare(password, dummyHash);
}