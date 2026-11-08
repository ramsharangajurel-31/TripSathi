import { Link } from "react-router-dom";
import { FiCalendar, FiClock } from "react-icons/fi";

import SafeImage from "../common/SafeImage";
import classNames from "../../utils/classNames";
import { getFeaturedDestinations } from "../../data/destinations";

/**
 * "Featured destinations" section: large image cards with a text overlay.
 * Data: destinations flagged `featured` in data/destinations.js.
 *
 * Layout rule: the grid has 3 columns. When the number of cards leaves two
 * in the last row (count % 3 === 2), the first card is made double-width so
 * no row has a gap. Otherwise all cards are equal width.
 */
export default function FeaturedDestinations() {
  const featured = getFeaturedDestinations();

  if (featured.length === 0) return null;

  const useWideFirst = featured.length % 3 === 2;

  return (
    <section className="section section--muted" aria-labelledby="featured-title">
      <div className="container">
        <div className="section-header">
          <span className="section-header__eyebrow">Featured destinations</span>
          <h2 id="featured-title" className="section-header__title">
            Beyond the usual route
          </h2>
          <p className="section-header__subtitle">
            Hill towns, high-altitude deserts and trekking regions for travelers
            who want something different.
          </p>
        </div>

        <div className="featured-grid">
          {featured.map((destination, index) => (
            <Link
              key={destination.id}
              to={`/dashboard/create-trip?destination=${destination.id}`}
              className={classNames(
                "featured-card",
                useWideFirst && index === 0 && "featured-card--wide"
              )}
              aria-label={`Plan a trip to ${destination.name}`}
            >
              <div className="featured-card__media">
                <SafeImage
                  src={destination.image}
                  alt={`${destination.name}, Nepal`}
                  fallbackLabel={destination.name}
                />
              </div>
              <div className="featured-card__overlay" aria-hidden="true" />

              <div className="featured-card__content">
                <h3 className="featured-card__name">{destination.name}</h3>
                <p className="featured-card__text">{destination.tagline}</p>
                <div className="featured-card__meta">
                  <span>
                    <FiCalendar size={14} aria-hidden="true" />
                    {destination.bestSeason}
                  </span>
                  <span>
                    <FiClock size={14} aria-hidden="true" />
                    {destination.recommendedDays} days suggested
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}