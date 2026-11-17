import mongoose from "mongoose";

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
import { normalizePhone } from "../utils/phone.js";
import { IMAGE_URL, schemaOptions, uniqueValues } from "./shared.js";

const { Schema } = mongoose;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;
// bcrypt hashes are always 60 characters: $2b$ + cost + $ + 53 characters.
// A plain-text password can never match this, so it cannot be saved by mistake.
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const travelPreferencesSchema = new Schema(
  {
    interests: {
      type: [{ type: String, enum: INTERESTS }],
      default: [],
      validate: uniqueValues,
    },
    budgetCategory: { type: String, enum: BUDGET_TIERS },
    accommodation: { type: String, enum: ACCOMMODATION_TYPES },
    transport: { type: String, enum: TRANSPORT_TYPES },
    intensity: { type: String, enum: INTENSITIES },
    pace: { type: String, enum: PACES },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: [2, "Enter your full name."],
      maxlength: [80, "Name must be 80 characters or fewer."],
      match: [NAME, "Name can contain only letters, spaces, dots, apostrophes and hyphens."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [EMAIL, "Enter a valid email address."],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      set: normalizePhone,
      match: [/^9\d{9}$/, "Enter a valid 10-digit Nepali mobile number."],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by a query unless asked for explicitly
      match: [BCRYPT_HASH, "The password must be stored as a bcrypt hash, never as text."],
    },
    role: { type: String, enum: ROLES, default: "user", required: true },
    status: { type: String, enum: ACCOUNT_STATUSES, default: "active", required: true },
    location: { type: String, trim: true, maxlength: 100, default: "" },
    profileImage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
      match: [IMAGE_URL, "The profile image must be a web address or a path."],
    },
    travelPreferences: { type: travelPreferencesSchema, default: undefined },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  schemaOptions()
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);