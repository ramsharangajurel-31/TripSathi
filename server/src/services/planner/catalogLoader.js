import { Activity, Destination } from "../../models/index.js";
import { createCatalog } from "./catalog.js";

const byName = (a, b) => a.name.localeCompare(b.name) || String(a.id).localeCompare(String(b.id));

/**
 * Reads the visible catalog from the database: ACTIVE destinations, and the
 * ACTIVE activities that belong to them. Anything hidden never reaches the
 * planner, so it can never end up in a plan.
 */
export async function loadCatalog() {
  const destinationDocs = await Destination.find({ status: "active" }).sort({ slug: 1 }).lean();
  const slugById = new Map(destinationDocs.map((doc) => [String(doc._id), doc.slug]));

  const activityDocs = await Activity.find({
    status: "active",
    destination: { $in: destinationDocs.map((doc) => doc._id) },
  }).lean();

  return createCatalog({
    destinations: destinationDocs.map((doc) => ({
      slug: doc.slug,
      name: doc.name,
      province: doc.province,
      interests: doc.interests,
      bestSeason: doc.bestSeason,
      altitudeM: doc.altitudeM,
      recommendedDays: doc.recommendedDays,
      costPerDay: doc.costPerDay,
      fromKathmandu: doc.fromKathmandu,
      verificationStatus: doc.verificationStatus,
    })),
    activities: activityDocs
      .map((doc) => ({
        id: String(doc._id),
        destination: slugById.get(String(doc.destination)),
        name: doc.name,
        category: doc.category,
        durationHours: doc.durationHours,
        costPerPerson: doc.costPerPerson,
        intensity: doc.intensity,
        bestTime: doc.bestTime,
        seasonalAvailability: doc.seasonalAvailability ?? [],
        verificationStatus: doc.verificationStatus,
      }))
      .sort(byName),
  });
}