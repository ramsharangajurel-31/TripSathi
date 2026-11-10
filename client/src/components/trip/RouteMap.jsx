import { FiClock, FiCreditCard, FiInfo, FiNavigation } from "react-icons/fi";

import Card from "../ui/Card";
import { ESTIMATE_DISCLAIMER } from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  MODE_LABELS,
  formatTravelTime,
  getPlaceName,
  getStartDestinationId,
  getTripRoute,
} from "../../utils/routeUtils";
import classNames from "../../utils/classNames";

const isRoad = (segment) => segment.mode !== "flight";

// Distances are shown for road travel only. The distance stored for a flight
// is the road distance of the same pair, so showing it next to a flight
// would be misleading.
function describeLeg(leg) {
  const modes = [...new Set(leg.segments.map((segment) => MODE_LABELS[segment.mode]))].join(" + ");
  const via = leg.segments.length > 1 ? getPlaceName(leg.segments[0].to) : "";
  const roadKm = leg.segments
    .filter(isRoad)
    .reduce((sum, segment) => sum + segment.distanceKm, 0);

  return { modes, via, roadKm };
}

function LegDetails({ leg }) {
  if (leg.segments.length === 0) {
    return (
      <p className="route__leg-empty">
        {leg.fromId === leg.toId
          ? "No travel needed: same place."
          : "A route estimate is not available for this pair of places."}
      </p>
    );
  }

  const { modes, via, roadKm } = describeLeg(leg);

  return (
    <ul className="route__leg-details">
      <li>
        <FiNavigation size={14} aria-hidden="true" />
        {modes}
        {via && ` via ${via}`}
      </li>
      <li>
        <FiClock size={14} aria-hidden="true" />
        About {formatTravelTime(leg.hours)}
      </li>
      {roadKm > 0 && <li>About {roadKm} km by road</li>}
      <li>
        <FiCreditCard size={14} aria-hidden="true" />
        {formatCurrency(leg.costPerPerson)} per adult
      </li>
    </ul>
  );
}

/**
 * Route overview: the order of stops, and the estimated time, cost and road
 * distance of each leg between cities. A summary built from sample
 * estimates, NOT a live map (no map service is connected yet).
 *
 * The route is the trip's saved destination order, from the starting city
 * through every destination and back.
 */
export default function RouteMap({ trip }) {
  const transport = trip.preferences?.transport || "tourist-bus";
  const startId = getStartDestinationId(trip.startingLocation);
  const route = getTripRoute(startId, trip.destinationIds || [], transport);

  if (route.legs.length === 0) {
    return (
      <Card title="Route overview" headingLevel="h2">
        <p className="results-note">This trip has no route to show.</p>
      </Card>
    );
  }

  const stops = [...route.legs.map((leg) => leg.fromId), route.legs[route.legs.length - 1].toId];
  const totalRoadKm = route.legs.reduce((sum, leg) => sum + describeLeg(leg).roadKm, 0);

  return (
    <Card title="Route overview" headingLevel="h2">
      <div className="alert alert--info" role="note" style={{ marginBottom: "1.5rem" }}>
        <FiInfo className="alert__icon" size={18} aria-hidden="true" />
        <span>
          This is a route summary from sample estimates, not a live map or a live
          timetable. A map service is connected in a later phase.
        </span>
      </div>

      <ol className="route" aria-label="Route stops in order">
        {stops.map((placeId, index) => {
          const leg = route.legs[index];
          const isFirst = index === 0;
          const isLast = index === stops.length - 1;
          const kind = isFirst ? "Start" : isLast ? "Return" : `Stop ${index}`;

          return (
            <li
              key={`${placeId}-${index}`}
              className={classNames("route__item", isLast && "route__item--end")}
            >
              <span className="route__dot" aria-hidden="true" />
              <div className="route__content">
                <p className="route__stop">
                  <span className="route__stop-kind">{kind}</span>
                  {getPlaceName(placeId)}
                </p>

                {leg && (
                  <div className="route__leg">
                    <p className="route__leg-title">Travel to {getPlaceName(leg.toId)}</p>
                    <LegDetails leg={leg} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <dl className="fact-grid route__totals">
        <div className="fact">
          <span className="fact__icon" aria-hidden="true">
            <FiClock />
          </span>
          <div>
            <dt className="fact__label">Total travel time between cities</dt>
            <dd className="fact__value">About {formatTravelTime(route.totalHours)}</dd>
          </div>
        </div>
        <div className="fact">
          <span className="fact__icon" aria-hidden="true">
            <FiCreditCard />
          </span>
          <div>
            <dt className="fact__label">Estimated travel cost</dt>
            <dd className="fact__value">
              {formatCurrency(route.totalCostPerPerson)}
              <span className="fact__sub">per adult, whole route</span>
            </dd>
          </div>
        </div>
        {totalRoadKm > 0 && (
          <div className="fact">
            <span className="fact__icon" aria-hidden="true">
              <FiNavigation />
            </span>
            <div>
              <dt className="fact__label">Road distance</dt>
              <dd className="fact__value">About {totalRoadKm} km</dd>
            </div>
          </div>
        )}
      </dl>

      <ul className="cost-notes">
        <li>Local taxis and rickshaws are in the daily costs, not in these figures.</li>
        <li>{ESTIMATE_DISCLAIMER}</li>
      </ul>
    </Card>
  );
}