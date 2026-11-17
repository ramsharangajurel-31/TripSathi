import mongoose from "mongoose";

import { INTENSITIES, INTERESTS, RECORD_STATUSES, TIME_SLOTS } from "../constants.js";
import { addDataQuality, addNameKey, schemaOptions, uniqueValues, whole } from "./shared.js";

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    destination: { type: Schema.Types.ObjectId, ref: "Destination", required: [true, "Choose a destination."] },
    name: { type: String, required: [true, "Activity name is required."], trim: true, minlength: 2, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    category: { type: String, enum: INTERESTS, required: [true, "Choose a type."] },
    durationHours: { type: Number, required: true, min: 0.5, max: 24 },
    // Estimated cost for ONE traveller, in NPR. 0 means free.
    costPerPerson: { type: Number, required: true, min: 0, max: 1_000_000, validate: whole },
    intensity: { type: String, enum: INTENSITIES, default: "easy", required: true },
    bestTime: { type: String, enum: TIME_SLOTS, default: "morning", required: true },
    // Months (1 = January) when it is available. Empty means all year.
    seasonalAvailability: {
      type: [{ type: Number, min: 1, max: 12, validate: whole }],
      default: [],
      validate: uniqueValues,
    },
    // Short notes such as "Minimum age 12" or "Not suitable in heavy rain".
    restrictions: {
      type: [{ type: String, trim: true, maxlength: 200 }],
      default: [],
      validate: {
        validator: (list) => list.length <= 10,
        message: "An activity can have at most 10 restrictions.",
      },
    },
    status: { type: String, enum: RECORD_STATUSES, default: "active", required: true },
  },
  schemaOptions()
);

addNameKey(activitySchema);
addDataQuality(activitySchema);

activitySchema.index({ destination: 1, nameKey: 1 }, { unique: true });
activitySchema.index({ destination: 1, category: 1, intensity: 1 });
activitySchema.index({ costPerPerson: 1 });
activitySchema.index(
  { name: "text", description: "text" },
  { name: "activity_text", weights: { name: 10, description: 1 }, default_language: "none" }
);

export default mongoose.model("Activity", activitySchema);