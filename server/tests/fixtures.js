import mongoose from "mongoose";

// A well-formed bcrypt hash (60 characters). It is not any real password.
export const HASH = `$2b$12$${"a".repeat(53)}`;

/** Runs validation and returns the paths that failed ([] when valid). */
export async function errorPaths(doc) {
  try {
    await doc.validate();
    return [];
  } catch (error) {
    return Object.keys(error.errors ?? {});
  }
}

export const validUser = () => ({
  fullName: "Sita Sharma",
  email: "sita@example.com",
  phone: "9841234567",
  passwordHash: HASH,
});

export const validDestination = () => ({
  name: "Pokhara",
  province: "Gandaki Province",
  tagline: "Lakeside calm beneath the Annapurna range",
  description: "A relaxed lakeside city with mountain views, boating and easy access to treks.",
  interests: ["nature", "adventure"],
  bestSeason: "Sep – Nov, Feb – May",
  altitudeM: 820,
  recommendedDays: 4,
  rating: 4.5,
  costPerDay: {
    budget: { stay: 1000, food: 800, localTransport: 300 },
    standard: { stay: 2800, food: 1600, localTransport: 700 },
    premium: { stay: 8000, food: 3500, localTransport: 1800 },
  },
  fromKathmandu: { distanceKm: 200, hours: 7, mode: "Tourist bus or private car" },
});

export const validAttraction = () => ({
  destination: new mongoose.Types.ObjectId(),
  name: "Phewa Lake",
  type: "Nature",
});

export const validActivity = () => ({
  destination: new mongoose.Types.ObjectId(),
  name: "Phewa Lake boating",
  category: "nature",
  durationHours: 2,
  costPerPerson: 800,
  intensity: "easy",
  bestTime: "afternoon",
});

/** The [fields, options] pair of the schema index that has these field keys. */
export function findIndex(model, predicate) {
  const found = model.schema.indexes().find(([fields]) => predicate(fields));
  return found ? { fields: found[0], options: found[1] } : null;
}