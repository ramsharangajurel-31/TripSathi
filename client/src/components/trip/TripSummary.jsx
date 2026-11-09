import {
  FiAlertTriangle,
  FiBookmark,
  FiCalendar,
  FiCreditCard,
  FiMapPin,
  FiNavigation,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { INTERESTS, getDestinationById } from "../../data/destinations";
import { TRIP_STATUS_BADGES } from "../../data/dashboardData";
import {
  ACCOMMODATION_OPTIONS,
  INTENSITY_OPTIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
  getOptionLabel,
} from "../../data/tripOptions";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange } from "../../utils/formatDate";
import { getDurationDays, getHeadcount, getTripCosts, getTripStatus } from "../../utils/tripUtils";

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };
const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);

function Fact({ icon, label, children, large = false }) {
  return (
    <div className="fact">
      <span className="fact__icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="fact__label">{label}</dt>
        <dd className={large ? "fact__value fact__value--large" : "fact__value"}>
          {children}
        </dd>
      </div>
    </div>
  );
}

/**
 * Overview card at the top of the results page: destinations, dates,
 * duration, travelers, estimated total and per-person cost, and the
 * preferences the itinerary was built from.
 *
 * The page's <h1> (the trip title) comes from the page header, so this card
 * uses an <h2>.
 *
 * Props
 *  trip     trip object
 *  actions  React node placed beside the heading (Save, Edit, Print ...)
 */
export default function TripSummary({ trip, actions }) {
  const costs = getTripCosts(trip);
  const status = TRIP_STATUS_BADGES[getTripStatus(trip)];
  const days = getDurationDays(trip.departureDate, trip.returnDate);
  const adults = trip.travelers?.adults || 0;
  const children = trip.travelers?.children || 0;
  const preferences = trip.preferences || {};

  const destinationNames = (trip.destinationIds || [])
    .map((id) => getDestinationById(id)?.name)
    .filter(Boolean);

  return (
    <Card>
      <div className="trip-summary__header">
        <div className="trip-summary__badges">
          <h2 className="sr-only">Trip overview</h2>
          <Badge variant={status.variant}>{status.label}</Badge>
          {trip.saved && (
            <Badge variant="primary" icon={<FiBookmark size={12} />}>
              Saved
            </Badge>
          )}
          {costs.isOverBudget && (
            <Badge variant="danger" icon={<FiAlertTriangle size={12} />}>
              Over budget by {formatCurrency(costs.overBy)}
            </Badge>
          )}
        </div>
        {actions}
      </div>

      <dl className="fact-grid">
        <Fact icon={<FiMapPin />} label="Destinations">
          {destinationNames.length > 0 ? destinationNames.join(" → ") : "—"}
        </Fact>
        <Fact icon={<FiNavigation />} label="Starting from">
          {trip.startingLocation || "—"}
        </Fact>
        <Fact icon={<FiCalendar />} label="Travel dates">
          {formatDateRange(trip.departureDate, trip.returnDate)}
          <span className="fact__sub">
            {days} {days === 1 ? "day" : "days"}
          </span>
        </Fact>
        <Fact icon={<FiUsers />} label="Travelers">
          {adults} {adults === 1 ? "adult" : "adults"}
          {children > 0 && `, ${children} ${children === 1 ? "child" : "children"}`}
          <span className="fact__sub">{getHeadcount(trip)} in total</span>
        </Fact>
        <Fact icon={<FiCreditCard />} label="Estimated total cost" large>
          {formatCurrency(costs.total)}
          <span className="fact__sub">
            Your budget: {formatCurrency(trip.budget?.total)}
          </span>
        </Fact>
        <Fact icon={<FiUser />} label="Estimated cost per person" large>
          {formatCurrency(costs.perPerson)}
          <span className="fact__sub">
            {TIER_LABELS[trip.budget?.category] || "Standard"} budget level
          </span>
        </Fact>
      </dl>

      <div className="trip-summary__preferences">
        <h3 className="trip-summary__preferences-title">Travel preferences</h3>
        <ul className="trip-summary__tags">
          {preferences.accommodation && (
            <li>
              <Badge variant="neutral">
                Stay: {getOptionLabel(ACCOMMODATION_OPTIONS, preferences.accommodation)}
              </Badge>
            </li>
          )}
          {preferences.transport && (
            <li>
              <Badge variant="neutral">
                Transport: {getOptionLabel(TRANSPORT_OPTIONS, preferences.transport)}
              </Badge>
            </li>
          )}
          {preferences.intensity && (
            <li>
              <Badge variant="neutral">
                Intensity: {getOptionLabel(INTENSITY_OPTIONS, preferences.intensity)}
              </Badge>
            </li>
          )}
          {preferences.pace && (
            <li>
              <Badge variant="neutral">
                Pace: {getOptionLabel(PACE_OPTIONS, preferences.pace)}
              </Badge>
            </li>
          )}
          {(trip.interests || []).map((id) => (
            <li key={id}>
              <Badge variant="primary">{INTEREST_LABELS[id] || id}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}