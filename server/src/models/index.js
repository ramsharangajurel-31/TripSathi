
import Activity from "./Activity.js";
import Attraction from "./Attraction.js";
import Destination from "./Destination.js";
import User from "./User.js";
import RefreshToken from "./RefreshToken.js";

export {
  Activity,
  Attraction,
  Destination,
  User,
  RefreshToken,
};

export const models = [
  User,
  Destination,
  Attraction,
  Activity,
  RefreshToken,
];

/**
 * Creates any missing indexes (never drops one).
 * The server calls this at start-up in development.
 * In production run `npm run db:indexes` as a deliberate deploy step.
 */
export async function ensureIndexes() {
  for (const model of models) {
    await model.createIndexes();
  }
}
