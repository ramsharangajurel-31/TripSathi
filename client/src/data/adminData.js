// ==========================================================================
// TripSathi – Admin demonstration data
//
// The admin panel works on its OWN copy of destinations, attractions and
// activities, stored in localStorage. The copy starts from the traveler
// data files, so the lists begin consistent, but admin changes do not flow
// back to the traveler pages. Say so on screen (ADMIN_DATA_NOTICE).
//
// There was no attractions list before, so it is built from each
// destination's "highlights". Attraction types below were assigned by hand.
// Entry fees are left empty (unknown), because no real fees are available.
// ==========================================================================

import baseActivities from "./activities";
import baseDestinations from "./destinations";

export const ADMIN_DATA_NOTICE =
  "Demonstration data. Changes are saved in this browser only and do not affect the traveler pages.";

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

const clone = (value) => JSON.parse(JSON.stringify(value));

// ---------- Seeds ----------

// Highlights move to the attractions list, so they are removed here.
export const SEED_DESTINATIONS = baseDestinations.map((destination) => {
  const copy = clone(destination);
  delete copy.highlights;
  return copy;
});

export const SEED_ATTRACTIONS = baseDestinations.flatMap((destination) =>
  destination.highlights.map((name, index) => ({
    id: `${destination.id}-attraction-${index + 1}`,
    destinationId: destination.id,
    name,
    type: ATTRACTION_TYPE_BY_NAME[name] || "Other",
    description: "",
    entryFee: null, // unknown: no real fees are available
  }))
);

export const SEED_ACTIVITIES = clone(baseActivities);

// ---------- Ids ----------

/** "Old Town Walk" -> "old-town-walk", with -2, -3 ... when already taken. */
export function createSlug(text, takenIds = []) {
  const base =
    String(text || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item";

  const taken = new Set(takenIds);
  if (!taken.has(base)) return base;

  let counter = 2;
  while (taken.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

export const createUniqueId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Nepal's seven provinces, for the destination form.
export const PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];