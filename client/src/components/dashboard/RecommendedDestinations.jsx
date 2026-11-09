import { Link } from "react-router-dom";

import Card from "../ui/Card";
import SafeImage from "../common/SafeImage";
import { DASHBOARD_PATHS } from "../../data/dashboardData";

/**
 * Destinations the user has not planned yet, ranked by matching interests
 * (see utils/recommendations.js). Each item opens the trip wizard with the
 * destination preselected (the wizard reads ?destination= in Phase 4).
 */
export default function RecommendedDestinations({ recommendations }) {
  if (recommendations.length === 0) return null;

  return (
    <Card title="Recommended for you" headingLevel="h2" padded={false}>
      <ul className="reco-list">
        {recommendations.map(({ destination, matchedInterests }) => (
          <li key={destination.id}>
            <Link
              to={`${DASHBOARD_PATHS.createTrip}?destination=${destination.id}`}
              className="reco-item"
              aria-label={`Plan a trip to ${destination.name}`}
            >
              <span className="reco-item__media">
                <SafeImage src={destination.image} alt="" />
              </span>
              <span>
                <span className="reco-item__name">{destination.name}</span>
                <span className="reco-item__text">
                  {matchedInterests.length > 0
                    ? `Matches your interests: ${matchedInterests
                        .slice(0, 3)
                        .join(", ")}`
                    : "A good place to start"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}