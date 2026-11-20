import { z } from "zod";

import { normalizePhone } from "../utils/phone.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;
const PHONE = /^9\d{9}$/;
// bcrypt only reads the first 72 bytes. Longer passwords would be silently
// cut short, so they are rejected instead.
export const MAX_PASSWORD_BYTES = 72;

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long.")
  .regex(EMAIL, "Enter a valid email address.");

export const fullNameField = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(80, "Name must be 80 characters or fewer.")
  .regex(NAME, "Name can contain only letters, spaces, dots, apostrophes and hyphens.");

export const phoneField = z
  .string()
  .max(30, "Phone number is too long.")
  .transform(normalizePhone)
  .pipe(z.string().regex(PHONE, "Enter a valid 10-digit Nepali mobile number."));

const withinByteLimit = (schema) =>
  schema.refine(
    (value) => Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES,
    `Password must be at most ${MAX_PASSWORD_BYTES} bytes (about ${MAX_PASSWORD_BYTES} characters).`
  );

// For choosing a password (register, change password).
export const newPasswordField = withinByteLimit(
  z.string().min(8, "Password must be at least 8 characters.")
).refine(
  (value) => /[A-Za-z]/.test(value) && /\d/.test(value),
  "Password must include at least one letter and one number."
);

// For signing in: only checks that something was typed, so people with older
// passwords are not locked out by a stricter rule.
export const loginPasswordField = withinByteLimit(z.string().min(1, "Password is required."));

// strictObject rejects every field not listed. A request cannot smuggle in
// "role" or "status" this way (mass-assignment protection).
export const registerBody = z.strictObject({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  password: newPasswordField,
});

export const loginBody = z.strictObject({
  email: emailField,
  password: loginPasswordField,
});

// For administrators, who can see everyone's data: at least 12 characters.
export const adminPasswordField = newPasswordField.refine(
  (value) => value.length >= 12,
  "Administrator passwords must be at least 12 characters."
);