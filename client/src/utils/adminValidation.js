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
import { ACTIVITY_INTENSITIES, ACTIVITY_SLOTS } from "../data/activities";
import { ATTRACTION_TYPES, PROVINCES } from "../data/adminData";
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

// ---------- Attractions ----------
export const ATTRACTION_FEE_MAX = 100000;

/**
 * @param values  the attraction form values (see utils/attractionForm.js)
 * @param options.destinationIds  ids of existing destinations
 * @param options.others          every OTHER attraction, to reject a duplicate
 *                                name within the same destination
 */
export function validateAttraction(values, { destinationIds = [], others = [] } = {}) {
  const errors = {};
  const name = values.name.trim();

  const nameError = validateText(name, { label: "Attraction name", min: 2, max: 80 });
  if (nameError) errors.name = nameError;

  if (!destinationIds.includes(values.destinationId)) {
    errors.destinationId = "Choose a destination.";
  } else if (
    !errors.name &&
    others.some(
      (item) =>
        item.destinationId === values.destinationId &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    )
  ) {
    errors.name = "This destination already has an attraction with this name.";
  }

  if (!ATTRACTION_TYPES.includes(values.type)) errors.type = "Choose a type.";

  if ((values.description || "").trim().length > 400) {
    errors.description = "Keep this under 400 characters.";
  }

  // Blank is allowed: it means "unknown".
  if (values.entryFee !== "") {
    const feeError = validateNumberRange(values.entryFee, {
      label: "Entry fee",
      min: 0,
      max: ATTRACTION_FEE_MAX,
      integer: true,
    });
    if (feeError) errors.entryFee = feeError;
  }

  return errors;
}

// ---------- Activities (catalog) ----------
export const ACTIVITY_COST_MAX = 1000000;

/**
 * @param values  the activity form values (see utils/activityForm.js)
 * @param options.destinationIds  ids of existing destinations
 * @param options.others          every OTHER activity, to reject a duplicate
 *                                name within the same destination
 *
 * Errors come out in the same order as the fields on screen.
 */
export function validateCatalogActivity(values, { destinationIds = [], others = [] } = {}) {
  const errors = {};
  const name = values.name.trim();

  const nameError = validateText(name, { label: "Activity name", min: 2, max: 80 });
  if (nameError) errors.name = nameError;

  if (!destinationIds.includes(values.destinationId)) {
    errors.destinationId = "Choose a destination.";
  } else if (
    !errors.name &&
    others.some(
      (item) =>
        item.destinationId === values.destinationId &&
        item.name.trim().toLowerCase() === name.toLowerCase()
    )
  ) {
    errors.name = "This destination already has an activity with this name.";
  }

  if (!INTERESTS.some((interest) => interest.id === values.category)) {
    errors.category = "Choose a type.";
  }

  const durationError = validateNumberRange(values.durationHours, {
    label: "Duration",
    min: 0.5,
    max: 24,
  });
  if (durationError) errors.durationHours = durationError;

  // Blank is NOT allowed: enter 0 for a free activity.
  const costError = validateNumberRange(values.costPerPerson, {
    label: "Cost",
    min: 0,
    max: ACTIVITY_COST_MAX,
    integer: true,
  });
  if (costError) errors.costPerPerson = costError;

  if (!ACTIVITY_INTENSITIES.some((item) => item.id === values.intensity)) {
    errors.intensity = "Choose a difficulty.";
  }
  if (!ACTIVITY_SLOTS.some((slot) => slot.id === values.bestTime)) {
    errors.bestTime = "Choose a time of day.";
  }

  if ((values.description || "").trim().length > 300) {
    errors.description = "Keep this under 300 characters.";
  }

  return errors;
}