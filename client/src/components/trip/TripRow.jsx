import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBookmark,
  FiCalendar,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";

import Badge from "../ui/Badge";
import { TRIP_STATUS_BADGES, tripPath } from "../../data/dashboardData";
import { formatCurrency } from "../../utils/formatCurrency";
import { daysUntil, formatDateRange } from "../../utils/formatDate";
import {
  TRIP_STATUS,
  getDurationDays,
  getHeadcount,
  getTripCosts,
  getTripDestinationNames,
  getTripStatus,
} from "../../utils/tripUtils";

function getCountdown(departureDate) {
  const days = daysUntil(departureDate);
  if (days <= 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `In ${days} days`;
}

/**
 * One trip as a clickable row: title, destinations, dates, travellers,
 * status, estimated cost against budget, and an over-budget warning.
 * The whole row links to the trip's results page.
 *
 * Props
 *  trip            trip object (see data/sampleTrips.js)
 *  showCountdown   adds "In 21 days" for upcoming trips
 */
export default function TripRow({ trip, showCountdown = false }) {
  const costs = getTripCosts(trip);
  const status = getTripStatus(trip);
  const statusBadge = TRIP_STATUS_BADGES[status];
  const duration = getDurationDays(trip.departureDate, trip.returnDate);
  const headcount = getHeadcount(trip);

  return (
    <Link to={tripPath(trip.id)} className="trip-row">
      <div className="trip-row__main">
        <div className="trip-row__title-line">
          <h3 className="trip-row__title">{trip.title}</h3>
          {trip.saved && (
            <span className="trip-row__saved">
              <FiBookmark size={16} aria-hidden="true" />
              <span className="sr-only">Saved</span>
            </span>
          )}
        </div>

        <ul className="trip-row__meta">
          <li>
            <FiMapPin size={14} aria-hidden="true" />
            {getTripDestinationNames(trip) || "No destination"}
          </li>
          <li>
            <FiCalendar size={14} aria-hidden="true" />
            {formatDateRange(trip.departureDate, trip.returnDate)} ·{" "}
            {duration} {duration === 1 ? "day" : "days"}
          </li>
          <li>
            <FiUsers size={14} aria-hidden="true" />
            {headcount} {headcount === 1 ? "traveler" : "travelers"}
          </li>
        </ul>

        <div className="trip-row__badges">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {showCountdown && status === TRIP_STATUS.upcoming && (
            <Badge variant="primary">{getCountdown(trip.departureDate)}</Badge>
          )}
          {costs.isOverBudget && (
            <Badge variant="danger" icon={<FiAlertTriangle size={12} />}>
              Over budget by {formatCurrency(costs.overBy)}
            </Badge>
          )}
        </div>
      </div>

      <div className="trip-row__cost">
        <span className="trip-row__total">{formatCurrency(costs.total)}</span>
        <span className="trip-row__budget">
          estimated · budget {formatCurrency(trip.budget.total)}
        </span>
      </div>
    </Link>
  );
}