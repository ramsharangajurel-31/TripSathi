// Reads the frontend's catalog files and writes the server's seed files:
//   npm run seed:export
// Run it when the frontend data changes. The JSON files it writes
// (server/data/seed/) are what get committed and deployed; the server never
// reads the client folder at run time.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientData = path.resolve(here, "../../client/src/data");
const outDir = path.resolve(here, "../data/seed");

async function loadDefault(file) {
  const target = path.join(clientData, file);
  try {
    return (await import(pathToFileURL(target).href)).default;
  } catch (error) {
    console.error(`Could not read ${target}\n  ${error.message}`);
    process.exit(1);
  }
}

// The frontend has no attraction types, so they are assigned here by hand.
const ATTRACTION_TYPE_BY_NAME = {
  "Pashupatinath Temple": "Religious site",
  "Boudhanath Stupa": "Religious site",
  Swayambhunath: "Religious site",
  "Kathmandu Durbar Square": "Historical site",
  "Phewa Lake": "Nature",
  "World Peace Pagoda": "Religious site",
  "Sarangkot sunrise": "Viewpoint",
  Paragliding: "Adventure",
  "Chitwan National Park jeep safari": "Wildlife",
  "Rapti River canoe ride": "Wildlife",
  "Elephant Breeding Centre": "Wildlife",
  "Tharu cultural show": "Cultural",
  "Maya Devi Temple": "Religious site",
  "Ashoka Pillar": "Historical site",
  "Monastic Zone": "Religious site",
  "Lumbini Museum": "Museum",
  "Bandipur Bazaar": "Cultural",
  "Siddha Cave": "Nature",
  "Thani Mai Temple": "Religious site",
  "Tundikhel viewpoint": "Viewpoint",
  Jomsom: "Cultural",
  "Muktinath Temple": "Religious site",
  "Kagbeni village": "Cultural",
  "Kali Gandaki gorge": "Nature",
  "Sunrise viewpoint": "Viewpoint",
  "Nagarkot–Changu Narayan hike": "Trail / trek",
  "Himalayan panorama": "Viewpoint",
  "Hill-top resorts": "Other",
  "Ilam tea gardens": "Nature",
  "Antu Danda sunrise": "Viewpoint",
  "Kanyam tea estate": "Nature",
  "Mai Pokhari": "Nature",
  "Gurung Museum": "Museum",
  "Annapurna South views": "Viewpoint",
  "Stone-paved village trail": "Trail / trek",
  "Poon Hill route access": "Trail / trek",
  "Everest Base Camp trek": "Trail / trek",
  "Namche Bazaar": "Cultural",
  "Tengboche Monastery": "Religious site",
  "Sagarmatha National Park": "Nature",
};

const destinations = await loadDefault("destinations.js");
const activities = await loadDefault("activities.js");

// A photo credit is only known for the one remote photo chosen earlier.
const creditFor = (destination) =>
  destination.id === "pokhara" && String(destination.image).includes("images.unsplash.com")
    ? "Photo: Kaushal Subedi on Unsplash"
    : "";

const destinationRecords = destinations.map((destination) => ({
  name: destination.name,
  slug: destination.id,
  tagline: destination.tagline,
  description: destination.description,
  province: destination.province,
  interests: destination.interests,
  bestSeason: destination.bestSeason,
  altitudeM: destination.altitudeM,
  recommendedDays: destination.recommendedDays,
  rating: destination.rating,
  popular: Boolean(destination.popular),
  featured: Boolean(destination.featured),
  costPerDay: destination.costPerDay,
  fromKathmandu: destination.fromKathmandu,
  images: destination.image
    ? [{ url: destination.image, alt: `${destination.name}, Nepal`, credit: creditFor(destination) }]
    : [],
}));

let unmapped = 0;
const attractionRecords = destinations.flatMap((destination) =>
  destination.highlights.map((name) => {
    if (!ATTRACTION_TYPE_BY_NAME[name]) unmapped += 1;
    return {
      destination: destination.id,
      name,
      type: ATTRACTION_TYPE_BY_NAME[name] ?? "Other",
      description: "",
      entryFee: null, // unknown: no verified fees are available
    };
  })
);

const knownSlugs = new Set(destinations.map((destination) => destination.id));
const activityRecords = activities.map((activity) => {
  if (!knownSlugs.has(activity.destinationId)) {
    console.error(`Activity "${activity.name}" refers to an unknown destination "${activity.destinationId}".`);
    process.exit(1);
  }
  return {
    destination: activity.destinationId,
    name: activity.name,
    description: activity.description,
    category: activity.category,
    durationHours: activity.durationHours,
    costPerPerson: activity.costPerPerson,
    intensity: activity.intensity,
    bestTime: activity.bestTime,
  };
});

await fs.mkdir(outDir, { recursive: true });
const write = (name, data) =>
  fs.writeFile(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");

await write("destinations.json", destinationRecords);
await write("attractions.json", attractionRecords);
await write("activities.json", activityRecords);

console.log(
  `Exported ${destinationRecords.length} destinations, ${attractionRecords.length} attractions, ${activityRecords.length} activities to ${outDir}`
);
console.log(`Attractions with no assigned type (given "Other"): ${unmapped}`);