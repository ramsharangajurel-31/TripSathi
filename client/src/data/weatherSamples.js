// ==========================================================================
// TripSathi – Sample weather (seasonal pattern, NOT a forecast)
//
// Estimates typical conditions for a destination in a given month, so the
// results page can show weather cards without a weather service. It is a
// rough model for demonstration:
//   1. A typical monthly temperature range for Kathmandu (below)
//   2. Adjusted for the destination's altitude (about 6.5 °C per 1,000 m)
//   3. A simple monsoon / dry-season summary (rain-shadow areas are drier)
//
// It does NOT know the actual weather on your dates. The UI must always show
// WEATHER_DISCLAIMER next to it. The real weather service is connected in the
// backend phase. Verify any figure you quote against official sources.
// ==========================================================================

import { getDestinationById } from "./destinations";
import { addDays, parseDate } from "../utils/formatDate";

export const WEATHER_DISCLAIMER =
  "Sample seasonal information for demonstration, not a live forecast. Check a current forecast before you travel.";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Typical daily minimum / maximum in °C for Kathmandu (about 1,400 m).
const KATHMANDU_MONTHLY = [
  { min: 2, max: 18 },  // Jan
  { min: 4, max: 20 },  // Feb
  { min: 8, max: 24 },  // Mar
  { min: 11, max: 27 }, // Apr
  { min: 16, max: 28 }, // May
  { min: 19, max: 28 }, // Jun
  { min: 20, max: 28 }, // Jul
  { min: 20, max: 28 }, // Aug
  { min: 18, max: 27 }, // Sep
  { min: 13, max: 26 }, // Oct
  { min: 7, max: 22 },  // Nov
  { min: 3, max: 19 },  // Dec
];

const REFERENCE_ALTITUDE_M = 1400;
const COOLING_PER_METRE = 6.5 / 1000;
const MONSOON_MONTHS = [5, 6, 7, 8]; // June to September (zero-based)
const RAIN_SHADOW_DESTINATIONS = ["mustang"]; // dry year-round
const HIGH_ALTITUDE_M = 2500;

function describeConditions(destination, monthIndex, minC) {
  const isMonsoon = MONSOON_MONTHS.includes(monthIndex);
  const isRainShadow = RAIN_SHADOW_DESTINATIONS.includes(destination.id);

  if (isRainShadow) {
    return {
      summary: "Mostly dry and sunny, often windy in the afternoon",
      rain: "Low",
      advice: "Pack a windproof layer and sun protection.",
    };
  }

  if (isMonsoon) {
    return {
      summary: "Monsoon season: warm and humid with frequent rain",
      rain: "High",
      advice:
        "Carry rain gear. Mountain views are often hidden by cloud, and roads can be delayed.",
    };
  }

  const cold = minC <= 3;
  const snowPossible = destination.altitudeM >= HIGH_ALTITUDE_M && monthIndex <= 2;

  return {
    summary: snowPossible
      ? "Dry and cold, with snow possible at higher altitude"
      : cold
        ? "Dry, clear and cold, especially in the mornings and evenings"
        : "Mostly dry with generally clear skies",
    rain: "Low",
    advice: cold
      ? "Bring warm layers for mornings and evenings."
      : "Light layers work well. Mornings usually give the clearest views.",
  };
}

/**
 * Sample conditions for one destination in the month of `isoDate`.
 * Returns { month, minC, maxC, summary, rain, advice } or null if the
 * destination or date is invalid.
 */
export function getSampleWeather(destinationId, isoDate) {
  const destination = getDestinationById(destinationId);
  const date = parseDate(isoDate);
  if (!destination || !date) return null;

  const monthIndex = date.getMonth();
  const base = KATHMANDU_MONTHLY[monthIndex];
  const offset = (REFERENCE_ALTITUDE_M - destination.altitudeM) * COOLING_PER_METRE;

  const minC = Math.round(base.min + offset);
  const maxC = Math.round(base.max + offset);

  return {
    month: MONTH_NAMES[monthIndex],
    minC,
    maxC,
    ...describeConditions(destination, monthIndex, minC),
  };
}

/**
 * One weather card per destination of a trip, for the dates the traveller
 * will actually be there. Returns
 * [{ destinationId, name, altitudeM, startDate, endDate, ...weather }]
 */
export function getTripWeather(trip) {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const cards = [];

  days.forEach((day) => {
    const date = addDays(trip.departureDate, day.dayNumber - 1);
    const last = cards[cards.length - 1];

    if (last && last.destinationId === day.destinationId) {
      last.endDate = date;
      return;
    }

    const destination = getDestinationById(day.destinationId);
    const weather = getSampleWeather(day.destinationId, date);
    if (!destination || !weather) return;

    cards.push({
      destinationId: day.destinationId,
      name: destination.name,
      altitudeM: destination.altitudeM,
      startDate: date,
      endDate: date,
      ...weather,
    });
  });

  return cards;
}