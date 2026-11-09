import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheck,
  FiMinus,
  FiPlus,
} from "react-icons/fi";

import Input from "../ui/Input";
import destinations, {
  BUDGET_TIERS,
  ESTIMATE_DISCLAIMER,
  getDailyCost,
  getDestinationById,
} from "../../data/destinations";
import { TRIP_LIMITS } from "../../data/tripOptions";
import { formatCurrency } from "../../utils/formatCurrency";
import { CHILD_FACTOR, getDurationDays, getPayingUnits } from "../../utils/tripUtils";

const TIER_INFO = {
  budget: {
    label: "Budget",
    description: "Simple stays and local food. The most affordable option.",
  },
  standard: {
    label: "Standard",
    description: "Comfortable mid-range hotels and restaurants.",
  },
  premium: {
    label: "Premium",
    description: "Higher-end stays and dining, with more comfort.",
  },
};

// Average cost per person per day (stay + food + local transport) for a
// budget level, across the chosen destinations (or all, if none chosen yet).
function getIndicativeDailyCost(tier, destinationIds) {
  const chosen = destinationIds.map(getDestinationById).filter(Boolean);
  const list = chosen.length > 0 ? chosen : destinations;
  const total = list.reduce((sum, item) => sum + getDailyCost(item, tier), 0);
  return Math.round(total / list.length);
}

/** One "adults / children" row with minus and plus buttons. */
function Counter({ id, label, hint, value, min, max, onChange }) {
  const number = Number(value) || 0;

  return (
    <div className="counter-row" role="group" aria-labelledby={`${id}-label`}>
      <div>
        <p id={`${id}-label`} className="counter-row__label">
          {label}
        </p>
        {hint && <p className="counter-row__hint">{hint}</p>}
      </div>

      <div className="counter">
        <button
          type="button"
          className="counter__button"
          onClick={() => onChange(number - 1)}
          disabled={number <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <FiMinus aria-hidden="true" />
        </button>
        <span className="counter__value" aria-live="polite">
          {number}
        </span>
        <button
          type="button"
          className="counter__button"
          onClick={() => onChange(number + 1)}
          disabled={number >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <FiPlus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Wizard step 2: total budget, travelers and budget level.
 *
 * Props
 *  values    the whole wizard form
 *  errors    error messages keyed by field name
 *  onChange  function(changes): merges an object into the form values
 */
export default function BudgetStep({ values, errors, onChange }) {
  const budget = Number(values.budgetTotal);
  const hasBudget = values.budgetTotal !== "" && Number.isFinite(budget) && budget > 0;

  const adults = Number(values.adults) || 0;
  const children = Number(values.children) || 0;
  const headcount = adults + children;
  const perPerson = hasBudget && headcount > 0 ? Math.round(budget / headcount) : null;

  // Days from the dates chosen in step 1 (null if they are not valid).
  const days =
    values.departureDate &&
    values.returnDate &&
    values.returnDate >= values.departureDate
      ? getDurationDays(values.departureDate, values.returnDate)
      : null;

  // Budget per person per day, counting children at the same rate the
  // itinerary cost model uses.
  const units = getPayingUnits({ travelers: { adults, children } });
  const perPersonPerDay =
    hasBudget && days && units > 0 ? Math.round(budget / units / days) : null;
  const cheapestDaily = getIndicativeDailyCost("budget", values.destinationIds);
  const mayBeTight = perPersonPerDay !== null && perPersonPerDay < cheapestDaily;

  const handleBudgetChange = (event) => {
    // Digits only, so "40,000" or "NPR 40000" cannot break the number.
    onChange({ budgetTotal: event.target.value.replace(/\D/g, "") });
  };

  return (
    <section aria-labelledby="wizard-step-title">
      <div className="wizard__header">
        <h2 id="wizard-step-title" className="wizard__title" tabIndex={-1}>
          Budget and travelers
        </h2>
        <p className="wizard__text">
          Tell us how much you can spend in total and who is travelling.
        </p>
      </div>

      <div className="wizard__section">
        <Input
          label="Total budget (NPR)"
          name="budgetTotal"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={String(TRIP_LIMITS.maxBudget).length}
          placeholder="e.g. 40000"
          hint={
            hasBudget
              ? `${formatCurrency(budget)} for the whole trip and everyone travelling.`
              : `Between ${formatCurrency(TRIP_LIMITS.minBudget)} and ${formatCurrency(
                  TRIP_LIMITS.maxBudget
                )}.`
          }
          value={values.budgetTotal}
          onChange={handleBudgetChange}
          error={errors.budgetTotal}
        />
      </div>

      <div className="wizard__section">
        <h3 className="wizard__section-title">Travelers</h3>

        <Counter
          id="adults"
          label="Adults"
          hint="Estimated at the full cost per person."
          value={values.adults}
          min={TRIP_LIMITS.minAdults}
          max={TRIP_LIMITS.maxAdults}
          onChange={(next) => onChange({ adults: next })}
        />
        <Counter
          id="children"
          label="Children"
          hint={`Estimated at ${Math.round(CHILD_FACTOR * 100)}% of the adult cost.`}
          value={values.children}
          min={0}
          max={TRIP_LIMITS.maxChildren}
          onChange={(next) => onChange({ children: next })}
        />

        {(errors.adults || errors.children) && (
          <p className="form-error fieldset__error" role="alert">
            <FiAlertCircle size={14} aria-hidden="true" />
            {errors.adults || errors.children}
          </p>
        )}
      </div>

      <div className="wizard__section">
        <fieldset className="fieldset">
          <legend className="fieldset__legend">
            Budget level
            <span className="form-label__required" aria-hidden="true">
              *
            </span>
          </legend>
          <p className="wizard__section-text">
            This sets the typical price of stays, food and local transport.
            Average amounts are per person per day.
          </p>

          <div className="option-grid option-grid--wide option-grid--list">
            {BUDGET_TIERS.map((tier) => (
              <label key={tier} className="option-card">
                <input
                  type="radio"
                  className="option-card__input"
                  name="budgetCategory"
                  value={tier}
                  checked={values.budgetCategory === tier}
                  onChange={() => onChange({ budgetCategory: tier })}
                />
                <span className="option-card__body">
                  <span className="option-card__check" aria-hidden="true">
                    <FiCheck size={12} />
                  </span>
                  <span className="option-card__title">{TIER_INFO[tier].label}</span>
                  <span className="option-card__text">
                    {TIER_INFO[tier].description}
                  </span>
                  <span className="option-card__meta">
                    About {formatCurrency(getIndicativeDailyCost(tier, values.destinationIds))}{" "}
                    / person / day
                  </span>
                </span>
              </label>
            ))}
          </div>

          {errors.budgetCategory && (
            <p className="form-error fieldset__error" role="alert">
              <FiAlertCircle size={14} aria-hidden="true" />
              {errors.budgetCategory}
            </p>
          )}
        </fieldset>
        <p className="wizard__note">{ESTIMATE_DISCLAIMER}</p>
      </div>

      <div className="wizard__section">
        <h3 className="wizard__section-title">Budget summary</h3>

        <div className="budget-summary" aria-live="polite">
          <div className="budget-summary__item">
            <span className="budget-summary__label">Total budget</span>
            <span className="budget-summary__value">
              {hasBudget ? formatCurrency(budget) : "—"}
            </span>
          </div>
          <div className="budget-summary__item">
            <span className="budget-summary__label">Travelers</span>
            <span className="budget-summary__value">
              {headcount} {headcount === 1 ? "person" : "people"}
            </span>
          </div>
          <div className="budget-summary__item budget-summary__item--highlight">
            <span className="budget-summary__label">Estimated per person</span>
            <span className="budget-summary__value">
              {perPerson !== null ? formatCurrency(perPerson) : "—"}
            </span>
          </div>
        </div>

        {perPersonPerDay !== null && (
          <p className="wizard__note">
            Over {days} {days === 1 ? "day" : "days"}, that is about{" "}
            {formatCurrency(perPersonPerDay)} per person per day.
          </p>
        )}

        {mayBeTight && (
          <div className="alert alert--warning" role="status" style={{ marginTop: "1rem" }}>
            <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
            <span>
              This may be tight. The Budget level averages about{" "}
              {formatCurrency(cheapestDaily)} per person per day for stays, food
              and local transport, before travel between cities. You can still
              continue, and the itinerary will show where the estimate falls.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}