// ==========================================================================
// TripSathi – Form validation helpers
//
// Every validator returns an error message string, or "" when the value is
// valid. This matches the `error` prop of the Input and Select components:
//
//   <Input error={errors.email} ... />
//
// The same rules are reused by Login, Register, the trip wizard, profile
// and the admin forms. When a real backend exists, keep these checks for
// instant feedback, and ALSO validate on the server (never trust the client).
// ==========================================================================

// ---------- Single-field validators ----------

export function validateRequired(value, label = "This field") {
  const text = typeof value === "string" ? value.trim() : value;
  if (text === "" || text === null || text === undefined) {
    return `${label} is required.`;
  }
  return "";
}

export function validateFullName(value) {
  const name = (value || "").trim();
  if (!name) return "Full name is required.";
  if (name.length < 2) return "Enter your full name.";
  if (name.length > 80) return "Name must be 80 characters or fewer.";
  // Letters (any language, including Devanagari), spaces, dots, apostrophes, hyphens
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(name)) {
    return "Name can contain only letters, spaces, dots, apostrophes and hyphens.";
  }
  return "";
}

export function validateEmail(value) {
  const email = (value || "").trim();
  if (!email) return "Email is required.";
  if (email.length > 254) return "Email address is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Enter a valid email address, for example name@example.com.";
  }
  return "";
}

/**
 * Nepali mobile number: 10 digits starting with 9 (for example 98XXXXXXXX),
 * optionally written with +977 or 977 and with spaces or dashes.
 * Landline numbers are not accepted here.
 */
export function normalizePhone(value) {
  return (value || "")
    .replace(/[\s-]/g, "")
    .replace(/^\+?977/, "");
}

export function validatePhone(value, { required = true } = {}) {
  const raw = (value || "").trim();
  if (!raw) return required ? "Phone number is required." : "";
  if (!/^\+?[\d\s-]+$/.test(raw)) {
    return "Phone number can contain only digits, spaces and dashes.";
  }
  if (!/^9\d{9}$/.test(normalizePhone(raw))) {
    return "Enter a valid 10-digit mobile number, for example 98XXXXXXXX.";
  }
  return "";
}

export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(value) {
  const password = value || "";
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > 128) return "Password must be 128 characters or fewer.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return "";
}

// For the login form only: checks presence, not strength, so existing
// accounts with older passwords can still sign in.
export function validateLoginPassword(value) {
  return value ? "" : "Password is required.";
}

export function validateConfirmPassword(password, confirmation) {
  if (!confirmation) return "Please confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return "";
}

// ---------- Password strength (for the Register meter) ----------
// Returns { score: 0-4, label, level } where level maps to a CSS modifier.
export function getPasswordStrength(value) {
  const password = value || "";
  if (!password) return { score: 0, label: "", level: "none" };

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { label: "Too short", level: "weak" },
    { label: "Weak", level: "weak" },
    { label: "Fair", level: "fair" },
    { label: "Good", level: "good" },
    { label: "Strong", level: "strong" },
  ];

  // Anything under the minimum length is always "Too short"
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { score: 1, ...levels[0] };
  }
  return { score, ...levels[score] };
}

// ---------- Date and number validators (used by the trip wizard) ----------

export function validateDateRange(departure, returnDate) {
  const errors = { departure: "", returnDate: "" };

  if (!departure) errors.departure = "Departure date is required.";
  if (!returnDate) errors.returnDate = "Return date is required.";
  if (errors.departure || errors.returnDate) return errors;

  const start = new Date(`${departure}T00:00:00`);
  const end = new Date(`${returnDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(start.getTime())) errors.departure = "Enter a valid departure date.";
  if (Number.isNaN(end.getTime())) errors.returnDate = "Enter a valid return date.";
  if (errors.departure || errors.returnDate) return errors;

  if (start < today) errors.departure = "Departure date cannot be in the past.";
  if (end < start) errors.returnDate = "Return date must be on or after the departure date.";

  return errors;
}

export function validateNumberRange(value, { label = "Value", min, max, integer = false } = {}) {
  if (value === "" || value === null || value === undefined) {
    return `${label} is required.`;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return `${label} must be a number.`;
  if (integer && !Number.isInteger(number)) return `${label} must be a whole number.`;
  if (min !== undefined && number < min) return `${label} must be at least ${min}.`;
  if (max !== undefined && number > max) return `${label} must be ${max} or less.`;
  return "";
}

// ---------- Form-level helpers ----------

/**
 * Runs a map of validators and returns an errors object.
 *
 *   const errors = validateForm(values, {
 *     email: (v) => validateEmail(v.email),
 *     password: (v) => validatePassword(v.password),
 *   });
 *
 * Each rule receives the whole `values` object, so rules can compare
 * fields (for example confirm password). Fields that pass are omitted.
 */
export function validateForm(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const message = rule(values);
    if (message) errors[field] = message;
  });
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;