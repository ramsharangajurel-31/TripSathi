import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiAlertTriangle,
  FiInfo,
  FiCopy,
  FiRotateCcw,
  FiSliders,
  FiX,
} from "react-icons/fi";

import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import ConfirmDialog from "../common/ConfirmDialog";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { Counter } from "./BudgetStep";
import {
  ACCOMMODATION_OPTIONS,
  INTENSITY_OPTIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
  TRIP_LIMITS,
} from "../../data/tripOptions";
import useNotifications from "../../hooks/useNotifications";
import useTrips from "../../hooks/useTrips";
import { tripPath } from "../../data/dashboardData";
import { formatCurrency } from "../../utils/formatCurrency";
import { getMinimumTripDays } from "../../utils/tripGenerator";
import {
  CHILD_FACTOR,
  getDayActivities,
  getDayCosts,
} from "../../utils/tripUtils";
import {
  WHAT_IF_DISCLAIMER,
  getScenarioDefaults,
  toNewTripData,
  simulateTrip,
} from "../../utils/whatIfUtils";
import classNames from "../../utils/classNames";

const toOptions = (list) => list.map((item) => ({ value: item.id, label: item.label }));

const COST_ROWS = [
  { key: "transport", label: "Transportation" },
  { key: "accommodation", label: "Accommodation" },
  { key: "food", label: "Food" },
  { key: "activities", label: "Activities" },
  { key: "misc", label: "Miscellaneous" },
  { key: "total", label: "Total estimated expenses", strong: true },
];

// "+NPR 2,520" / "−NPR 2,520". Colour helps, but the sign carries the meaning.
function describeDelta(value, goodWhenPositive = false) {
  if (value === 0) return { text: "No change", className: "delta" };

  const sign = value > 0 ? "+" : "−";
  const good = goodWhenPositive ? value > 0 : value < 0;

  return {
    text: `${sign}${formatCurrency(Math.abs(value))}`,
    className: classNames("delta", good ? "delta--good" : "delta--bad"),
  };
}

const describeRemaining = (remaining) =>
  remaining < 0
    ? `Over by ${formatCurrency(Math.abs(remaining))}`
    : formatCurrency(remaining);

function SimulatorBody({ trip, onClose }) {
  const initial = useMemo(() => {
    const defaults = getScenarioDefaults(trip);
    return { ...defaults, budgetTotal: String(defaults.budgetTotal) };
  }, [trip]);

  const [scenario, setScenario] = useState(initial);

  const result = useMemo(() => simulateTrip(trip, scenario), [trip, scenario]);

    const update = (changes) => setScenario((previous) => ({ ...previous, ...changes }));

  const navigate = useNavigate();
  const { addTrip } = useTrips();
  const { addNotification } = useNotifications();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCreateTrip = () => {
    if (!result.simulated) return;

    const created = addTrip(toNewTripData(trip, result.simulated));
    setConfirmOpen(false);

    if (!created) {
      toast.error("We could not create the trip. Please sign in again and retry.");
      return;
    }

    addNotification({
      type: "trip",
      title: `What-if trip created: ${created.title}`,
      message: "Review the simulated itinerary. All figures are simulated estimates.",
      link: tripPath(created.id),
    });
    toast.success("New trip created from your simulation.");
    navigate(tripPath(created.id));
  };
  const hasErrors = Object.keys(result.errors).length > 0;
  const { before, after, deltas, counts } = result;

  const minDays = getMinimumTripDays((trip.destinationIds || []).length);
  const excluded = new Set(scenario.excluded);

  const toggleActivity = (key, included) => {
    update({
      excluded: included
        ? scenario.excluded.filter((item) => item !== key)
        : [...scenario.excluded, key],
    });
  };

  const budgetAfter = Number(scenario.budgetTotal) || 0;
  const remainingDelta = describeDelta(deltas.remaining, true);
  const totalDelta = describeDelta(deltas.total);

  return (
    <>
      <div className="alert alert--info" role="note">
        <FiInfo className="alert__icon" size={18} aria-hidden="true" />
        <span>{WHAT_IF_DISCLAIMER}</span>
      </div>

      {/* Live summary: stays at the top so the effect is visible on small screens too */}
      <div className="budget-summary whatif__summary" aria-live="polite">
        <div className="budget-summary__item budget-summary__item--highlight">
          <span className="budget-summary__label">Simulated total</span>
          <span className="budget-summary__value">
            {hasErrors ? "—" : formatCurrency(after.total)}
          </span>
          {!hasErrors && <span className={totalDelta.className}>{totalDelta.text}</span>}
        </div>
        <div className="budget-summary__item">
          <span className="budget-summary__label">Simulated budget</span>
          <span className="budget-summary__value">
            {hasErrors ? "—" : formatCurrency(budgetAfter)}
          </span>
        </div>
        <div className="budget-summary__item">
          <span className="budget-summary__label">
            {!hasErrors && after.isOverBudget ? "Over budget by" : "Remaining"}
          </span>
          <span className="budget-summary__value">
            {hasErrors
              ? "—"
              : formatCurrency(after.isOverBudget ? after.overBy : after.remaining)}
          </span>
          {!hasErrors && <span className={remainingDelta.className}>{remainingDelta.text}</span>}
        </div>
      </div>

      <div className="whatif__layout">
        {/* ---------- Controls ---------- */}
        <div className="whatif__controls">
          <section aria-labelledby="whatif-money">
            <h3 id="whatif-money" className="whatif__group-title">
              Budget and travelers
            </h3>

            <div className="flex flex-col gap-4">
              <Input
                label="Total budget (NPR)"
                name="whatIfBudget"
                inputMode="numeric"
                autoComplete="off"
                maxLength={String(TRIP_LIMITS.maxBudget).length}
                value={scenario.budgetTotal}
                onChange={(event) => update({ budgetTotal: event.target.value.replace(/\D/g, "") })}
                error={result.errors.budgetTotal}
                hint={
                  scenario.budgetTotal
                    ? `Currently ${formatCurrency(trip.budget?.total)}.`
                    : undefined
                }
              />

              <div>
                <Counter
                  id="whatif-adults"
                  label="Adults"
                  value={scenario.adults}
                  min={TRIP_LIMITS.minAdults}
                  max={TRIP_LIMITS.maxAdults}
                  onChange={(value) => update({ adults: value })}
                />
                <Counter
                  id="whatif-children"
                  label="Children"
                  hint={`Counted at ${Math.round(CHILD_FACTOR * 100)}% of the adult cost.`}
                  value={scenario.children}
                  min={0}
                  max={TRIP_LIMITS.maxChildren}
                  onChange={(value) => update({ children: value })}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="whatif-length">
            <h3 id="whatif-length" className="whatif__group-title">
              Trip length
            </h3>
            <Counter
              id="whatif-days"
              label="Days"
              hint="Changing this re-plans the itinerary."
              value={scenario.days}
              min={minDays}
              max={TRIP_LIMITS.maxDays}
              onChange={(value) => update({ days: value })}
            />
            {result.errors.days && (
              <p className="form-error">{result.errors.days}</p>
            )}
          </section>

          <section aria-labelledby="whatif-prefs">
            <h3 id="whatif-prefs" className="whatif__group-title">
              Travel preferences
            </h3>

            <div className="flex flex-col gap-4">
              <Select
                label="Accommodation"
                name="whatIfAccommodation"
                options={toOptions(ACCOMMODATION_OPTIONS)}
                value={scenario.accommodation}
                onChange={(event) => update({ accommodation: event.target.value })}
              />
              <Select
                label="Transport between cities"
                name="whatIfTransport"
                options={toOptions(TRANSPORT_OPTIONS)}
                value={scenario.transport}
                onChange={(event) => update({ transport: event.target.value })}
              />
              <Select
                label="Activity intensity"
                name="whatIfIntensity"
                options={toOptions(INTENSITY_OPTIONS)}
                value={scenario.intensity}
                onChange={(event) => update({ intensity: event.target.value })}
                hint="Changing this re-plans the itinerary."
              />
              <Select
                label="Travel pace"
                name="whatIfPace"
                options={toOptions(PACE_OPTIONS)}
                value={scenario.pace}
                onChange={(event) => update({ pace: event.target.value })}
                hint="Changing this re-plans the itinerary."
              />
            </div>
          </section>

          <fieldset className="fieldset">
            <legend className="whatif__group-title">Activities in this plan</legend>
            <p className="wizard__section-text">
              Untick an activity to see what skipping it would change.
              {scenario.excluded.length > 0 && ` ${scenario.excluded.length} unticked.`}
            </p>

            {result.activityList.length === 0 ? (
              <p className="results-note">This plan has no activities.</p>
            ) : (
              <ul className="activity-check">
                {result.activityList.map((item, index) => {
                  const included = !excluded.has(item.key);

                  return (
                    <li key={`${item.key}-${index}`}>
                      <label
                        className={classNames("activity-check__row", !included && "is-skipped")}
                      >
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => toggleActivity(item.key, !included)}
                        />
                        <span className="activity-check__text">
                          <span className="activity-check__name">{item.name}</span>
                          <span className="activity-check__meta">
                            Day {item.dayNumber}, {item.slotLabel.toLowerCase()} ·{" "}
                            {item.costPerPerson === 0
                              ? "Free"
                              : `${formatCurrency(item.costPerPerson)} per person`}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </fieldset>
        </div>

        {/* ---------- Results ---------- */}
        <div className="whatif__results">
          {result.errors.general && (
            <div className="alert alert--danger" role="alert">
              <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
              <span>{result.errors.general}</span>
            </div>
          )}

          {hasErrors ? (
            <p className="results-note">
              Enter valid values to see the simulation.
            </p>
          ) : (
            <>
              {result.warnings.map((warning) => (
                <div key={warning} className="alert alert--warning" role="status">
                  <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
                  <span>{warning}</span>
                </div>
              ))}

              {!result.changed && (
                <p className="results-note">
                  Change a value on the left to see how it affects the estimate.
                </p>
              )}

              <div>
                <h3 className="whatif__group-title">Estimated expenses</h3>
                <div className="table-wrapper">
                  <table className="table compare-table">
                    <caption className="sr-only">
                      Current and simulated costs, in Nepali rupees
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Item</th>
                        <th scope="col">Current</th>
                        <th scope="col">Simulated</th>
                        <th scope="col">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COST_ROWS.map((row) => {
                        const delta = describeDelta(deltas[row.key]);
                        return (
                          <tr key={row.key} className={row.strong ? "compare-table__strong" : undefined}>
                            <th scope="row">{row.label}</th>
                            <td>{formatCurrency(before[row.key])}</td>
                            <td>{formatCurrency(after[row.key])}</td>
                            <td className={delta.className}>{delta.text}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <th scope="row">Your budget</th>
                        <td>{formatCurrency(trip.budget?.total)}</td>
                        <td>{formatCurrency(budgetAfter)}</td>
                        <td className={describeDelta(budgetAfter - (trip.budget?.total || 0), true).className}>
                          {describeDelta(budgetAfter - (trip.budget?.total || 0), true).text}
                        </td>
                      </tr>
                      <tr className="compare-table__strong">
                        <th scope="row">Remaining budget</th>
                        <td>{describeRemaining(before.remaining)}</td>
                        <td>{describeRemaining(after.remaining)}</td>
                        <td className={remainingDelta.className}>{remainingDelta.text}</td>
                      </tr>
                      <tr>
                        <th scope="row">Cost per person</th>
                        <td>{formatCurrency(before.perPerson)}</td>
                        <td>{formatCurrency(after.perPerson)}</td>
                        <td className={describeDelta(deltas.perPerson).className}>
                          {describeDelta(deltas.perPerson).text}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="meter">
                  <div className="meter__header">
                    <span>Simulated budget used</span>
                    <span>
                      {after.usedPercent}%{after.isOverBudget && " (over budget)"}
                    </span>
                  </div>
                  <div
                    className="meter__track"
                    role="progressbar"
                    aria-label="Share of the simulated budget used"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(after.usedPercent, 100)}
                  >
                    <span
                      className={classNames(
                        "meter__fill",
                        after.isOverBudget
                          ? "meter__fill--over"
                          : after.usedPercent >= 90
                            ? "meter__fill--warn"
                            : ""
                      )}
                      style={{ width: `${Math.min(after.usedPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="whatif__group-title">Effect on the plan</h3>
                <dl className="info-list">
                  <div className="info-list__row">
                    <dt>Trip length</dt>
                    <dd>
                      {counts.daysBefore === counts.daysAfter
                        ? `${counts.daysAfter} days`
                        : `${counts.daysBefore} → ${counts.daysAfter} days`}
                    </dd>
                  </div>
                  <div className="info-list__row">
                    <dt>Activities planned</dt>
                    <dd>
                      {counts.activitiesBefore === counts.activitiesAfter
                        ? counts.activitiesAfter
                        : `${counts.activitiesBefore} → ${counts.activitiesAfter}`}
                    </dd>
                  </div>
                  <div className="info-list__row">
                    <dt>Activities available at this intensity</dt>
                    <dd>
                      {counts.availableAfter.total} ({counts.availableAfter.matching} match your
                      interests)
                    </dd>
                  </div>
                </dl>

                <details className="whatif__outline">
                  <summary>
                    Simulated day-by-day outline ({counts.daysAfter}{" "}
                    {counts.daysAfter === 1 ? "day" : "days"})
                  </summary>
                  <ol>
                    {result.simulated.days.map((day) => (
                      <li key={day.id}>
                        <strong>
                          Day {day.dayNumber}: {day.title}
                        </strong>
                        <span>
                          {getDayActivities(day).length}{" "}
                          {getDayActivities(day).length === 1 ? "activity" : "activities"} ·{" "}
                          {formatCurrency(getDayCosts(result.simulated, day).total)} for the day
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="form-actions">
        <Button
          variant="ghost"
          leftIcon={<FiRotateCcw />}
          onClick={() => setScenario(initial)}
          disabled={!result.changed}
        >
          Reset changes
        </Button>
                <Button
          leftIcon={<FiCopy />}
          onClick={() => setConfirmOpen(true)}
          disabled={!result.changed || hasErrors}
        >
          Save as a new trip
        </Button>
        <ConfirmDialog
          isOpen={confirmOpen}
          variant="warning"
          icon={<FiCopy />}
          title="Save this simulation as a new trip?"
          message="A separate trip will be created with these changes. Your original trip stays exactly as it is."
          confirmLabel="Create new trip"
          onConfirm={handleCreateTrip}
          onCancel={() => setConfirmOpen(false)}
        />
        <Button variant="secondary" leftIcon={<FiX />} onClick={onClose}>
          Close simulator
        </Button>
      </div>
    </>
  );
}

/**
 * What-if simulator card for the results page. Collapsed until opened, so
 * the long page stays manageable. Closing discards the scenario.
 * The parent gives it a key that changes when the trip is edited, so it
 * never works from outdated figures.
 */
export default function WhatIfSimulator({ trip }) {
  const [open, setOpen] = useState(false);

  return (
    <Card
      title="What-if simulator"
      headingLevel="h2"
      actions={<Badge variant="info">Simulated estimates</Badge>}
    >
      {open ? (
        <SimulatorBody trip={trip} onClose={() => setOpen(false)} />
      ) : (
        <>
          <p className="results-note">
            See how a different budget, trip length, group size, preferences or
            activities would change the cost. Your saved trip is not changed.
          </p>
          <Button leftIcon={<FiSliders />} onClick={() => setOpen(true)}>
            Start simulating
          </Button>
        </>
      )}
    </Card>
  );
}