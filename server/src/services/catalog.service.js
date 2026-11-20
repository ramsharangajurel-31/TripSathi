// Reads the public catalog. Two rules apply to everything here:
//  1. Only ACTIVE records are visible.
//  2. A record whose destination is inactive is hidden too.

import { Activity, Attraction, Destination } from "../models/index.js";
import { notFound } from "../utils/httpError.js";
import { getPaging, paginationMeta } from "../utils/pagination.js";
import { escapeRegex } from "../utils/regex.js";

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const NAME_ORDER = { locale: "en" }; // case-insensitive alphabetical order
const DESTINATION_REF = { path: "destination", select: "name slug status" };

// ---------- Filters (pure functions, tested without a database) ----------

const contains = (text) => new RegExp(escapeRegex(text), "i");

export function buildDestinationFilter(query) {
  const filter = { status: "active" };

  if (query.province) filter.province = query.province;
  if (query.interest) filter.interests = query.interest;
  if (query.popular !== undefined) filter.popular = query.popular;
  if (query.featured !== undefined) filter.featured = query.featured;

  if (query.q) {
    const pattern = contains(query.q);
    filter.$or = [{ name: pattern }, { tagline: pattern }, { province: pattern }];
  }
  return filter;
}

export function buildAttractionFilter(query, destinationIds) {
  const filter = { status: "active", destination: { $in: destinationIds } };

  if (query.type) filter.type = query.type;
  if (query.fee === "free") filter.entryFee = 0;
  if (query.fee === "paid") filter.entryFee = { $gt: 0 };
  if (query.fee === "unknown") filter.entryFee = null; // null or never set

  if (query.q) {
    const pattern = contains(query.q);
    filter.$or = [{ name: pattern }, { description: pattern }];
  }
  return filter;
}

export function buildActivityFilter(query, destinationIds) {
  const filter = { status: "active", destination: { $in: destinationIds } };
  const all = [];

  if (query.category) filter.category = query.category;
  if (query.intensity) filter.intensity = query.intensity;
  if (query.bestTime) filter.bestTime = query.bestTime;
  if (query.maxCost !== undefined) filter.costPerPerson = { $lte: query.maxCost };

  // An empty season list means "available all year".
  if (query.month !== undefined) {
    all.push({ $or: [{ seasonalAvailability: { $size: 0 } }, { seasonalAvailability: query.month }] });
  }
  if (query.q) {
    const pattern = contains(query.q);
    all.push({ $or: [{ name: pattern }, { description: pattern }] });
  }

  if (all.length > 0) filter.$and = all;
  return filter;
}

// ---------- Sorting ----------

const DESTINATION_SORTS = {
  name: { name: 1 },
  "-name": { name: -1 },
  rating: { rating: 1 },
  "-rating": { rating: -1 },
  recommendedDays: { recommendedDays: 1 },
  "-recommendedDays": { recommendedDays: -1 },
};
const ATTRACTION_SORTS = { name: { name: 1 }, "-name": { name: -1 } };
const ACTIVITY_SORTS = {
  name: { name: 1 },
  "-name": { name: -1 },
  cost: { costPerPerson: 1 },
  "-cost": { costPerPerson: -1 },
  duration: { durationHours: 1 },
  "-duration": { durationHours: -1 },
};

// _id last, so equal values keep a stable order from page to page.
const withTieBreak = (sort) => ({ ...sort, _id: 1 });

// ---------- Helpers ----------

async function findActiveDestination(idOrSlug) {
  const filter = OBJECT_ID.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };
  return Destination.findOne({ ...filter, status: "active" });
}

const activeDestinationIds = () => Destination.find({ status: "active" }).distinct("_id");

// A named destination that does not exist (or is hidden) simply has no items.
async function destinationScope(destination) {
  if (!destination) return activeDestinationIds();
  const found = await findActiveDestination(destination);
  return found ? [found._id] : [];
}

// ---------- Destinations ----------

export async function listDestinations(query) {
  const { page, limit, skip } = getPaging(query);
  const filter = buildDestinationFilter(query);
  const sort = withTieBreak(DESTINATION_SORTS[query.sort] ?? { popular: -1, name: 1 });

  const [items, total] = await Promise.all([
    Destination.find(filter).sort(sort).collation(NAME_ORDER).skip(skip).limit(limit),
    Destination.countDocuments(filter),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function searchDestinations({ q, limit = 8 }) {
  const filter = buildDestinationFilter({ q });
  const items = await Destination.find(filter)
    .sort(withTieBreak({ popular: -1, name: 1 }))
    .collation(NAME_ORDER)
    .limit(limit);

  return { items, meta: { query: q, count: items.length } };
}

export async function getDestination(idOrSlug) {
  const destination = await findActiveDestination(idOrSlug);
  if (!destination) throw notFound("Destination not found.", "DESTINATION_NOT_FOUND");

  const [attractions, activities] = await Promise.all([
    Attraction.countDocuments({ destination: destination._id, status: "active" }),
    Activity.countDocuments({ destination: destination._id, status: "active" }),
  ]);

  return { ...destination.toJSON(), counts: { attractions, activities } };
}

// ---------- Attractions ----------

export async function listAttractions(query) {
  const { page, limit, skip } = getPaging(query);
  const filter = buildAttractionFilter(query, await destinationScope(query.destination));
  const sort = withTieBreak(ATTRACTION_SORTS[query.sort] ?? { name: 1 });

  const [items, total] = await Promise.all([
    Attraction.find(filter).sort(sort).collation(NAME_ORDER).skip(skip).limit(limit).populate(DESTINATION_REF),
    Attraction.countDocuments(filter),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function getAttraction(id) {
  const attraction = await Attraction.findOne({ _id: id, status: "active" }).populate(DESTINATION_REF);

  if (!attraction || attraction.destination?.status !== "active") {
    throw notFound("Attraction not found.", "ATTRACTION_NOT_FOUND");
  }
  return attraction;
}

// ---------- Activities ----------

export async function listActivities(query) {
  const { page, limit, skip } = getPaging(query);
  const filter = buildActivityFilter(query, await destinationScope(query.destination));
  const sort = withTieBreak(ACTIVITY_SORTS[query.sort] ?? { name: 1 });

  const [items, total] = await Promise.all([
    Activity.find(filter).sort(sort).collation(NAME_ORDER).skip(skip).limit(limit).populate(DESTINATION_REF),
    Activity.countDocuments(filter),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function getActivity(id) {
  const activity = await Activity.findOne({ _id: id, status: "active" }).populate(DESTINATION_REF);

  if (!activity || activity.destination?.status !== "active") {
    throw notFound("Activity not found.", "ACTIVITY_NOT_FOUND");
  }
  return activity;
}