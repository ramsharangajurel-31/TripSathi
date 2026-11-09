import { useMemo } from "react";
import { FiAlertTriangle, FiEdit2, FiInfo } from "react-icons/fi";

import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { ESTIMATE_DISCLAIMER, INTERESTS, getDestinationById } from "../../data/destinations";
import {
  ACCOMMODATION_OPTIONS,
  INTENSITY_OPTIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
  getOptionLabel,
} from "../../data/tripOptions";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange } from "../../utils/formatDate";
import { generateTrip } from "../../utils/tripGenerator";
import { DESCRIPTION_MAX } from "../../utils/tripValidation";
import { getDurationDays, getTripCosts } from "../../utils/tripUtils";

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };
const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);

// Step indexes used by the "Edit" buttons (same order as the wizard steps).
const STEP = { destination: 0, budget: 1, interests: 2, preferences: 3 };

function ReviewSection({ title, onEdit, children }) {
  return (
    <section className="review-section" aria-label={title}>
      <div className="review-section__header">
        <h3 className="review-section__title">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FiEdit2 />}
          onClick={onEdit}
          aria-label={`Edit ${title.toLowerCase()}`}
        >
          Edit
        </Button>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

/**
 * Wizard step 5: optional free-text description, a summary of every choice
 * (with "Edit" buttons that jump back to the right step) and a live cost
 * estimate for the itinerary that will be created.
 *
 * The estimate comes from the same generateTrip() the Create button uses,
 * so the numbers shown here are the numbers the new trip will have.
 *
 * Props
 *  values                the whole wizard form
 *  errors                error messages keyed by field name
 *  onChange              function(changes): merges an object into the form
 *  onEditStep            function(stepIndex): jumps back to that step
 *  prefilledFromSearch   true when the description came from the home-page box
 */
export default function ReviewStep({
  values,
  errors,
  onChange,
  onEditStep,
  prefilledFromSearch = false,
}) {
  const preferences = values.preferences;

  // Build the itinerary preview. A failure here means an earlier step is
  // invalid, which the wizard's validation normally prevents.
  const preview = useMemo(() => {
    try {
      const trip = generateTrip(values);
      return { trip, costs: getTripCosts(trip), error: "" };
    } catch (error) {
      return { trip: null, costs: null, error: error.message };
    }
  }, [values]);

  const orderedIds = preview.trip ? preview.trip.destinationIds : values.destinationIds;
  const destinationNames = orderedIds
    .map((id) => getDestinationById(id)?.name)
    .filter(Boolean);

  const days = getDurationDays(values.departureDate, values.returnDate);
  const adults = Number(values.adults) || 0;
  const children = Number(values.children) || 0;
  const headcount = adults + children;
  const budget = Number(values.budgetTotal) || 0;
  const { costs } = preview;

  return (
    <section aria-labelledby="wizard-step-title">
      <div className="wizard__header">
        <h2 id="wizard-step-title" className="wizard__title" tabIndex={-1}>
          Review your trip
        </h2>
        <p className="wizard__text">
          Check the details below. Use Edit to change anything before creating
          your itinerary.
        </p>
      </div>

      <div className="wizard__section">
        <Input
          as="textarea"
          rows={4}
          label="Describe your ideal trip in your own words (optional)"
          name="description"
          maxLength={DESCRIPTION_MAX}
          placeholder="e.g. I want to travel to Pokhara for 4 days with my friends. Our total budget is NPR 40,000. We enjoy nature, adventure and photography."
          hint={`${(values.description || "").length}/${DESCRIPTION_MAX} characters.`}
          value={values.description || ""}
          onChange={(event) => onChange({ description: event.target.value })}
          error={errors.description}
        />
        <p className="wizard__note">
          {prefilledFromSearch && "This was filled in from your home-page search. "}
          Your description is saved with the trip. It is not interpreted
          automatically yet; the itinerary is built from the choices above.
        </p>
      </div>

      <div className="wizard__section">
        <ReviewSection
          title="Destination and dates"
          onEdit={() => onEditStep(STEP.destination)}
        >
          <dl className="review-list">
            <Row label="Starting from">{values.startingLocation || "—"}</Row>
            <Row label="Destinations (in visiting order)">
              {destinationNames.length > 0 ? destinationNames.join(" → ") : "—"}
            </Row>
            <Row label="Dates">
              {formatDateRange(values.departureDate, values.returnDate)}
            </Row>
            <Row label="Duration">
              {days} {days === 1 ? "day" : "days"}
            </Row>
          </dl>
        </ReviewSection>

        <ReviewSection
          title="Budget and travelers"
          onEdit={() => onEditStep(STEP.budget)}
        >
          <dl className="review-list">
            <Row label="Total budget">{formatCurrency(budget)}</Row>
            <Row label="Travelers">
              {adults} {adults === 1 ? "adult" : "adults"}
              {children > 0 &&
                `, ${children} ${children === 1 ? "child" : "children"}`}
            </Row>
            <Row label="Budget per person">
              {headcount > 0 ? formatCurrency(Math.round(budget / headcount)) : "—"}
            </Row>
            <Row label="Budget level">
              {TIER_LABELS[values.budgetCategory] || "—"}
            </Row>
          </dl>
        </ReviewSection>

        <ReviewSection title="Interests" onEdit={() => onEditStep(STEP.interests)}>
          <div className="review-tags">
            {values.interests.map((id) => (
              <Badge key={id} variant="primary">
                {INTEREST_LABELS[id] || id}
              </Badge>
            ))}
          </div>
        </ReviewSection>

        <ReviewSection
          title="Travel preferences"
          onEdit={() => onEditStep(STEP.preferences)}
        >
          <dl className="review-list">
            <Row label="Accommodation">
              {getOptionLabel(ACCOMMODATION_OPTIONS, preferences.accommodation)}
            </Row>
            <Row label="Transport">
              {getOptionLabel(TRANSPORT_OPTIONS, preferences.transport)}
            </Row>
            <Row label="Activity intensity">
              {getOptionLabel(INTENSITY_OPTIONS, preferences.intensity)}
            </Row>
            <Row label="Travel pace">
              {getOptionLabel(PACE_OPTIONS, preferences.pace)}
            </Row>
            <Row label="Special requirements">
              {preferences.special?.trim() || "None"}
            </Row>
            <Row label="Additional notes">{values.notes?.trim() || "None"}</Row>
          </dl>
        </ReviewSection>
      </div>

      <div className="wizard__section">
        <h3 className="wizard__section-title">Estimated cost</h3>

        {preview.error ? (
          <div className="alert alert--danger" role="alert">
            <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
            <span>
              We couldn&apos;t prepare an estimate: {preview.error} Go back and
              check your earlier answers.
            </span>
          </div>
        ) : (
          <>
            <div className="budget-summary" aria-live="polite">
              <div className="budget-summary__item budget-summary__item--highlight">
                <span className="budget-summary__label">Estimated total</span>
                <span className="budget-summary__value">{formatCurrency(costs.total)}</span>
              </div>
              <div className="budget-summary__item">
                <span className="budget-summary__label">Your budget</span>
                <span className="budget-summary__value">{formatCurrency(budget)}</span>
              </div>
              <div className="budget-summary__item">
                <span className="budget-summary__label">
                  {costs.isOverBudget ? "Over budget by" : "Remaining"}
                </span>
                <span className="budget-summary__value">
                  {formatCurrency(costs.isOverBudget ? costs.overBy : costs.remaining)}
                </span>
              </div>
            </div>

            <p className="wizard__note">
              About {formatCurrency(costs.perPerson)} per person. {ESTIMATE_DISCLAIMER}
            </p>

            {costs.isOverBudget && (
              <div className="alert alert--warning" role="status" style={{ marginTop: "1rem" }}>
                <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
                <span>
                  This plan is estimated to cost more than your budget. You can
                  still create it and adjust it afterwards, or use Edit to change
                  your budget, dates or preferences.
                </span>
              </div>
            )}

            {preview.trip.generationNotes.length > 0 && (
              <div className="alert alert--info" role="status" style={{ marginTop: "1rem" }}>
                <FiInfo className="alert__icon" size={18} aria-hidden="true" />
                <div>
                  <p className="font-semibold">Things to know</p>
                  <ul>
                    {preview.trip.generationNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}