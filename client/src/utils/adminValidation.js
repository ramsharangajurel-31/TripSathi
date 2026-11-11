// ==========================================================================
// TripSathi – Admin form validation
//
// One validator per admin form. Each takes the form values and returns an
// errors object keyed by field name ({} = valid), the same shape the Input
// and Select components display. Later steps append the attraction,
// activity and user validators here.
//
// Keys are in the same order as the fields on screen, so the first error is
// the first field the user should fix.
// ==========================================================================

import { PROVINCES } from "../data/adminData";
import { BUDGET_TIERS, INTERESTS } from "../data/destinations";
import { validateNumberRange } from "./validation";

export const COST_FIELDS = [
  { key: "stay", label: "Stay" },
  { key: "food", label: "Food" },
  { key: "localTransport", label: "Local transport" },
];

export const costKey = (tier, field) => `cost_${tier}_${field}`;

const IMAGE_URL = /^https?:\/\/\S+$/i;
const IMAGE_PATH = /^\/\S*$/;

/** An image may be empty, an uploaded data URL, a web address or a /path. */
export function validateImage(value) {
  const image = (value || "").trim();

  if (!image || image.startsWith("data:image/")) return "";
  if (image.length > 2000) return "The image address is too long.";
  if (IMAGE_URL.test(image) || IMAGE_PATH.test(image)) return "";

  return "Enter a web address (https://...), a path such as /images/pokhara.jpg, or upload a file.";
}

function validateText(value, { label, min = 1, max }) {
  const text = (value || "").trim();
  if (!text) return `${label} is required.`;
  if (text.length < min) return `${label} must be at least ${min} characters.`;
  if (text.length > max) return `${label} must be ${max} characters or fewer.`;
  return "";
}

/**
 * @param values  the destination form values (see utils/destinationForm.js)
 * @param others  the other destinations, used to reject a duplicate name
 */
export function validateDestination(values, others = []) {
  const errors = {};
  const set = (key, message) => {
    if (message) errors[key] = message;
  };

  const name = values.name.trim();
  set("name", validateText(name, { label: "Destination name", min: 2, max: 60 }));
  if (!errors.name && others.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = "A destination with this name already exists.";
  }

  if (!PROVINCES.includes(values.province)) errors.province = "Choose a province.";

  set("tagline", validateText(values.tagline, { label: "Tagline", min: 5, max: 100 }));
  set("description", validateText(values.description, { label: "Description", min: 20, max: 600 }));
  set("image", validateImage(values.image));

  const validInterests = values.interests.filter((id) =>
    INTERESTS.some((interest) => interest.id === id)
  );
  if (validInterests.length === 0) errors.interests = "Choose at least one interest.";

  set("bestSeason", validateText(values.bestSeason, { label: "Best season", max: 40 }));
  set("altitudeM", validateNumberRange(values.altitudeM, { label: "Altitude", min: 0, max: 9000, integer: true }));
  set(
    "recommendedDays",
    validateNumberRange(values.recommendedDays, { label: "Recommended days", min: 1, max: 30, integer: true })
  );
  set("rating", validateNumberRange(values.rating, { label: "Rating", min: 0, max: 5 }));

  set("distanceKm", validateNumberRange(values.distanceKm, { label: "Distance", min: 0, max: 2000, integer: true }));
  set("hours", validateNumberRange(values.hours, { label: "Travel time", min: 0, max: 48 }));
  set("mode", validateText(values.mode, { label: "How to get there", max: 120 }));

  BUDGET_TIERS.forEach((tier) => {
    COST_FIELDS.forEach((field) => {
      const key = costKey(tier, field.key);
      set(key, validateNumberRange(values[key], { label: "Cost", min: 0, max: 1000000, integer: true }));
    });
  });

  return errors;
}