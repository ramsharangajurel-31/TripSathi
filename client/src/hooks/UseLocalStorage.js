import { useCallback, useEffect, useRef, useState } from "react";

// Custom event used to keep several components in the SAME tab in sync
// (the browser's own "storage" event only fires in OTHER tabs).
const SYNC_EVENT = "tripsathi:local-storage";

// ---------- Plain helpers (usable outside React components) ----------

/** Reads and parses a JSON value. Returns `fallback` if missing or corrupted. */
export function readStorage(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    // Corrupted JSON, blocked storage (private mode) or no window: fall back.
    return fallback;
  }
}

/** Stores a value as JSON. Returns true on success, false if it failed. */
export function writeStorage(key, value, source = null) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENT, { detail: { key, source } })
    );
    return true;
  } catch (error) {
    // Storage full or blocked. The app keeps working in memory.
    console.warn(`TripSathi: could not save "${key}" to localStorage.`, error);
    return false;
  }
}

export function removeStorage(key, source = null) {
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENT, { detail: { key, source } })
    );
  } catch (error) {
    console.warn(`TripSathi: could not remove "${key}" from localStorage.`, error);
  }
}

// ---------- Hook ----------

/**
 * useState that persists to localStorage.
 *
 *   const [trips, setTrips, clearTrips] = useLocalStorage("tripsathi.trips", []);
 *
 *  - Same signature as useState, including functional updates:
 *      setTrips((current) => [...current, newTrip]);
 *  - Corrupted or missing data falls back to `initialValue`
 *  - Stays in sync across components using the same key, and across tabs
 *  - Never throws if storage is full or unavailable
 *
 * Keep `key` constant for the lifetime of the component.
 */
export default function useLocalStorage(key, initialValue) {
  const initialRef = useRef(initialValue);
  const sourceRef = useRef(Symbol("useLocalStorage"));

  const [value, setValueState] = useState(() => readStorage(key, initialValue));

  // Latest value, so functional updates never use a stale copy.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const setValue = useCallback(
    (next) => {
      const resolved =
        typeof next === "function" ? next(valueRef.current) : next;
      valueRef.current = resolved;
      setValueState(resolved);
      writeStorage(key, resolved, sourceRef.current);
    },
    [key]
  );

  const remove = useCallback(() => {
    valueRef.current = initialRef.current;
    setValueState(initialRef.current);
    removeStorage(key, sourceRef.current);
  }, [key]);

  // Pick up changes made by other tabs or by other hook instances.
  useEffect(() => {
    const sync = () => {
      const next = readStorage(key, initialRef.current);
      valueRef.current = next;
      setValueState(next);
    };

    const handleStorage = (event) => {
      // event.key is null when the whole storage was cleared
      if (event.key === key || event.key === null) sync();
    };

    const handleCustom = (event) => {
      const { key: changedKey, source } = event.detail || {};
      if (changedKey === key && source !== sourceRef.current) sync();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SYNC_EVENT, handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SYNC_EVENT, handleCustom);
    };
  }, [key]);

  return [value, setValue, remove];
}