import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiMapPin, FiStar } from "react-icons/fi";

import SafeImage from "../common/SafeImage";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import {
  ESTIMATE_DISCLAIMER,
  INTERESTS,
  getDailyCost,
  getPopularDestinations,
} from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";

const INTEREST_LABELS = Object.fromEntries(
  INTERESTS.map((interest) => [interest.id, interest.label])
);

const MAX_TAGS = 3;

function DestinationCard({ destination }) {
  const startingCost = getDailyCost(destination, "budget");
  const tags = destination.interests.slice(0, MAX_TAGS);

  return (
    <Card
      as={Link}
      to={`/dashboard/create-trip?destination=${destination.id}`}
      hover
      padded={false}
      className="destination-card"
      aria-label={`Plan a trip to ${destination.name}`}
      media={
        <>
          <SafeImage
            src={destination.image}
            alt={`${destination.name}, Nepal`}
            fallbackLabel={destination.name}
          />
          <span className="destination-card__rating">
            <FiStar size={12} aria-hidden="true" />
            <span className="sr-only">Rated </span>
            {destination.rating.toFixed(1)}
          </span>
        </>
      }
    >
      <div className="destination-card__body">
        <h3 className="destination-card__name">{destination.name}</h3>
        <p className="destination-card__province">
          <FiMapPin size={14} aria-hidden="true" />
          {destination.province}
        </p>
        <p className="destination-card__tagline">{destination.tagline}</p>

        <div className="destination-card__tags">
          {tags.map((id) => (
            <Badge key={id} variant="primary">
              {INTEREST_LABELS[id] || id}
            </Badge>
          ))}
        </div>

        <div className="destination-card__footer">
          <span className="destination-card__price">
            <small>From </small>
            {formatCurrency(startingCost)}
            <small> / person / day</small>
          </span>
          <span className="destination-card__days">
            <FiClock size={14} aria-hidden="true" />
            {destination.recommendedDays} days
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * "Popular destinations" section of the home page.
 * Data: destinations flagged `popular` in data/destinations.js.
 * The section id lets the navbar link "/#destinations" scroll here.
 */
export default function PopularDestinations() {
  const popular = getPopularDestinations();

  if (popular.length === 0) return null;

  return (
    <section id="destinations" className="section" aria-labelledby="popular-title">
      <div className="container">
        <div className="section-header">
          <span className="section-header__eyebrow">Popular destinations</span>
          <h2 id="popular-title" className="section-header__title">
            Where travelers start in Nepal
          </h2>
          <p className="section-header__subtitle">
            Well-loved places with good facilities, ideal for a first itinerary.
            Select one to begin planning.
          </p>
        </div>

        <ul className="destination-grid">
          {popular.map((destination) => (
            <li key={destination.id}>
              <DestinationCard destination={destination} />
            </li>
          ))}
        </ul>

        <p className="estimate-note">{ESTIMATE_DISCLAIMER}</p>

        <div className="section-footer">
          <Button
            to="/dashboard/create-trip"
            variant="secondary"
            rightIcon={<FiArrowRight />}
          >
            Plan a custom trip
          </Button>
        </div>
      </div>
    </section>
  );
}