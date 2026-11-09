import { useCallback, useEffect, useRef, useState } from "react";

import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";
import useNotifications from "./useNotifications";
import useTrips from "./useTrips";
import { tripPath } from "../data/dashboardData";
import { STORAGE_KEYS } from "../data/demoUsers";
import { getDestinationById } from "../data/destinations";
import { DEFAULT_PREFERENCES } from "../data/tripOptions";
import { generateTrip } from "../utils/tripGenerator";
import { DESCRIPTION_MAX, STEP_VALIDATORS } from "../utils/tripValidation";

const LAST_STEP = STEP_VALIDATORS.length - 1;
const PREFERENCE_KEYS = ["accommodation", "transport", "intensity", "pace", "special"];
const DATE_KEYS = ["destinationIds", "departureDate", "returnDate"];

function createDefaultValues() {
  return {
    startingLocation: "",
    destinationIds: [],
    departureDate: "",
    returnDate: "",
    adults: 2,
    children: 0,
    budgetTotal: "",
    budgetCategory: "standard",
    interests: [],
    preferences: { ...DEFAULT_PREFERENCES },
    description: "",
    notes: "",
  };
}

// A saved draft can be old or hand-edited. Fill gaps with defaults and
// reject values of the wrong type so the wizard never starts in a broken state.
function sanitizeValues(raw) {
  const base = createDefaultValues();
  if (!raw || typeof raw !== "object") return base;

  return {
    ...base,
    ...raw,
    destinationIds: Array.isArray(raw.destinationIds)
      ? raw.destinationIds.filter((id) => getDestinationById(id))
      : [],
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    preferences: {
      ...base.preferences,
      ...(raw.preferences && typeof raw.preferences === "object" ? raw.preferences : {}),
    },
  };
}

// Where the wizard starts:
//  1. URL parameters (?q= from the home-page box, ?destination= from a card)
//     start a fresh form and ignore any old draft
//  2. otherwise a saved draft is restored
//  3. otherwise an empty form
function computeInitialState(draft, params) {
  if (params.q || params.destination) {
    const values = createDefaultValues();

    if (params.destination && getDestinationById(params.destination)) {
      values.destinationIds = [params.destination];
    }
    if (params.q) {
      values.description = params.q.trim().slice(0, DESCRIPTION_MAX);
    }

    return {
      values,
      step: 0,
      restored: false,
      prefilledFromSearch: Boolean(values.description),
    };
  }

  if (draft && draft.values) {
    const step = Number.isInteger(draft.step)
      ? Math.min(Math.max(draft.step, 0), LAST_STEP)
      : 0;
    return {
      values: sanitizeValues(draft.values),
      step,
      restored: true,
      prefilledFromSearch: false,
    };
  }

  return {
    values: createDefaultValues(),
    step: 0,
    restored: false,
    prefilledFromSearch: false,
  };
}

/**
 * State and actions of the trip wizard.
 *
 * params  { q, destination }: values read from the URL by the page
 *
 * Returns
 *  values, errors, stepIndex, isLastStep
 *  restored             true while the "draft restored" notice should show
 *  prefilledFromSearch  true while the description came from the home search
 *  returnToReview       true after "Edit" on the review screen: Next then
 *                       goes straight back to the review
 *  attempt              counter that increases on every failed validation,
 *                       so the UI can move focus to the first problem
 *  submitting, submitError
 *  onChange(changes)    merges changes into the form and clears their errors
 *  next()               validates the current step, then moves on
 *  back()
 *  goToStep(index, { fromReview })
 *  startOver()          discards the draft and resets the form
 *  submit()             validates every step, generates the trip and saves
 *                       it. Returns { ok, trip } or { ok: false, reason }
 *
 * The draft (values + step) is saved to localStorage as the user types and
 * removed when the trip is created, so an unfinished plan survives a refresh.
 */
export default function useTripForm(params = {}) {
  const { user } = useAuth();
  const { addTrip } = useTrips();
  const { addNotification } = useNotifications();

  const [draft, setDraft, clearDraft] = useLocalStorage(
    `${STORAGE_KEYS.tripDraft}.${user ? user.id : "guest"}`,
    null
  );

  const [initial] = useState(() => computeInitialState(draft, params));

  const [values, setValues] = useState(initial.values);
  const [stepIndex, setStepIndex] = useState(initial.step);
  const [errors, setErrors] = useState({});
  const [restored, setRestored] = useState(initial.restored);
  const [prefilledFromSearch, setPrefilledFromSearch] = useState(
    initial.prefilledFromSearch
  );
  const [returnToReview, setReturnToReview] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // The draft is written only after the user has actually done something,
  // so merely opening the page never creates one.
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) return;
    setDraft({ values, step: stepIndex });
  }, [values, stepIndex, setDraft]);

  const onChange = useCallback((changes) => {
    dirtyRef.current = true;
    setRestored(false);
    setValues((previous) => ({ ...previous, ...changes }));

    setErrors((previous) => {
      const next = { ...previous };
      Object.keys(changes).forEach((key) => delete next[key]);
      if ("preferences" in changes) PREFERENCE_KEYS.forEach((key) => delete next[key]);
      // The return-date message depends on the destinations and both dates.
      if (DATE_KEYS.some((key) => key in changes)) delete next.returnDate;
      return next;
    });

    if ("description" in changes) setPrefilledFromSearch(false);
  }, []);

  const next = useCallback(() => {
    const stepErrors = STEP_VALIDATORS[stepIndex](values);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      setAttempt((count) => count + 1);
      return false;
    }

    dirtyRef.current = true;
    if (returnToReview) {
      setReturnToReview(false);
      setStepIndex(LAST_STEP);
    } else {
      setStepIndex((index) => Math.min(index + 1, LAST_STEP));
    }
    return true;
  }, [stepIndex, values, returnToReview]);

  const back = useCallback(() => {
    setErrors({});
    dirtyRef.current = true;

    if (returnToReview) {
      setReturnToReview(false);
      setStepIndex(LAST_STEP);
      return;
    }
    setStepIndex((index) => Math.max(index - 1, 0));
  }, [returnToReview]);

  const goToStep = useCallback((index, { fromReview = false } = {}) => {
    if (index < 0 || index > LAST_STEP) return;
    setErrors({});
    dirtyRef.current = true;
    setReturnToReview(fromReview);
    setStepIndex(index);
  }, []);

  const startOver = useCallback(() => {
    clearDraft();
    dirtyRef.current = false;
    setValues(createDefaultValues());
    setStepIndex(0);
    setErrors({});
    setRestored(false);
    setPrefilledFromSearch(false);
    setReturnToReview(false);
  }, [clearDraft]);

  const submit = useCallback(() => {
    if (submitting) return { ok: false, reason: "busy" };
    setSubmitError("");

    // Validate every step again. A draft or an "Edit" jump could have left an
    // earlier step invalid, and the review screen must never save bad data.
    for (let index = 0; index < STEP_VALIDATORS.length; index += 1) {
      const stepErrors = STEP_VALIDATORS[index](values);

      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStepIndex(index);
        setReturnToReview(index !== LAST_STEP);
        setAttempt((count) => count + 1);
        return { ok: false, reason: "invalid", step: index };
      }
    }

    setSubmitting(true);

    try {
      const trip = addTrip(generateTrip(values));
      if (!trip) throw new Error("You need to be signed in to create a trip.");

      addNotification({
        type: "trip",
        title: `Itinerary ready: ${trip.title}`,
        message:
          "Review the day-by-day plan and the cost breakdown before you travel.",
        link: tripPath(trip.id),
      });

      clearDraft();
      dirtyRef.current = false;

      // `submitting` stays true: the page navigates away right after this.
      return { ok: true, trip };
    } catch (error) {
      console.error("TripSathi trip creation error:", error);
      setSubmitError(
        error.message || "Something went wrong while creating your itinerary."
      );
      setSubmitting(false);
      return { ok: false, reason: "error" };
    }
  }, [submitting, values, addTrip, addNotification, clearDraft]);

  return {
    values,
    errors,
    stepIndex,
    isLastStep: stepIndex === LAST_STEP,
    restored,
    prefilledFromSearch,
    returnToReview,
    attempt,
    submitting,
    submitError,
    onChange,
    next,
    back,
    goToStep,
    startOver,
    submit,
  };
}