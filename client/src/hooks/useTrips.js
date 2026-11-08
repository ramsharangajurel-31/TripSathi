import { useCallback, useMemo } from "react";

import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";
import SAMPLE_TRIPS from "../data/sampleTrips";
import { STORAGE_KEYS } from "../data/demoUsers";

const createTripId = () =>
  `trip-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * The signed-in user's trips, with actions to change them.
 *
 *   const { trips, savedTrips, addTrip, updateTrip, deleteTrip,
 *           toggleSaved, getTripById } = useTrips();
 *
 *  trips          this user's trips, newest first
 *  savedTrips     the subset the user has saved
 *  addTrip(data)  creates a trip (id, owner and createdAt are set here) and
 *                 returns it, or null if nobody is signed in
 *  updateTrip(id, changes)
 *                 `changes` is an object merged into the trip, or a function
 *                 (trip) => newTrip. Returns the updated trip, or null if it
 *                 was not found. The id and owner can never be changed.
 *  toggleSaved(id)  flips `saved`; returns the updated trip or null
 *  deleteTrip(id)   returns true when a trip was removed
 *  getTripById(id)  returns the trip or undefined
 *
 * Storage: every user's trips live in one localStorage list
 * ("tripsathi.trips"); each action touches only the current user's trips.
 * The list starts with the sample trips for the demo account. Trips of
 * other accounts (including the admin's view in Phase 7) stay untouched.
 *
 * The actions are synchronous because the data is local. When the backend
 * exists they become Axios calls behind this same hook.
 */
export default function useTrips() {
  const { user } = useAuth();
  const userId = user ? user.id : null;

  const [stored, setStored] = useLocalStorage(STORAGE_KEYS.trips, SAMPLE_TRIPS);

  const allTrips = useMemo(
    () => (Array.isArray(stored) ? stored : SAMPLE_TRIPS),
    [stored]
  );

  const trips = useMemo(
    () =>
      allTrips
        .filter((trip) => trip.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [allTrips, userId]
  );

  const savedTrips = useMemo(
    () => trips.filter((trip) => trip.saved),
    [trips]
  );

  // Runs `updater` on the full list, tolerating a corrupted stored value.
  // useLocalStorage calls the updater synchronously, so the actions below
  // can safely read what the updater found.
  const mutate = useCallback(
    (updater) => {
      setStored((previous) =>
        updater(Array.isArray(previous) ? previous : SAMPLE_TRIPS)
      );
    },
    [setStored]
  );

  const addTrip = useCallback(
    (tripData) => {
      if (!userId) return null;

      const trip = {
        saved: false,
        ...tripData,
        id: createTripId(),
        userId,
        createdAt: new Date().toISOString(),
      };

      mutate((list) => [trip, ...list]);
      return trip;
    },
    [userId, mutate]
  );

  const updateTrip = useCallback(
    (tripId, changes) => {
      if (!userId) return null;

      let updated = null;

      mutate((list) =>
        list.map((trip) => {
          if (trip.id !== tripId || trip.userId !== userId) return trip;

          const next =
            typeof changes === "function"
              ? changes(trip)
              : { ...trip, ...changes };

          updated = { ...next, id: trip.id, userId: trip.userId };
          return updated;
        })
      );

      return updated;
    },
    [userId, mutate]
  );

  const toggleSaved = useCallback(
    (tripId) => updateTrip(tripId, (trip) => ({ ...trip, saved: !trip.saved })),
    [updateTrip]
  );

  const deleteTrip = useCallback(
    (tripId) => {
      if (!userId) return false;

      let removed = false;

      mutate((list) =>
        list.filter((trip) => {
          if (trip.id === tripId && trip.userId === userId) {
            removed = true;
            return false;
          }
          return true;
        })
      );

      return removed;
    },
    [userId, mutate]
  );

  const getTripById = useCallback(
    (tripId) => trips.find((trip) => trip.id === tripId),
    [trips]
  );

  return {
    trips,
    savedTrips,
    addTrip,
    updateTrip,
    toggleSaved,
    deleteTrip,
    getTripById,
  };
}