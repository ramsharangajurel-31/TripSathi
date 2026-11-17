import Activity from "./Activity.js";
import Attraction from "./Attraction.js";
import Destination from "./Destination.js";
import User from "./User.js";

export { Activity, Attraction, Destination, User };

export const models = [User, Destination, Attraction, Activity];

/**
 * Creates any missing indexes (never drops one). The server calls this at
 * start-up in development; in production run `npm run db:indexes` as a
 * deliberate deploy step instead.
 */
export async function ensureIndexes() {
  for (const model of models) {
    await model.createIndexes();
  }
}