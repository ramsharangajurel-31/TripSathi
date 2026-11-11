// Converts between a destination (as stored) and the text values the form
// edits, and holds small helpers for numeric fields.

import { BUDGET_TIERS } from "../data/destinations";
import { COST_FIELDS, costKey } from "./adminValidation";

export const digitsOnly = (value) => value.replace(/\D/g, "");

/** Digits and a single decimal point. */
export function decimalOnly(value) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  return firstDot === -1
    ? cleaned
    : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

/** Which cleaner a field uses while typing. Other fields are plain text. */
export const NUMERIC_CLEANERS = {
  altitudeM: digitsOnly,
  recommendedDays: digitsOnly,
  distanceKm: digitsOnly,
  rating: decimalOnly,
  hours: decimalOnly,
};

export function emptyDestinationValues() {
  const values = {
    name: "",
    province: "",
    tagline: "",
    description: "",
    image: "",
    interests: [],
    bestSeason: "",
    altitudeM: "",
    recommendedDays: "3",
    rating: "",
    distanceKm: "",
    hours: "",
    mode: "",
    popular: false,
    featured: false,
  };

  BUDGET_TIERS.forEach((tier) =>
    COST_FIELDS.forEach((field) => {
      values[costKey(tier, field.key)] = "";
    })
  );

  return values;
}

const text = (value) => (value === null || value === undefined ? "" : String(value));

export function destinationToValues(destination) {
  const values = {
    name: destination.name || "",
    province: destination.province || "",
    tagline: destination.tagline || "",
    description: destination.description || "",
    image: destination.image || "",
    interests: [...(destination.interests || [])],
    bestSeason: destination.bestSeason || "",
    altitudeM: text(destination.altitudeM),
    recommendedDays: text(destination.recommendedDays),
    rating: text(destination.rating),
    distanceKm: text(destination.fromKathmandu?.distanceKm),
    hours: text(destination.fromKathmandu?.hours),
    mode: destination.fromKathmandu?.mode || "",
    popular: Boolean(destination.popular),
    featured: Boolean(destination.featured),
  };

  BUDGET_TIERS.forEach((tier) =>
    COST_FIELDS.forEach((field) => {
      values[costKey(tier, field.key)] = text(destination.costPerDay?.[tier]?.[field.key]);
    })
  );

  return values;
}

export function valuesToDestination(values) {
  const costPerDay = {};

  BUDGET_TIERS.forEach((tier) => {
    costPerDay[tier] = {};
    COST_FIELDS.forEach((field) => {
      costPerDay[tier][field.key] = Number(values[costKey(tier, field.key)]);
    });
  });

  return {
    name: values.name.trim(),
    province: values.province,
    tagline: values.tagline.trim(),
    description: values.description.trim(),
    image: values.image.trim(),
    interests: values.interests,
    bestSeason: values.bestSeason.trim(),
    altitudeM: Number(values.altitudeM),
    recommendedDays: Number(values.recommendedDays),
    rating: Math.round(Number(values.rating) * 10) / 10,
    popular: values.popular,
    featured: values.featured,
    costPerDay,
    fromKathmandu: {
      distanceKm: Number(values.distanceKm),
      hours: Number(values.hours),
      mode: values.mode.trim(),
    },
  };
}

/** Moves keyboard focus to a field by name (works for checkbox groups too). */
export function focusField(form, name) {
  const field = form.elements[name];
  const target = field && typeof field.focus !== "function" ? field[0] : field;
  if (target) target.focus();
}