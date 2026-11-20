import { z } from "zod";

import {
  ACCOMMODATION_TYPES,
  ACCOUNT_STATUSES,
  BUDGET_TIERS,
  INTENSITIES,
  INTERESTS,
  PACES,
  ROLES,
  TRANSPORT_TYPES,
} from "../constants.js";
import { IMAGE_URL } from "../models/shared.js";
import { emailField, fullNameField, loginPasswordField, newPasswordField, phoneField } from "./auth.js";
import { pagingShape, textParam } from "./common.js";

const travelPreferences = z.strictObject({
  interests: z
    .array(z.enum(INTERESTS))
    .max(INTERESTS.length)
    .refine((list) => new Set(list).size === list.length, "Choose each interest only once.")
    .optional(),
  budgetCategory: z.enum(BUDGET_TIERS).optional(),
  accommodation: z.enum(ACCOMMODATION_TYPES).optional(),
  transport: z.enum(TRANSPORT_TYPES).optional(),
  intensity: z.enum(INTENSITIES).optional(),
  pace: z.enum(PACES).optional(),
});

// An address, a "/path", or "" to remove the image. Embedded "data:" images
// are not accepted: pictures are uploaded to real storage in a later step.
const profileImage = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .max(2000, "The image address is too long.")
    .regex(IMAGE_URL, "The image must be a web address (https://...) or a path such as /images/me.png."),
]);

// strictObject: any field not listed (role, status, passwordHash, tokenVersion,
// createdAt ...) makes the whole request fail, so none of them can be set here.
export const updateProfileBody = z
  .strictObject({
    fullName: fullNameField.optional(),
    email: emailField.optional(),
    phone: phoneField.optional(),
    location: z.string().trim().max(100, "Location must be 100 characters or fewer.").optional(),
    profileImage: profileImage.optional(),
    // null removes the saved preferences; an object REPLACES them.
    travelPreferences: travelPreferences.nullable().optional(),
    // Only needed (and only used) when the email changes.
    currentPassword: loginPasswordField.optional(),
  })
  .refine(
    (body) => Object.keys(body).some((key) => key !== "currentPassword"),
    "Send at least one field to change."
  );

export const changePasswordBody = z
  .strictObject({
    currentPassword: loginPasswordField,
    newPassword: newPasswordField,
  })
  .refine((body) => body.newPassword !== body.currentPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

export const adminUsersQuery = z.strictObject({
  ...pagingShape(),
  role: z.enum(ROLES).optional(),
  status: z.enum(ACCOUNT_STATUSES).optional(),
  q: textParam.optional(),
  sort: z.enum(["name", "-name", "email", "-email", "createdAt", "-createdAt"]).optional(),
});