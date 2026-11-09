import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { FiAlertTriangle } from "react-icons/fi";

import Card from "../ui/Card";
import { ESTIMATE_DISCLAIMER } from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";
import { CHILD_FACTOR, MISC_RATE, getTripCosts } from "../../utils/tripUtils";
import classNames from "../../utils/classNames";

// Same colours as --chart-1 to --chart-5 in variables.css. Recharts draws
// SVG, so plain hex values are used here instead of CSS variables.
const CATEGORIES = [
  { key: "transport", label: "Transportation", color: "#0f766e", swatch: "swatch--1" },
  { key: "accommodation", label: "Accommodation", color: "#f59e0b", swatch: "swatch--2" },
  { key: "food", label: "Food", color: "#0b2538", swatch: "swatch--3" },
  { key: "activities", label: "Activities", color: "#38bdf8", swatch: "swatch--4" },
  { key: "misc", label: "Miscellaneous", color: "#a78bfa", swatch: "swatch--5" },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value } = payload[0];

  return (
    <div className="card" style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}>
      <strong>{name}</strong>: {formatCurrency(value)}
    </div>
  );
}

/**
 * Cost breakdown for a trip: a donut chart and a plain two-column table of
 * the same numbers, a bar showing how much of the budget is used, and notes
 * explaining the cost model.
 *
 * All figures come from getTripCosts(), so they always match the overview
 * card, the dashboard and the What-if simulator.
 *
 * The chart is hidden from screen readers; the table below carries the same
 * information as text.
 */
export default function BudgetBreakdown({ trip }) {
  const costs = getTripCosts(trip);
  const budget = trip.budget?.total || 0;
  const children = trip.travelers?.children || 0;

  const chartData = CATEGORIES.map((category) => ({
    name: category.label,
    value: costs[category.key],
    color: category.color,
  })).filter((item) => item.value > 0);

  const meterPercent = Math.min(costs.usedPercent, 100);
  const meterClass = costs.isOverBudget
    ? "meter__fill--over"
    : costs.usedPercent >= 90
      ? "meter__fill--warn"
      : "";

  return (
    <Card title="Budget breakdown" headingLevel="h2">
      {costs.isOverBudget && (
        <div className="alert alert--warning" role="status" style={{ marginBottom: "1.5rem" }}>
          <FiAlertTriangle className="alert__icon" size={18} aria-hidden="true" />
          <span>
            This itinerary is estimated to cost {formatCurrency(costs.overBy)} more
            than your budget. Try the What-if simulator or the lower-cost
            alternatives on this page.
          </span>
        </div>
      )}

      <div className="budget-layout">
        <div className="chart-box" aria-hidden="true">
          {chartData.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="92%"
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {chartData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="chart-box__center">
                <span className="chart-box__center-label">Estimated total</span>
                <span className="chart-box__center-value">{formatCurrency(costs.total)}</span>
              </div>
            </>
          )}
        </div>

        <div>
          <table className="cost-table">
            <caption className="sr-only">
              Estimated costs by category, in Nepali rupees
            </caption>
            <tbody>
              {CATEGORIES.map((category) => (
                <tr key={category.key}>
                  <th scope="row">
                    <span className="cost-table__label">
                      <span
                        className={classNames("cost-table__swatch", category.swatch)}
                        aria-hidden="true"
                      />
                      {category.label}
                    </span>
                  </th>
                  <td>{formatCurrency(costs[category.key])}</td>
                </tr>
              ))}

              <tr className="cost-table__total">
                <th scope="row">Total estimated expenses</th>
                <td>{formatCurrency(costs.total)}</td>
              </tr>
              <tr>
                <th scope="row">Your budget</th>
                <td>{formatCurrency(budget)}</td>
              </tr>
              <tr
                className={classNames(
                  "cost-table__status",
                  costs.isOverBudget ? "cost-table__status--over" : "cost-table__status--ok"
                )}
              >
                <th scope="row">{costs.isOverBudget ? "Over budget by" : "Remaining budget"}</th>
                <td>{formatCurrency(costs.isOverBudget ? costs.overBy : costs.remaining)}</td>
              </tr>
            </tbody>
          </table>

          <div className="meter">
            <div className="meter__header">
              <span>Budget used</span>
              <span>
                {costs.usedPercent}%{costs.isOverBudget && " (over budget)"}
              </span>
            </div>
            <div
              className="meter__track"
              role="progressbar"
              aria-label="Share of your budget used by the estimate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={meterPercent}
            >
              <span
                className={classNames("meter__fill", meterClass)}
                style={{ width: `${meterPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ul className="cost-notes">
        <li>
          Miscellaneous is a {Math.round(MISC_RATE * 100)}% buffer added to the
          other costs for small extras.
        </li>
        {children > 0 && (
          <li>
            Children are counted at {Math.round(CHILD_FACTOR * 100)}% of the adult
            cost.
          </li>
        )}
        <li>{ESTIMATE_DISCLAIMER}</li>
      </ul>
    </Card>
  );
}