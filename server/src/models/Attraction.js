import mongoose from "mongoose";

import { ATTRACTION_TYPES, RECORD_STATUSES } from "../constants.js";
import {
  addDataQuality,
  addNameKey,
  imagesField,
  pointField,
  schemaOptions,
  whole,
} from "./shared.js";

const { Schema } = mongoose;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// One opening period. Days are 0 (Sunday) to 6 (Saturday). A place open on
// several days has several entries. Overnight periods are not supported.
const openingHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6, validate: whole },
    opens: { type: String, required: true, match: [TIME, "Use 24-hour HH:MM, for example 06:30."] },
    closes: { type: String, required: true, match: [TIME, "Use 24-hour HH:MM, for example 18:00."] },
  },
  { _id: false }
);

openingHoursSchema.pre("validate", function () {
  // "HH:MM" strings compare correctly as text.
  if (this.opens && this.closes && this.opens >= this.closes) {
    this.invalidate("closes", "Closing time must be after opening time.");
  }
});

const attractionSchema = new Schema(
  {
    destination: { type: Schema.Types.ObjectId, ref: "Destination", required: [true, "Choose a destination."] },
    name: { type: String, required: [true, "Attraction name is required."], trim: true, minlength: 2, maxlength: 80 },
    type: { type: String, enum: ATTRACTION_TYPES, required: [true, "Choose a type."] },
    description: { type: String, trim: true, maxlength: 400, default: "" },
    location: pointField(),
    // Entry fee per person in NPR. null means UNKNOWN (never assume free);
    // 0 means free. Fees change, so treat every value as an estimate.
    entryFee: { type: Number, min: 0, max: 100_000, default: null, validate: whole },
    visitDurationHours: { type: Number, min: 0.25, max: 24 },
    openingHours: { type: [openingHoursSchema], default: [] },
    images: imagesField(),
    status: { type: String, enum: RECORD_STATUSES, default: "active", required: true },
  },
  schemaOptions()
);

addNameKey(attractionSchema);
addDataQuality(attractionSchema);

// The same attraction name is allowed in different destinations.
attractionSchema.index({ destination: 1, nameKey: 1 }, { unique: true });
attractionSchema.index({ destination: 1, type: 1 });
attractionSchema.index({ location: "2dsphere" });
attractionSchema.index(
  { name: "text", description: "text" },
  { name: "attraction_text", weights: { name: 10, description: 1 }, default_language: "none" }
);

export default mongoose.model("Attraction", attractionSchema);