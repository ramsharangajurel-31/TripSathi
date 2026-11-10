// ==========================================================================
// TripSathi – Trip editing (pure functions)
//
// Every function takes a trip and returns a NEW trip, never changing the
// original. The page applies them with useTrips().updateTrip(id, (trip) =>
// fn(trip, ...)), so each edit works on the latest saved version.
//
// Every edit stamps `editedAt`. The results page uses it to say that the
// automatic notes were written when the plan was first created.
// ==========================================================================

import { ACTIVITY_SLOTS } from "../data/activities";
import { addDays } from "./formatDate";
import { getDurationDays } from "./tripUtils";

const touch = (trip) => ({ ...trip, editedAt: new Date().toISOString() });

const createItemId = (dayId, slot) =>
  `${dayId}-${slot}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const cleanFields = (data) => ({
  name: data.name.trim(),
  category: data.category,
  durationHours: Number(data.durationHours),
  costPerPerson: Number(data.costPerPerson),
  notes: (data.notes || "").trim(),
});

/** Finds an activity: { day, slot, index, item } or null. */
export function findItem(trip, itemId) {
  for (const day of trip.days || []) {
    for (const { id: slot } of ACTIVITY_SLOTS) {
      const list = day.slots?.[slot] || [];
      const index = list.findIndex((item) => item.id === itemId);
      if (index !== -1) return { day, slot, index, item: list[index] };
    }
  }
  return null;
}

function stripItem(trip, itemId) {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      slots: Object.fromEntries(
        ACTIVITY_SLOTS.map(({ id }) => [
          id,
          (day.slots?.[id] || []).filter((item) => item.id !== itemId),
        ])
      ),
    })),
  };
}

function placeItem(trip, dayId, slot, item) {
  return {
    ...trip,
    days: trip.days.map((day) =>
      day.id !== dayId
        ? day
        : { ...day, slots: { ...day.slots, [slot]: [...(day.slots?.[slot] || []), item] } }
    ),
  };
}

/** Adds an activity at the end of a time slot. */
export function addActivity(trip, dayId, slot, data) {
  const item = {
    id: createItemId(dayId, slot),
    activityId: data.activityId || null, // null = a custom activity
    ...cleanFields(data),
  };
  return touch(placeItem(trip, dayId, slot, item));
}

/**
 * Updates an activity. When `location` ({ dayId, slot }) differs from where
 * it is now, the activity moves to the end of that slot.
 */
export function updateActivity(trip, itemId, data, location) {
  const found = findItem(trip, itemId);
  if (!found) return trip;

  const updated = { ...found.item, ...cleanFields(data) };
  const stays = found.day.id === location.dayId && found.slot === location.slot;

  if (!stays) {
    return touch(placeItem(stripItem(trip, itemId), location.dayId, location.slot, updated));
  }

  return touch({
    ...trip,
    days: trip.days.map((day) =>
      day.id !== found.day.id
        ? day
        : {
            ...day,
            slots: {
              ...day.slots,
              [found.slot]: day.slots[found.slot].map((item) =>
                item.id === itemId ? updated : item
              ),
            },
          }
    ),
  });
}

/** Moves an activity one place earlier (-1) or later (+1) in its time slot. */
export function moveActivity(trip, itemId, direction) {
  const found = findItem(trip, itemId);
  if (!found) return trip;

  const list = [...found.day.slots[found.slot]];
  const target = found.index + direction;
  if (target < 0 || target >= list.length) return trip;

  [list[found.index], list[target]] = [list[target], list[found.index]];

  return touch({
    ...trip,
    days: trip.days.map((day) =>
      day.id !== found.day.id
        ? day
        : { ...day, slots: { ...day.slots, [found.slot]: list } }
    ),
  });
}

export const removeActivity = (trip, itemId) => touch(stripItem(trip, itemId));

export const updateDayNote = (trip, dayId, note) =>
  touch({
    ...trip,
    days: trip.days.map((day) =>
      day.id === dayId ? { ...day, notes: note.trim() } : day
    ),
  });

/**
 * Updates trip details. A new departure date moves the whole trip: the
 * length stays the same and the return date follows.
 */
export function updateTripInfo(trip, values) {
  const length = getDurationDays(trip.departureDate, trip.returnDate);

  return touch({
    ...trip,
    title: values.title.trim(),
    departureDate: values.departureDate,
    returnDate: addDays(values.departureDate, length - 1),
    budget: { ...trip.budget, total: Number(values.budgetTotal) },
    travelers: {
      adults: Number(values.adults),
      children: Number(values.children),
    },
    notes: (values.notes || "").trim(),
  });
}