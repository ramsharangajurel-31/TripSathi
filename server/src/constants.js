// Value lists shared by the models and, later, the request validators. They
// match the lists in client/src/data so a value means the same on both sides.

export const CURRENCY = "NPR"; // every amount in the database is in Nepali rupees

export const INTERESTS = [
  "adventure",
  "nature",
  "culture",
  "historical",
  "food",
  "relaxation",
  "wildlife",
  "photography",
  "trekking",
  "religious",
];

export const PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

export const ATTRACTION_TYPES = [
  "Religious site",
  "Historical site",
  "Cultural",
  "Museum",
  "Nature",
  "Viewpoint",
  "Wildlife",
  "Adventure",
  "Trail / trek",
  "Other",
];

export const INTENSITIES = ["easy", "moderate", "challenging"];
export const TIME_SLOTS = ["morning", "afternoon", "evening"];
export const BUDGET_TIERS = ["budget", "standard", "premium"];
export const ACCOMMODATION_TYPES = ["homestay", "guesthouse", "hotel", "resort"];
export const TRANSPORT_TYPES = ["tourist-bus", "private-car", "flight"];
export const PACES = ["relaxed", "balanced", "packed"];

export const ROLES = ["user", "admin"];
export const ACCOUNT_STATUSES = ["active", "inactive"];
export const RECORD_STATUSES = ["active", "inactive"];

// A record is "estimated" until someone checks it against a real source.
export const VERIFICATION_STATUSES = ["estimated", "verified"];
export const DEFAULT_SOURCE_NAME = "TripSathi sample estimate";