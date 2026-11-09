import { FiAlertCircle, FiCalendar, FiCheck, FiX } from "react-icons/fi";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import destinations, { getDestinationById } from "../../data/destinations";
import { START_LOCATIONS, TRIP_LIMITS } from "../../data/tripOptions";
import { addDays, formatDate, todayISO } from "../../utils/formatDate";
import { getMinimumTripDays, getSuggestedDays } from "../../utils/tripGenerator";
import { getDurationDays } from "../../utils/tripUtils";

const START_OPTIONS = START_LOCATIONS.map((item) => item.value);

/**
 * Wizard step 1: starting location, destinations and travel dates.
 *
 * Props
 *  values    the whole wizard form
 *  errors    error messages keyed by field name
 *  onChange  function(changes): merges an object into the form values
 */
export default function DestinationStep({ values, errors, onChange }) {
  const selected = values.destinationIds;
  const atLimit = selected.length >= TRIP_LIMITS.maxDestinations;

  const toggleDestination = (id) => {
    onChange({
      destinationIds: selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    });
  };

  const handleDepartureChange = (event) => {
    const value = event.target.value;
    const changes = { departureDate: value };

    // Keep the return date from falling before the new departure date.
    if (values.returnDate && value && values.returnDate < value) {
      changes.returnDate = value;
    }
    onChange(changes);
  };

  // Duration and suggestion
  const hasValidRange =
    values.departureDate &&
    values.returnDate &&
    values.returnDate >= values.departureDate;
  const duration = hasValidRange
    ? getDurationDays(values.departureDate, values.returnDate)
    : null;

  const suggestedDays = selected.length > 0 ? getSuggestedDays(selected) : null;
  const suggestedReturn =
    suggestedDays && values.departureDate
      ? addDays(values.departureDate, suggestedDays - 1)
      : "";
  const showSuggestion =
    suggestedDays && (!suggestedReturn || suggestedReturn !== values.returnDate);

  return (
    <section aria-labelledby="wizard-step-title">
      <div className="wizard__header">
        <h2 id="wizard-step-title" className="wizard__title" tabIndex={-1}>
          Where and when?
        </h2>
        <p className="wizard__text">
          Choose your starting point, the places you want to visit and your
          travel dates.
        </p>
      </div>

      <div className="wizard__section">
        <Select
          label="Starting location"
          name="startingLocation"
          required
          placeholder="Select a city"
          options={START_OPTIONS}
          hint="Where your trip begins and ends."
          value={values.startingLocation}
          onChange={(event) => onChange({ startingLocation: event.target.value })}
          error={errors.startingLocation}
        />
      </div>

      <div className="wizard__section">
        <fieldset
          className="fieldset"
          aria-describedby="destination-count"
          aria-invalid={errors.destinationIds ? true : undefined}
        >
          <legend className="fieldset__legend">
            Destinations
            <span className="form-label__required" aria-hidden="true">
              *
            </span>
          </legend>
          <p className="wizard__section-text">
            Choose up to {TRIP_LIMITS.maxDestinations} places. TripSathi orders
            your stops automatically to keep travel short.
          </p>

          {selected.length > 0 && (
            <ul className="selected-list" aria-label="Selected destinations">
              {selected.map((id) => {
                const destination = getDestinationById(id);
                if (!destination) return null;

                return (
                  <li key={id} className="selected-chip">
                    {destination.name}
                    <button
                      type="button"
                      className="selected-chip__remove"
                      onClick={() => toggleDestination(id)}
                      aria-label={`Remove ${destination.name}`}
                    >
                      <FiX size={14} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="option-grid">
            {destinations.map((destination) => {
              const checked = selected.includes(destination.id);

              return (
                <label key={destination.id} className="option-card">
                  <input
                    type="checkbox"
                    className="option-card__input"
                    name="destinationIds"
                    value={destination.id}
                    checked={checked}
                    disabled={!checked && atLimit}
                    onChange={() => toggleDestination(destination.id)}
                  />
                  <span className="option-card__body">
                    <span className="option-card__check" aria-hidden="true">
                      <FiCheck size={12} />
                    </span>
                    <span className="option-card__title">{destination.name}</span>
                    <span className="option-card__text">{destination.tagline}</span>
                    <span className="option-card__meta">
                      About {destination.recommendedDays}{" "}
                      {destination.recommendedDays === 1 ? "day" : "days"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <p
            id="destination-count"
            className="wizard__note"
            aria-live="polite"
          >
            {selected.length} of {TRIP_LIMITS.maxDestinations} selected
            {atLimit && ". Remove one to choose another."}
          </p>

          {errors.destinationIds && (
            <p className="form-error fieldset__error" role="alert">
              <FiAlertCircle size={14} aria-hidden="true" />
              {errors.destinationIds}
            </p>
          )}
        </fieldset>
      </div>

      <div className="wizard__section">
        <h3 className="wizard__section-title">Travel dates</h3>

        <div className="form-row">
          <Input
            label="Departure date"
            name="departureDate"
            type="date"
            required
            min={todayISO()}
            value={values.departureDate}
            onChange={handleDepartureChange}
            error={errors.departureDate}
          />
          <Input
            label="Return date"
            name="returnDate"
            type="date"
            required
            min={values.departureDate || todayISO()}
            value={values.returnDate}
            onChange={(event) => onChange({ returnDate: event.target.value })}
            error={errors.returnDate}
          />
        </div>

        <p className="wizard__note" aria-live="polite">
          {duration
            ? `Trip duration: ${duration} ${duration === 1 ? "day" : "days"}${
                selected.length > 0
                  ? ` (at least ${getMinimumTripDays(selected.length)} needed for your destinations)`
                  : ""
              }.`
            : "Choose both dates to see the trip duration."}
        </p>

        {showSuggestion && (
          <div className="wizard__suggestion">
            <span>
              <FiCalendar size={16} aria-hidden="true" /> Your chosen places
              usually take about <strong>{suggestedDays} days</strong>.
              {suggestedReturn &&
                ` That would mean returning on ${formatDate(suggestedReturn)}.`}
            </span>
            {suggestedReturn && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChange({ returnDate: suggestedReturn })}
              >
                Use suggested return date
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}