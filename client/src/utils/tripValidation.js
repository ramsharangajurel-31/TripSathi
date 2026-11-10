// ==========================================================================
// TripSathi – Trip wizard validation
//
// One validator per wizard step. Each takes the whole form `values` and
// returns an errors object keyed by field name (empty object = valid), the
// same shape the Input and Select components display.
//
// When the backend exists, repeat these checks on the server.
// ==========================================================================

import {
  ACCOMMODATION_OPTIONS,
  INTENSITY_OPTIONS,
  PACE_OPTIONS,
  START_LOCATIONS,
  TRANSPORT_OPTIONS,
  TRIP_LIMITS,
} from "../data/tripOptions";
import { ACTIVITY_SLOTS } from "../data/activities";
import { BUDGET_TIERS, INTERESTS } from "../data/destinations";
import { parseDate } from "./formatDate";
import { formatCurrency } from "./formatCurrency";
import { getMinimumTripDays } from "./tripGenerator";
import { getDurationDays } from "./tripUtils";
import { validateDateRange, validateNumberRange } from "./validation";

export const SPECIAL_REQUIREMENTS_MAX = 300;
export const DESCRIPTION_MAX = 500;
export const NOTES_MAX = 500;
const isOneOf = (options, id) => options.some((option) => option.id === id);

// ---------- Step 1: destination and dates ----------
export function validateDestinationStep(values) {
  const errors = {};

  if (!START_LOCATIONS.some((item) => item.value === values.startingLocation)) {
    errors.startingLocation = "Choose where your trip starts.";
  }

  const count = values.destinationIds.length;
  if (count === 0) {
    errors.destinationIds = "Choose at least one destination.";
  } else if (count > TRIP_LIMITS.maxDestinations) {
    errors.destinationIds = `Choose up to ${TRIP_LIMITS.maxDestinations} destinations.`;
  }

  const dateErrors = validateDateRange(values.departureDate, values.returnDate);
  if (dateErrors.departure) errors.departureDate = dateErrors.departure;
  if (dateErrors.returnDate) errors.returnDate = dateErrors.returnDate;

  if (!errors.departureDate && !errors.returnDate) {
    const days = getDurationDays(values.departureDate, values.returnDate);
    const minimum = getMinimumTripDays(count);

    if (days > TRIP_LIMITS.maxDays) {
      errors.returnDate = `A trip can be at most ${TRIP_LIMITS.maxDays} days long.`;
    } else if (count > 0 && days < minimum) {
      errors.returnDate = `${count} destinations need at least ${minimum} days.`;
    }
  }

  return errors;
}

// ---------- Step 2: budget and travelers ----------
export function validateBudgetStep(values) {
  const errors = {};

  const budget = Number(values.budgetTotal);
  if (values.budgetTotal === "" || values.budgetTotal === null) {
    errors.budgetTotal = "Enter your total budget.";
  } else if (!Number.isFinite(budget)) {
    errors.budgetTotal = "Budget must be a number.";
  } else if (budget < TRIP_LIMITS.minBudget) {
    errors.budgetTotal = `Budget must be at least ${formatCurrency(TRIP_LIMITS.minBudget)}.`;
  } else if (budget > TRIP_LIMITS.maxBudget) {
    errors.budgetTotal = `Budget must be ${formatCurrency(TRIP_LIMITS.maxBudget)} or less.`;
  }

  const adultsError = validateNumberRange(values.adults, {
    label: "Adults",
    min: TRIP_LIMITS.minAdults,
    max: TRIP_LIMITS.maxAdults,
    integer: true,
  });
  if (adultsError) errors.adults = adultsError;

  const childrenError = validateNumberRange(values.children, {
    label: "Children",
    min: 0,
    max: TRIP_LIMITS.maxChildren,
    integer: true,
  });
  if (childrenError) errors.children = childrenError;

  if (!BUDGET_TIERS.includes(values.budgetCategory)) {
    errors.budgetCategory = "Choose a budget level.";
  }

  return errors;
}

// ---------- Step 3: interests ----------
export function validateInterestsStep(values) {
  return values.interests.length === 0
    ? { interests: "Choose at least one interest so we can match activities." }
    : {};
}

// ---------- Step 4: preferences ----------
export function validatePreferencesStep(values) {
  const errors = {};
  const preferences = values.preferences || {};

  if (!isOneOf(ACCOMMODATION_OPTIONS, preferences.accommodation)) {
    errors.accommodation = "Choose an accommodation type.";
  }
  if (!isOneOf(TRANSPORT_OPTIONS, preferences.transport)) {
    errors.transport = "Choose a transport option.";
  }
  if (!isOneOf(INTENSITY_OPTIONS, preferences.intensity)) {
    errors.intensity = "Choose an activity intensity.";
  }
  if (!isOneOf(PACE_OPTIONS, preferences.pace)) {
    errors.pace = "Choose a travel pace.";
  }
    if ((preferences.special || "").length > SPECIAL_REQUIREMENTS_MAX) {
    errors.special = `Keep this under ${SPECIAL_REQUIREMENTS_MAX} characters.`;
  }
  if ((values.notes || "").length > NOTES_MAX) {
    errors.notes = `Keep this under ${NOTES_MAX} characters.`;
  }

  return errors;
}



// ---------- Step 5: description and review ----------
export function validateReviewStep(values) {
  return (values.description || "").length > DESCRIPTION_MAX
    ? { description: `Keep this under ${DESCRIPTION_MAX} characters.` }
    : {};
}
// ---------- Editing an existing trip ----------
export const ACTIVITY_NAME_MAX = 80;
export const ACTIVITY_NOTES_MAX = 300;
export const DAY_NOTE_MAX = 300;

export function validateTripInfo(values) {
  const errors = {};

  const title = (values.title || "").trim();
  if (!title) errors.title = "Trip name is required.";
  else if (title.length < 3) errors.title = "Trip name must be at least 3 characters.";
  else if (title.length > 100) errors.title = "Trip name must be 100 characters or fewer.";

  // Budget and travelers follow the same rules as the wizard.
  const budgetErrors = validateBudgetStep({ ...values, budgetCategory: BUDGET_TIERS[0] });
  ["budgetTotal", "adults", "children"].forEach((key) => {
    if (budgetErrors[key]) errors[key] = budgetErrors[key];
  });

  if (!values.departureDate) errors.departureDate = "Departure date is required.";
  else if (!parseDate(values.departureDate)) errors.departureDate = "Enter a valid departure date.";

  if ((values.notes || "").length > NOTES_MAX) {
    errors.notes = `Keep this under ${NOTES_MAX} characters.`;
  }

  return errors;
}

export function validateActivityForm(values, dayIds) {
  const errors = {};

  const name = values.name.trim();
  if (!name) errors.name = "Activity name is required.";
  else if (name.length < 2) errors.name = "Activity name must be at least 2 characters.";
  else if (name.length > ACTIVITY_NAME_MAX) {
    errors.name = `Activity name must be ${ACTIVITY_NAME_MAX} characters or fewer.`;
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

  const costError = validateNumberRange(values.costPerPerson, {
    label: "Cost",
    min: 0,
    max: 1000000,
    integer: true,
  });
  if (costError) errors.costPerPerson = costError;

  if (!dayIds.includes(values.dayId)) errors.dayId = "Choose a day.";
  if (!ACTIVITY_SLOTS.some((slot) => slot.id === values.slot)) {
    errors.slot = "Choose a time of day.";
  }

  if ((values.notes || "").length > ACTIVITY_NOTES_MAX) {
    errors.notes = `Keep this under ${ACTIVITY_NOTES_MAX} characters.`;
  }

  return errors;
}

// In wizard order. The wizard runs STEP_VALIDATORS[currentStep](values).
// In wizard order. The wizard runs STEP_VALIDATORS[currentStep](values).
export const STEP_VALIDATORS = [
  validateDestinationStep,
  validateBudgetStep,
  validateInterestsStep,
  validatePreferencesStep,
  validateReviewStep,
];