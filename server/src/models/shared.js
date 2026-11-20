import mongoose from "mongoose";

import { DEFAULT_SOURCE_NAME, VERIFICATION_STATUSES } from "../constants.js";

const { Schema } = mongoose;

// A web address or a "/path" (not "//host"), same rule as the frontend.
export const IMAGE_URL = /^(?:https?:\/\/\S+|\/(?!\/)\S*)$/i;
const WEB_URL = /^https?:\/\/\S+$/i;

/**
 * Options every schema uses. A function, so each schema gets its own copy.
 *  - timestamps: createdAt / updatedAt
 *  - autoIndex off: indexes are created deliberately (see models/index.js)
 *  - toJSON: "id" instead of "_id", no "__v", and internal or secret fields
 *    (passwordHash, nameKey) never leave the server
 */
export function schemaOptions() {
  return {
    timestamps: true,
    autoIndex: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        delete ret._id;
        delete ret.passwordHash;
       delete ret.nameKey;
        delete ret.tokenVersion;
        return ret;
      },
    },
  };
}

// null and undefined pass: "empty" is the job of required / default.
export const whole = {
  validator: (value) => value === null || value === undefined || Number.isInteger(value),
  message: "{PATH} must be a whole number.",
};

export const uniqueValues = {
  validator: (list) => new Set(list).size === list.length,
  message: "{PATH} must not contain duplicates.",
};

// ---------- Location ----------
// GeoJSON point: [longitude, latitude]. Every place in the catalog is in
// Nepal, so the bounds also catch the classic swapped latitude/longitude.
const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      default: undefined,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length === 2 &&
          value[0] >= 80 &&
          value[0] <= 89 &&
          value[1] >= 26 &&
          value[1] <= 31,
        message:
          "Coordinates must be [longitude, latitude] inside Nepal (longitude 80 to 89, latitude 26 to 31).",
      },
    },
  },
  { _id: false }
);

// Absent unless provided, so records without coordinates are simply not
// part of the geo index.
export const pointField = () => ({ type: pointSchema, default: undefined });

// ---------- Images ----------
// Only addresses are stored here. Pictures are uploaded to real storage
// later and referenced by address. Large "data:" images are rejected.
const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      match: [IMAGE_URL, "The image must be a web address (https://...) or a path such as /images/pokhara.jpg."],
    },
    alt: { type: String, trim: true, maxlength: 200, default: "" },
    credit: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { _id: false }
);

export const imagesField = () => ({
  type: [imageSchema],
  default: [],
  validate: {
    validator: (list) => list.length <= 10,
    message: "A record can have at most 10 images.",
  },
});

// ---------- Data quality ----------
/**
 * Adds "where did this data come from, and has anyone checked it?":
 *   dataSource.name / dataSource.url, verificationStatus, lastVerifiedAt.
 * New records are "estimated". "verified" needs a verification date and a
 * real source name, so sample data can never pass as verified.
 */
export function addDataQuality(schema) {
  schema.add({
    dataSource: {
      name: { type: String, trim: true, maxlength: 120, default: DEFAULT_SOURCE_NAME },
      url: {
        type: String,
        trim: true,
        maxlength: 500,
        match: [WEB_URL, "The source link must start with http:// or https://."],
      },
    },
    verificationStatus: { type: String, enum: VERIFICATION_STATUSES, default: "estimated" },
    lastVerifiedAt: { type: Date },
  });

  schema.pre("validate", function () {
    if (this.lastVerifiedAt && this.lastVerifiedAt.getTime() > Date.now() + 5 * 60 * 1000) {
      this.invalidate("lastVerifiedAt", "The verification date cannot be in the future.");
    }

    if (this.verificationStatus === "verified") {
      if (!this.lastVerifiedAt) {
        this.invalidate("lastVerifiedAt", "A verified record needs the date it was verified.");
      }
      const sourceName = this.dataSource?.name;
      if (!sourceName || sourceName === DEFAULT_SOURCE_NAME) {
        this.invalidate("dataSource.name", "A verified record needs a real source, not the sample-estimate default.");
      }
    }
  });
}

// ---------- Duplicate-name protection ----------
export const makeNameKey = (name) =>
  String(name ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Adds a hidden "nameKey" (lowercase, single spaces) that a unique index
 * uses, so "Phewa Lake" and " phewa   LAKE " count as the same name.
 * It is set when the document is validated. Updates that bypass validation
 * (findOneAndUpdate) would skip it, so changes to records are made by
 * loading the document, editing it and calling save().
 */
export function addNameKey(schema) {
  schema.add({ nameKey: { type: String, required: true, select: false } });

  schema.pre("validate", function () {
    if (this.name) this.nameKey = makeNameKey(this.name);
  });
}