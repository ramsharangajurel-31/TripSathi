import { z } from "zod";

// Query values arrive as text. These helpers accept ONLY the exact formats
// below, so "1e3", "-1", "" and "0x10" are rejected rather than coerced.

export function intParam({ min = 0, max = 1_000_000, label = "Value" } = {}) {
  return z
    .string()
    .regex(/^\d{1,9}$/, `${label} must be a whole number.`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, `${label} must be between ${min} and ${max}.`);
}

export const flagParam = z.enum(["true", "false"]).transform((value) => value === "true");

export const textParam = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters.")
  .max(50, "Enter at most 50 characters.");

export const objectIdParam = z.string().regex(/^[a-fA-F0-9]{24}$/, "Must be a valid id.");

// A destination can be addressed by its slug ("pokhara") or by its id.
export const slugOrIdParam = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9-]+$/, "Use letters, digits and hyphens only.");

// Defaults are applied in code (see utils/pagination.js), not here, so the
// schemas behave the same in every version of Zod.
export const pagingShape = () => ({
  page: intParam({ min: 1, max: 10000, label: "page" }).optional(),
  limit: intParam({ min: 1, max: 100, label: "limit" }).optional(),
});