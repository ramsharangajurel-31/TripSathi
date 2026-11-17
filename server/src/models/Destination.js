import mongoose from "mongoose";

import { INTERESTS, PROVINCES, RECORD_STATUSES } from "../constants.js";
import { slugify } from "../utils/slug.js";
import {
  addDataQuality,
  imagesField,
  pointField,
  schemaOptions,
  uniqueValues,
  whole,
} from "./shared.js";

const { Schema } = mongoose;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Estimated cost for ONE traveller for ONE day, in NPR, at one budget level.
// These are sample estimates unless the record's data quality says otherwise.
const money = () => ({ type: Number, required: true, min: 0, max: 1_000_000, validate: whole });

const dailyCostSchema = new Schema(
  { stay: money(), food: money(), localTransport: money() },
  { _id: false }
);

const costPerDaySchema = new Schema(
  {
    budget: { type: dailyCostSchema, required: true },
    standard: { type: dailyCostSchema, required: true },
    premium: { type: dailyCostSchema, required: true },
  },
  { _id: false }
);

// Rough access from Kathmandu (the capital is the travel hub in the planner).
const accessSchema = new Schema(
  {
    distanceKm: { type: Number, required: true, min: 0, max: 2000 },
    hours: { type: Number, required: true, min: 0, max: 48 },
    mode: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const destinationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Destination name is required."],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    // The public id used in URLs and by the frontend ("pokhara", "everest-region").
    // It never changes after creation, so links and saved trips stay valid.
    slug: {
      type: String,
      required: [true, "Slug is required (it could not be made from the name; use letters a to z)."],
      trim: true,
      lowercase: true,
      immutable: true,
      maxlength: 80,
      match: [SLUG, "Slug can contain only lowercase letters, digits and single hyphens."],
    },
    tagline: { type: String, required: [true, "Tagline is required."], trim: true, minlength: 5, maxlength: 100 },
    description: {
      type: String,
      required: [true, "Description is required."],
      trim: true,
      minlength: 20,
      maxlength: 600,
    },
    province: { type: String, enum: PROVINCES, required: [true, "Choose a province."] },
    district: { type: String, trim: true, maxlength: 60 },
    region: { type: String, trim: true, maxlength: 60 },
    location: pointField(),
    images: imagesField(),
    interests: {
      type: [{ type: String, enum: INTERESTS }],
      required: [true, "Choose at least one interest."],
      default: undefined,
      validate: [
        { validator: (list) => list.length >= 1, message: "Choose at least one interest." },
        uniqueValues,
      ],
    },
    bestSeason: { type: String, required: [true, "Best season is required."], trim: true, maxlength: 40 },
    altitudeM: { type: Number, required: true, min: 0, max: 9000, validate: whole },
    recommendedDays: { type: Number, required: true, min: 1, max: 30, validate: whole },
    // An editorial score for ordering, NOT an average of verified reviews.
    rating: { type: Number, min: 0, max: 5 },
    popular: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    costPerDay: { type: costPerDaySchema, required: true },
    fromKathmandu: { type: accessSchema, required: true },
    status: { type: String, enum: RECORD_STATUSES, default: "active", required: true },
  },
  schemaOptions()
);

addDataQuality(destinationSchema);

destinationSchema.pre("validate", function () {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

destinationSchema.index({ slug: 1 }, { unique: true });
destinationSchema.index({ status: 1, popular: 1 });
destinationSchema.index({ status: 1, featured: 1 });
destinationSchema.index({ province: 1 });
destinationSchema.index({ interests: 1 });
destinationSchema.index({ location: "2dsphere" });
// Search by words. "none" turns off English stemming, which would mangle
// proper names such as Mustang or Lumbini.
destinationSchema.index(
  { name: "text", tagline: "text", description: "text" },
  { name: "destination_text", weights: { name: 10, tagline: 5, description: 1 }, default_language: "none" }
);

export default mongoose.model("Destination", destinationSchema);