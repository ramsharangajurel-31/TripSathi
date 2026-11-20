// ==========================================================================
// TripSathi planner – the cost model (single source of truth)
//
// Every page and every calculation (budget breakdown, what-if, comparison,
// dashboard totals) uses these functions, so the same trip always shows the
// same numbers.
//
// COST MODEL (sample estimates)
//  - Costs are stored PER PERSON PER DAY.
//  - Adults count as 1 paying traveller, children as CHILD_FACTOR (0.5).
//  - Miscellaneous is a MISC_PERCENT (5%) buffer on all other costs. It
//    serves as the contingency allowance.
//  - Each category is rounded to whole rupees on its own, then added up.
//  - Percentages use whole-number arithmetic, so a value that is exactly
//    80.5 rounds to 81 and never to 80 because of floating-point noise.
//
// Trip shape:
//  trip.travelers: { adults, children }, trip.budget: { total }
//  trip.days[]: { transport: { label, costPerPerson },
//                 accommodation: { label, costPerPerson } | null,
//                 food: { label, costPerPerson },
//                 slots: { morning: [], afternoon: [], evening: [] } }
//  activity item: { costPerPerson, ... }
// ==========================================================================

import { TIME_SLOTS } from "../../constants.js";
import { todayISO } from "./dates.js";
import { COST_RULES } from "./options.js";

export const CHILD_FACTOR = COST_RULES.childFactor;
export const MISC_PERCENT = COST_RULES.miscPercent;

export const TRIP_STATUS = Object.freeze({
  upcoming: "upcoming",
  ongoing: "ongoing",
  completed: "completed",
});

// ---------- Travellers ----------

export const getHeadcount = (trip) =>
  (trip?.travelers?.adults || 0) + (trip?.travelers?.children || 0);

export const getPayingUnits = (trip) =>
  (trip?.travelers?.adults || 0) + (trip?.travelers?.children || 0) * CHILD_FACTOR;

// ---------- Per-day helpers ----------

export const getDayActivities = (day) => TIME_SLOTS.flatMap((slot) => day?.slots?.[slot] || []);

export const getDayActivityCost = (day) =>
  getDayActivities(day).reduce((sum, item) => sum + (item.costPerPerson || 0), 0);

export const getActivityCount = (trip) =>
  (trip?.days || []).reduce((sum, day) => sum + getDayActivities(day).length, 0);

/**
 * Cost of ONE day for the whole group, in whole rupees. The miscellaneous
 * buffer is not spread over days, so day totals add up to the trip subtotal,
 * not to the final total.
 */
export function getDayCosts(trip, day) {
  const units = getPayingUnits(trip);

  const transport = Math.round((day?.transport?.costPerPerson || 0) * units);
  const accommodation = Math.round((day?.accommodation?.costPerPerson || 0) * units);
  const food = Math.round((day?.food?.costPerPerson || 0) * units);
  const activities = Math.round(getDayActivityCost(day) * units);

  return { transport, accommodation, food, activities, total: transport + accommodation + food + activities };
}

// ---------- Whole trip ----------

/**
 * Every figure the UI needs, in whole rupees:
 * { transport, accommodation, food, activities, misc, total, perPerson,
 *   remaining, overBy, isOverBudget, usedPercent, headcount, payingUnits }
 */
export function getTripCosts(trip) {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const units = getPayingUnits(trip);
  const headcount = getHeadcount(trip);

  const sumPerPerson = (pick) => days.reduce((sum, day) => sum + (pick(day) || 0), 0);
  const scaled = (pick) => Math.round(sumPerPerson(pick) * units);

  const transport = scaled((day) => day.transport?.costPerPerson);
  const accommodation = scaled((day) => day.accommodation?.costPerPerson);
  const food = scaled((day) => day.food?.costPerPerson);
  const activities = scaled(getDayActivityCost);

  const subtotal = transport + accommodation + food + activities;
  const misc = Math.round((subtotal * MISC_PERCENT) / 100);
  const total = subtotal + misc;

  const budget = Number(trip?.budget?.total) || 0;
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
    overBy: remaining < 0 ? -remaining : 0,
    isOverBudget: remaining < 0,
    usedPercent: budget > 0 ? Math.round((total * 100) / budget) : 0,
    headcount,
    payingUnits: units,
  };
}

// ---------- Status ----------

/** Derived from the dates (Nepal time), so it never goes stale. */
export function getTripStatus(trip, today = todayISO()) {
  if (!trip?.departureDate || !trip?.returnDate) return TRIP_STATUS.upcoming;
  if (today < trip.departureDate) return TRIP_STATUS.upcoming;
  if (today > trip.returnDate) return TRIP_STATUS.completed;
  return TRIP_STATUS.ongoing;
}