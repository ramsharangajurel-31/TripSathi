import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCamera,
  FiCheck,
  FiClock,
  FiCoffee,
  FiEye,
  FiGlobe,
  FiStar,
  FiSun,
  FiTrendingUp,
  FiWind,
  FiZap,
} from "react-icons/fi";

import activities from "../../data/activities";
import { INTERESTS, getDestinationById } from "../../data/destinations";

// Interest ids come from data/destinations.js; icons are chosen here.
const ICONS = {
  adventure: <FiZap />,
  nature: <FiSun />,
  culture: <FiGlobe />,
  historical: <FiClock />,
  food: <FiCoffee />,
  relaxation: <FiWind />,
  wildlife: <FiEye />,
  photography: <FiCamera />,
  trekking: <FiTrendingUp />,
  religious: <FiStar />,
};

/**
 * Wizard step 3: travel interests (multi-select, at least one required).
 *
 * Each card shows how many catalog activities of that kind exist in the
 * destinations chosen in step 1 (or across all destinations when none are
 * chosen yet), so the user can see what their choices lead to.
 *
 * Props
 *  values    the whole wizard form
 *  errors    error messages keyed by field name
 *  onChange  function(changes): merges an object into the form values
 */
export default function InterestsStep({ values, errors, onChange }) {
  const selected = values.interests;
  const chosenIds = values.destinationIds;

  const relevantActivities =
    chosenIds.length > 0
      ? activities.filter((activity) => chosenIds.includes(activity.destinationId))
      : activities;

  const countFor = (interestId) =>
    relevantActivities.filter((activity) => activity.category === interestId).length;

  const matchingTotal = relevantActivities.filter((activity) =>
    selected.includes(activity.category)
  ).length;

  // Destinations where none of the chosen interests has an activity. The
  // generator then falls back to general activities for that destination.
  const uncovered =
    selected.length > 0
      ? chosenIds
          .map(getDestinationById)
          .filter(Boolean)
          .filter(
            (destination) =>
              !activities.some(
                (activity) =>
                  activity.destinationId === destination.id &&
                  selected.includes(activity.category)
              )
          )
      : [];

  const toggleInterest = (id) => {
    onChange({
      interests: selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    });
  };

  return (
    <section aria-labelledby="wizard-step-title">
      <div className="wizard__header">
        <h2 id="wizard-step-title" className="wizard__title" tabIndex={-1}>
          What do you enjoy?
        </h2>
        <p className="wizard__text">
          Choose everything that appeals to you. We use this to pick the
          activities for each day.
        </p>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset__legend">
          Travel interests
          <span className="form-label__required" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="wizard__section-text">Select at least one.</p>

        <div className="option-grid">
          {INTERESTS.map((interest) => {
            const checked = selected.includes(interest.id);
            const count = countFor(interest.id);

            return (
              <label key={interest.id} className="option-card option-card--compact">
                <input
                  type="checkbox"
                  className="option-card__input"
                  name="interests"
                  value={interest.id}
                  checked={checked}
                  onChange={() => toggleInterest(interest.id)}
                />
                <span className="option-card__body">
                  <span className="option-card__check" aria-hidden="true">
                    <FiCheck size={12} />
                  </span>
                  <span className="option-card__icon" aria-hidden="true">
                    {ICONS[interest.id]}
                  </span>
                  <span className="option-card__title">{interest.label}</span>
                  <span className="option-card__text">
                    {count === 0
                      ? "None in your places"
                      : `${count} ${count === 1 ? "activity" : "activities"}`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <p className="wizard__note" aria-live="polite">
          {selected.length === 0
            ? "No interests selected yet."
            : `${selected.length} selected. ${matchingTotal} matching ${
                matchingTotal === 1 ? "activity" : "activities"
              } ${
                chosenIds.length > 0
                  ? "in your chosen destinations."
                  : "across all destinations (choose destinations in step 1 to narrow this down)."
              }`}
        </p>

        {errors.interests && (
          <p className="form-error fieldset__error" role="alert">
            <FiAlertCircle size={14} aria-hidden="true" />
            {errors.interests}
          </p>
        )}
      </fieldset>

      {uncovered.length > 0 && (
        <div className="alert alert--warning" role="status" style={{ marginTop: "1.5rem" }}>
          <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
          <span>
            {uncovered.map((destination) => destination.name).join(", ")}{" "}
            {uncovered.length === 1 ? "has" : "have"} no activities matching these
            interests, so general activities will be suggested there instead. You
            can change your interests or destinations at any time.
          </span>
        </div>
      )}
    </section>
  );
}