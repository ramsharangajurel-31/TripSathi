import { useMemo } from "react";
import { FiAlertCircle, FiCheck, FiInfo } from "react-icons/fi";

import Input from "../ui/Input";
import {
  ACCOMMODATION_OPTIONS,
  FLIGHT_ROUTES,
  INTENSITY_OPTIONS,
  MUST_FLY_DESTINATIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
} from "../../data/tripOptions";
import { getDestinationById } from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  formatTravelTime,
  getStartDestinationId,
  getTripRoute,
  orderDestinations,
} from "../../utils/routeUtils";
import { NOTES_MAX, SPECIAL_REQUIREMENTS_MAX } from "../../utils/tripValidation";

// ---------- Helper texts, built from the data so nothing is hard-coded ----------

function describeStayCost(factor) {
  if (factor === 1) return "Standard price for your budget level";
  if (factor < 1) return `About ${Math.round((1 - factor) * 100)}% below the usual stay cost`;
  return `About ${Math.round((factor - 1) * 100)}% above the usual stay cost`;
}

const CHEAPEST_FLIGHT = Math.min(
  ...Object.values(FLIGHT_ROUTES).map((route) => route.fare)
);

function describeTransportCost(option) {
  if (option.id === "flight") {
    return `Flights from ${formatCurrency(CHEAPEST_FLIGHT)} one way, on routes that have them`;
  }
  return `About ${formatCurrency(option.costPerKm * 100)} per person per 100 km`;
}

function describeIntensity(option) {
  const included = INTENSITY_OPTIONS.filter((item) => item.rank <= option.rank).map(
    (item) => item.label.toLowerCase()
  );
  return `Includes ${included.join(", ")} activities`;
}

function describePace(option) {
  return `Up to ${option.activitiesPerDay} ${
    option.activitiesPerDay === 1 ? "activity" : "activities"
  } a day`;
}

/**
 * One group of radio cards with a legend and an error message.
 * Props: legend, hint, name, options [{ id, label, description, meta }],
 *        value, onSelect(id), error
 */
function RadioGroup({ legend, hint, name, options, value, onSelect, error }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset__legend">
        {legend}
        <span className="form-label__required" aria-hidden="true">
          *
        </span>
      </legend>
      {hint && <p className="wizard__section-text">{hint}</p>}

      <div className="option-grid option-grid--wide option-grid--list">
        {options.map((option) => (
          <label key={option.id} className="option-card">
            <input
              type="radio"
              className="option-card__input"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onSelect(option.id)}
            />
            <span className="option-card__body">
              <span className="option-card__check" aria-hidden="true">
                <FiCheck size={12} />
              </span>
              <span className="option-card__title">{option.label}</span>
              <span className="option-card__text">{option.description}</span>
              <span className="option-card__meta">{option.meta}</span>
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className="form-error fieldset__error" role="alert">
          <FiAlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Wizard step 4: accommodation, transport, activity intensity, travel pace,
 * special requirements and optional notes.
 *
 * Props
 *  values    the whole wizard form (preferences live in values.preferences)
 *  errors    error messages keyed by field name
 *  onChange  function(changes): merges an object into the form values
 */
export default function PreferencesStep({ values, errors, onChange }) {
  const preferences = values.preferences;

  const setPreference = (key) => (id) =>
    onChange({ preferences: { ...preferences, [key]: id } });

  // Estimated travel between cities for the chosen transport option.
  const route = useMemo(() => {
    if (values.destinationIds.length === 0) return null;

    const startId = getStartDestinationId(values.startingLocation);
    const ordered = orderDestinations(startId, values.destinationIds, preferences.transport);
    return getTripRoute(startId, ordered, preferences.transport);
  }, [values.startingLocation, values.destinationIds, preferences.transport]);

  const routeHasFlight = route
    ? route.legs.some((leg) => leg.segments.some((segment) => segment.mode === "flight"))
    : false;

  const flyOnlyDestinations = values.destinationIds
    .filter((id) => MUST_FLY_DESTINATIONS.includes(id))
    .map((id) => getDestinationById(id)?.name)
    .filter(Boolean);

  const flightRequestedButUnavailable =
    preferences.transport === "flight" && route && route.legs.length > 0 && !routeHasFlight;

  return (
    <section aria-labelledby="wizard-step-title">
      <div className="wizard__header">
        <h2 id="wizard-step-title" className="wizard__title" tabIndex={-1}>
          Your travel preferences
        </h2>
        <p className="wizard__text">
          These choices shape the cost estimate and how busy each day is.
        </p>
      </div>

      <div className="wizard__section">
        <RadioGroup
          legend="Accommodation"
          hint="Changes the nightly stay cost in your estimate."
          name="accommodation"
          options={ACCOMMODATION_OPTIONS.map((option) => ({
            ...option,
            meta: describeStayCost(option.costFactor),
          }))}
          value={preferences.accommodation}
          onSelect={setPreference("accommodation")}
          error={errors.accommodation}
        />
      </div>

      <div className="wizard__section">
        <RadioGroup
          legend="Transport between cities"
          hint="Local taxis and rickshaws are always included separately."
          name="transport"
          options={TRANSPORT_OPTIONS.map((option) => ({
            ...option,
            meta: describeTransportCost(option),
          }))}
          value={preferences.transport}
          onSelect={setPreference("transport")}
          error={errors.transport}
        />

        {route && route.legs.length > 0 && route.totalCostPerPerson > 0 && (
          <p className="wizard__note" aria-live="polite">
            Estimated travel between cities for the round trip: about{" "}
            <strong>{formatCurrency(route.totalCostPerPerson)}</strong> per adult and{" "}
            {formatTravelTime(route.totalHours)} on the road or in the air.
          </p>
        )}

        {flightRequestedButUnavailable && (
          <div className="alert alert--info" role="status" style={{ marginTop: "1rem" }}>
            <FiInfo className="alert__icon" size={18} aria-hidden="true" />
            <span>
              There are no domestic flights on your route in our sample data, so a
              tourist bus will be used for these legs.
            </span>
          </div>
        )}

        {flyOnlyDestinations.length > 0 && (
          <div className="alert alert--info" role="status" style={{ marginTop: "1rem" }}>
            <FiInfo className="alert__icon" size={18} aria-hidden="true" />
            <span>
              {flyOnlyDestinations.join(", ")} {flyOnlyDestinations.length === 1 ? "is" : "are"}{" "}
              usually reached by air, so a flight is used whichever option you
              choose.
            </span>
          </div>
        )}
      </div>

      <div className="wizard__section">
        <RadioGroup
          legend="Activity intensity"
          hint="Activities harder than this level are left out."
          name="intensity"
          options={INTENSITY_OPTIONS.map((option) => ({
            ...option,
            meta: describeIntensity(option),
          }))}
          value={preferences.intensity}
          onSelect={setPreference("intensity")}
          error={errors.intensity}
        />
      </div>

      <div className="wizard__section">
        <RadioGroup
          legend="Travel pace"
          hint="How many activities to plan on a normal day."
          name="pace"
          options={PACE_OPTIONS.map((option) => ({
            ...option,
            meta: describePace(option),
          }))}
          value={preferences.pace}
          onSelect={setPreference("pace")}
          error={errors.pace}
        />
        <p className="wizard__note">
          Days spent travelling between cities always have fewer activities.
        </p>
      </div>

      <div className="wizard__section">
        <h3 className="wizard__section-title">Anything else?</h3>

        <div className="flex flex-col gap-4">
          <Input
            as="textarea"
            rows={3}
            label="Special requirements"
            name="special"
            maxLength={SPECIAL_REQUIREMENTS_MAX}
            placeholder="e.g. travelling with young children, wheelchair access, vegetarian food"
            hint={`${(preferences.special || "").length}/${SPECIAL_REQUIREMENTS_MAX} characters. Optional.`}
            value={preferences.special || ""}
            onChange={(event) =>
              onChange({ preferences: { ...preferences, special: event.target.value } })
            }
            error={errors.special}
          />

          <Input
            as="textarea"
            rows={3}
            label="Additional notes"
            name="notes"
            maxLength={NOTES_MAX}
            placeholder="Anything you want to remember about this trip"
            hint={`${(values.notes || "").length}/${NOTES_MAX} characters. Optional.`}
            value={values.notes || ""}
            onChange={(event) => onChange({ notes: event.target.value })}
            error={errors.notes}
          />
        </div>

        <p className="wizard__note">
          These are saved with your trip. They are not interpreted automatically
          yet, so check that your itinerary suits them.
        </p>
      </div>
    </section>
  );
}