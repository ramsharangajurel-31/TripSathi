// ==========================================================================
// TripSathi – Trip calculations (single source of truth)
//
// Dashboard statistics, itinerary results, the What-if simulator and the
// comparison view ALL use these functions, so the same trip always shows
// the same numbers everywhere.
//
// COST MODEL (sample estimates, shown to users as such)
//  - Every cost in a trip is stored PER PERSON PER DAY.
//  - Adults count as 1 paying traveller, children as CHILD_FACTOR (0.5).
//  - Miscellaneous = MISC_RATE (5%) of all other costs, as a buffer.
//
// Trip shape (see data/sampleTrips.js):
//  days[]: { transport:{label,costPerPerson}, accommodation:{label,costPerPerson}|null,
//            food:{label,costPerPerson}, slots:{morning:[],afternoon:[],evening:[]} }
//  activity item: { id, name, costPerPerson, ... }
// ==========================================================================

import { ACTIVITY_SLOTS } from "../data/activities";
import { getDestinationById } from "../data/destinations";
import { diffInDays, todayISO } from "./formatDate";

export const CHILD_FACTOR = 0.5;
export const MISC_RATE = 0.05;

export const TRIP_STATUS = {
  upcoming: "upcoming",
  ongoing: "ongoing",
  completed: "completed",
};

// ---------- Travellers ----------

export const getHeadcount = (trip) =>
  (trip?.travelers?.adults || 0) + (trip?.travelers?.children || 0);

export const getPayingUnits = (trip) =>
  (trip?.travelers?.adults || 0) +
  (trip?.travelers?.children || 0) * CHILD_FACTOR;

// ---------- Per-day helpers (per person) ----------

export function getDayActivities(day) {
  return ACTIVITY_SLOTS.flatMap((slot) => day?.slots?.[slot.id] || []);
}

export const getDayActivityCost = (day) =>
  getDayActivities(day).reduce((sum, item) => sum + (item.costPerPerson || 0), 0);

// ---------- Whole-trip costs ----------

/**
 * Returns every figure the UI needs, rounded to whole rupees:
 * { transport, accommodation, food, activities, misc, total,
 *   perPerson, remaining, overBy, isOverBudget, usedPercent,
 *   headcount, payingUnits }
 */
export function getTripCosts(trip) {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const units = getPayingUnits(trip);
  const headcount = getHeadcount(trip);

  const perPerson = (pick) =>
    days.reduce((sum, day) => sum + (pick(day) || 0), 0);

  const transport = Math.round(
    perPerson((day) => day.transport?.costPerPerson) * units
  );
  const accommodation = Math.round(
    perPerson((day) => day.accommodation?.costPerPerson) * units
  );
  const food = Math.round(perPerson((day) => day.food?.costPerPerson) * units);
  const activities = Math.round(perPerson(getDayActivityCost) * units);

  const subtotal = transport + accommodation + food + activities;
  const misc = Math.round(subtotal * MISC_RATE);
  const total = subtotal + misc;

  const budget = trip?.budget?.total || 0;
  const remaining = budget - total;

  return {
    transport,
    accommodation,
    food,
    activities,
    misc,
    total,
    perPerson: headcount > 0 ? Math.round(total / headcount) : 0,
    remaining,
    overBy: remaining < 0 ? Math.abs(remaining) : 0,
    isOverBudget: remaining < 0,
    usedPercent: budget > 0 ? Math.round((total / budget) * 100) : 0,
    headcount,
    payingUnits: units,
  };
}

// ---------- Dates and status ----------

/** Inclusive number of days: 12 Nov to 15 Nov = 4 days. */
export const getDurationDays = (departureDate, returnDate) =>
  Math.max(1, diffInDays(departureDate, returnDate) + 1);

/** Status is derived from the dates, so it never goes stale. */
export function getTripStatus(trip, today = todayISO()) {
  if (!trip?.departureDate || !trip?.returnDate) return TRIP_STATUS.upcoming;
  if (today < trip.departureDate) return TRIP_STATUS.upcoming;
  if (today > trip.returnDate) return TRIP_STATUS.completed;
  return TRIP_STATUS.ongoing;
}

// ---------- Display helpers ----------

/** "Pokhara" or "Kathmandu, Pokhara" */
export function getTripDestinationNames(trip) {
  return (trip?.destinationIds || [])
    .map((id) => getDestinationById(id)?.name)
    .filter(Boolean)
    .join(", ");
}

export const getActivityCount = (trip) =>
  (trip?.days || []).reduce((sum, day) => sum + getDayActivities(day).length, 0);

/**
 * Cost of ONE day for the whole group, in whole rupees:
 * { transport, accommodation, food, activities, total }
 *
 * The 5% miscellaneous buffer is not spread over days, so the day totals
 * add up to the trip subtotal (within a few rupees of rounding), not to the
 * final total.
 */
export function getDayCosts(trip, day) {
  const units = getPayingUnits(trip);

  const transport = Math.round((day?.transport?.costPerPerson || 0) * units);
  const accommodation = Math.round((day?.accommodation?.costPerPerson || 0) * units);
  const food = Math.round((day?.food?.costPerPerson || 0) * units);
  const activities = Math.round(getDayActivityCost(day) * units);

  return {
    transport,
    accommodation,
    food,
    activities,
    total: transport + accommodation + food + activities,
  };
}