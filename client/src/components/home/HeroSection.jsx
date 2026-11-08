import { FiCompass } from "react-icons/fi";

import SafeImage from "../common/SafeImage";
import Button from "../ui/Button";
import SearchTrip from "./SearchTrip";
import destinations, {
  BUDGET_TIERS,
  INTERESTS,
} from "../../data/destinations";

// Optional background photo. Put a landscape image at
// client/public/images/hero.jpg (about 1600 px wide, under 400 KB).
// If the file is missing, the solid navy hero is shown instead.
const HERO_IMAGE = "/images/hero.jpg";

/**
 * Landing page hero: headline, supporting text, primary actions, key facts
 * and the natural-language trip box.
 */
export default function HeroSection() {
  const stats = [
    { value: destinations.length, label: "Destinations across Nepal" },
    { value: INTERESTS.length, label: "Travel interests" },
    { value: BUDGET_TIERS.length, label: "Budget levels" },
  ];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        <SafeImage src={HERO_IMAGE} alt="" priority />
      </div>
      <div className="hero__overlay" aria-hidden="true" />

      <div className="container hero__inner">
        <div>
          <p className="hero__eyebrow">
            <FiCompass aria-hidden="true" />
            Your Intelligent Travel Companion
          </p>

          <h1 id="hero-title" className="hero__title">
            Plan your perfect trip across <span>Nepal</span>
          </h1>

          <p className="hero__text">
            Tell TripSathi your budget, dates and interests. It builds a
            day-by-day itinerary with a clear cost breakdown, so you can compare
            options and decide with confidence.
          </p>

          <div className="hero__actions">
            <Button to="/dashboard/create-trip" variant="accent" size="lg">
              Plan your trip
            </Button>
            <Button to="/#destinations" variant="outline-light" size="lg">
              Explore destinations
            </Button>
          </div>

          <dl className="hero__stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="hero__stat-value">{stat.value}</dd>
                <dd className="hero__stat-label" aria-hidden="true">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <SearchTrip />
      </div>
    </section>
  );
}