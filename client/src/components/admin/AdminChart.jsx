import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "../ui/Card";

// Same colours as --chart-1 to --chart-6 in variables.css (Recharts draws SVG,
// so plain hex values are used instead of CSS variables).
const PALETTE = ["#0f766e", "#f59e0b", "#0b2538", "#38bdf8", "#a78bfa", "#fb7185"];
const BAR_COLOR = "#0f766e";
const AXIS_TICK = { fontSize: 12, fill: "#64748b" };
const GRID_COLOR = "#e2e8f0";

/**
 * Card with one chart. The chart is hidden from screen readers and replaced
 * by a hidden data table, so the same numbers are available as text.
 *
 * Props
 *  title, description   heading and one line under it
 *  type          "bar" (vertical bars, short names such as months)
 *                "horizontal-bar" (long names, grows with the number of rows)
 *                "donut" (parts of a whole, with a legend)
 *  data          [{ name, value }]
 *  valueLabel    what the number means, for tooltips and the hidden table
 *  emptyMessage  shown when there is nothing to draw
 */
export default function AdminChart({
  title,
  description,
  type = "bar",
  data,
  valueLabel = "Count",
  emptyMessage = "No data yet.",
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = data.length === 0 || total === 0;

  const height =
    type === "horizontal-bar" ? Math.max(200, data.length * 36 + 40) : 260;

  const colored = data.map((item, index) => ({
    ...item,
    color: PALETTE[index % PALETTE.length],
  }));

  const tooltip = (
    <Tooltip
      formatter={(value) => [value, valueLabel]}
      cursor={{ fill: "rgba(15, 118, 110, 0.08)" }}
    />
  );

  return (
    <Card title={title} headingLevel="h2">
      {description && <p className="results-note">{description}</p>}

      {isEmpty ? (
        <p className="admin-chart__empty">{emptyMessage}</p>
      ) : (
        <>
          <div className="chart-box" style={{ height }} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              {type === "donut" ? (
                <PieChart accessibilityLayer={false}>
                  <Pie
                    data={colored.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="92%"
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {colored
                      .filter((item) => item.value > 0)
                      .map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                  </Pie>
                  {tooltip}
                </PieChart>
              ) : type === "horizontal-bar" ? (
                <BarChart
                  accessibilityLayer={false}
                  data={data}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  {tooltip}
                  <Bar
                    dataKey="value"
                    fill={BAR_COLOR}
                    radius={[0, 4, 4, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              ) : (
                <BarChart
                  accessibilityLayer={false}
                  data={data}
                  margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  {tooltip}
                  <Bar
                    dataKey="value"
                    fill={BAR_COLOR}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>

            {type === "donut" && (
              <div className="chart-box__center">
                <span className="chart-box__center-label">Total</span>
                <span className="chart-box__center-value">{total}</span>
              </div>
            )}
          </div>

          {type === "donut" && (
            <ul className="chart-legend">
              {colored.map((item) => (
                <li key={item.name}>
                  <span className="chart-legend__label">
                    <span
                      className="cost-table__swatch"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.name}
                  </span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          )}

          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">{valueLabel}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.name}>
                  <th scope="row">{item.name}</th>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}