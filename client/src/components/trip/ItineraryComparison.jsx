import { useMemo } from "react";
import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { tripPath } from "../../data/dashboardData";
import { ESTIMATE_DISCLAIMER } from "../../data/destinations";
import { INTENSITY_RULE_TEXT, compareTrips } from "../../utils/compareUtils";

function Cell({ value, isBetter, tag }) {
  return (
    <td>
      <span className="compare-cell">
        <span>{value}</span>
        {isBetter && tag && (
          <Badge variant="success">
            {tag}
            <span className="sr-only"> than the other trip</span>
          </Badge>
        )}
      </span>
    </td>
  );
}

/**
 * Side-by-side comparison of two trips: a short plain-language summary, then
 * a table grouped into Overview, Cost and Plan. "Lower" / "Higher" tags mark
 * the better value only for cost rows and remaining budget.
 *
 * Props
 *  tripA, tripB   two different trip objects
 */
export default function ItineraryComparison({ tripA, tripB }) {
  const comparison = useMemo(() => compareTrips(tripA, tripB), [tripA, tripB]);

  return (
    <Card title="Comparison" headingLevel="h2">
      <h3 className="whatif__group-title">Summary</h3>
      <ul className="insights">
        {comparison.insights.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>

      <div className="table-wrapper">
        <table className="table compare-table compare-table--trips">
          <caption className="sr-only">
            Side-by-side comparison of {tripA.title} and {tripB.title}
          </caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">
                <Link to={tripPath(tripA.id)}>{tripA.title}</Link>
              </th>
              <th scope="col">
                <Link to={tripPath(tripB.id)}>{tripB.title}</Link>
              </th>
            </tr>
          </thead>

          {comparison.groups.map((group) => (
            <tbody key={group.title}>
              <tr className="compare-table__group">
                <th scope="rowgroup" colSpan={3}>
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr
                  key={row.key}
                  className={row.key === "total" ? "compare-table__strong" : undefined}
                >
                  <th scope="row">{row.label}</th>
                  <Cell value={row.a} isBetter={row.better === "a"} tag={row.tag} />
                  <Cell value={row.b} isBetter={row.better === "b"} tag={row.tag} />
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <ul className="cost-notes">
        <li>
          Lower and Higher mark the better value for costs and remaining budget
          only. A cheaper trip is not always the better one.
        </li>
        <li>{INTENSITY_RULE_TEXT}</li>
        <li>{ESTIMATE_DISCLAIMER}</li>
      </ul>
    </Card>
  );
}