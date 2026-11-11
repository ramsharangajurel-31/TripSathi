import { useCallback, useMemo } from "react";

import useLocalStorage from "./useLocalStorage";
import {
  SEED_ACTIVITIES,
  SEED_ATTRACTIONS,
  SEED_DESTINATIONS,
  createSlug,
  createUniqueId,
} from "../data/adminData";
import { STORAGE_KEYS } from "../data/demoUsers";

const asList = (value, fallback) => (Array.isArray(value) ? value : fallback);

/**
 * The admin copy of destinations, attractions and activities, with actions
 * to change them. Everything is stored in localStorage and does NOT affect
 * the traveler pages (see data/adminData.js).
 *
 *   const { destinations, attractions, activities,
 *           addDestination, updateDestination, deleteDestination,
 *           addAttraction, updateAttraction, deleteAttraction,
 *           addActivity, updateActivity, deleteActivity,
 *           countsByDestination, getDestinationName, resetData } = useAdminData();
 *
 *  add*(data)        creates the item (id set here) and returns it
 *  update*(id, data) merges `data` into the item (id can never change) and
 *                    returns the updated item, or null if it was not found
 *  delete*(id)       returns true when something was removed
 *  deleteDestination(id) also removes that destination's attractions and
 *                    activities, and returns { attractions, activities }
 *                    with how many of each were removed
 *  countsByDestination  { [destinationId]: { attractions, activities } }
 *  resetData()       restores all three lists to the original demonstration data
 *
 * The actions are synchronous because the data is local. When the backend
 * exists they become Axios calls behind this same hook.
 */
export default function useAdminData() {
  const [storedDestinations, setDestinations, clearDestinations] = useLocalStorage(
    STORAGE_KEYS.adminDestinations,
    SEED_DESTINATIONS
  );
  const [storedAttractions, setAttractions, clearAttractions] = useLocalStorage(
    STORAGE_KEYS.adminAttractions,
    SEED_ATTRACTIONS
  );
  const [storedActivities, setActivities, clearActivities] = useLocalStorage(
    STORAGE_KEYS.adminActivities,
    SEED_ACTIVITIES
  );

  // Guard against hand-edited storage holding something that is not a list.
  const destinations = useMemo(
    () => asList(storedDestinations, SEED_DESTINATIONS),
    [storedDestinations]
  );
  const attractions = useMemo(
    () => asList(storedAttractions, SEED_ATTRACTIONS),
    [storedAttractions]
  );
  const activities = useMemo(
    () => asList(storedActivities, SEED_ACTIVITIES),
    [storedActivities]
  );

  // useLocalStorage runs functional updates synchronously, so the actions
  // below can safely read what their updater produced.
  const mutate = (setter, fallback, updater) =>
    setter((previous) => updater(asList(previous, fallback)));

  // ---------- Destinations ----------

  const addDestination = useCallback(
    (data) => {
      let created = null;
      mutate(setDestinations, SEED_DESTINATIONS, (list) => {
        created = { ...data, id: createSlug(data.name, list.map((item) => item.id)) };
        return [created, ...list];
      });
      return created;
    },
    [setDestinations]
  );

  const updateDestination = useCallback(
    (id, data) => {
      let updated = null;
      mutate(setDestinations, SEED_DESTINATIONS, (list) =>
        list.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, ...data, id: item.id };
          return updated;
        })
      );
      return updated;
    },
    [setDestinations]
  );

  const deleteDestination = useCallback(
    (id) => {
      const removed = { attractions: 0, activities: 0 };

      mutate(setDestinations, SEED_DESTINATIONS, (list) =>
        list.filter((item) => item.id !== id)
      );
      mutate(setAttractions, SEED_ATTRACTIONS, (list) => {
        const next = list.filter((item) => item.destinationId !== id);
        removed.attractions = list.length - next.length;
        return next;
      });
      mutate(setActivities, SEED_ACTIVITIES, (list) => {
        const next = list.filter((item) => item.destinationId !== id);
        removed.activities = list.length - next.length;
        return next;
      });

      return removed;
    },
    [setDestinations, setAttractions, setActivities]
  );

  // ---------- Attractions ----------

  const addAttraction = useCallback(
    (data) => {
      const created = { ...data, id: createUniqueId("attr") };
      mutate(setAttractions, SEED_ATTRACTIONS, (list) => [created, ...list]);
      return created;
    },
    [setAttractions]
  );

  const updateAttraction = useCallback(
    (id, data) => {
      let updated = null;
      mutate(setAttractions, SEED_ATTRACTIONS, (list) =>
        list.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, ...data, id: item.id };
          return updated;
        })
      );
      return updated;
    },
    [setAttractions]
  );

  const deleteAttraction = useCallback(
    (id) => {
      let removed = false;
      mutate(setAttractions, SEED_ATTRACTIONS, (list) =>
        list.filter((item) => {
          if (item.id === id) {
            removed = true;
            return false;
          }
          return true;
        })
      );
      return removed;
    },
    [setAttractions]
  );

  // ---------- Activities ----------

  const addActivity = useCallback(
    (data) => {
      const created = { ...data, id: createUniqueId("act") };
      mutate(setActivities, SEED_ACTIVITIES, (list) => [created, ...list]);
      return created;
    },
    [setActivities]
  );

  const updateActivity = useCallback(
    (id, data) => {
      let updated = null;
      mutate(setActivities, SEED_ACTIVITIES, (list) =>
        list.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, ...data, id: item.id };
          return updated;
        })
      );
      return updated;
    },
    [setActivities]
  );

  const deleteActivity = useCallback(
    (id) => {
      let removed = false;
      mutate(setActivities, SEED_ACTIVITIES, (list) =>
        list.filter((item) => {
          if (item.id === id) {
            removed = true;
            return false;
          }
          return true;
        })
      );
      return removed;
    },
    [setActivities]
  );

  // ---------- Helpers ----------

  const countsByDestination = useMemo(() => {
    const counts = {};
    destinations.forEach((item) => {
      counts[item.id] = { attractions: 0, activities: 0 };
    });
    attractions.forEach((item) => {
      if (counts[item.destinationId]) counts[item.destinationId].attractions += 1;
    });
    activities.forEach((item) => {
      if (counts[item.destinationId]) counts[item.destinationId].activities += 1;
    });
    return counts;
  }, [destinations, attractions, activities]);

  const getDestinationName = useCallback(
    (id) => destinations.find((item) => item.id === id)?.name || "Unknown destination",
    [destinations]
  );

  const resetData = useCallback(() => {
    clearDestinations();
    clearAttractions();
    clearActivities();
  }, [clearDestinations, clearAttractions, clearActivities]);

  return {
    destinations,
    attractions,
    activities,
    addDestination,
    updateDestination,
    deleteDestination,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    addActivity,
    updateActivity,
    deleteActivity,
    countsByDestination,
    getDestinationName,
    resetData,
  };
}