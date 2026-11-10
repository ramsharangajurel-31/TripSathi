import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { DASHBOARD_PATHS } from "../../data/dashboardData";
import {
  ALTERNATIVES_DISCLAIMER,
  getAlternatives,
} from "../../utils/alternativeUtils";

function AltItem({ kicker, title, description, reason, action }) {
  return (
    <li className="alt-item">
      {kicker && <p className="alt-item__kicker">{kicker}</p>}
      <h4 className="alt-item__title">{title}</h4>
      {description && <p className="alt-item__text">{description}</p>}
      <p className="alt-item__reason">{reason}</p>
      {action}
    </li>
  );
}

function Group({ title, text, children }) {
  return (
    <section className="alt-group" aria-label={title}>
      <h3 className="alt-group__title">{title}</h3>
      {text && <p className="alt-group__text">{text}</p>}
      {children}
    </section>
  );
}

/**
 * Alternatives for a trip: cheaper activity swaps, more activities that
 * match the interests, other attractions in the same places, similar
 * destinations, and cheaper accommodation. Each suggestion says WHY it
 * might help (lower cost, shorter travel, matching interest).
 *
 * Groups with nothing to suggest are left out. Suggestions are read-only
 * here; changes are made in the itinerary editor.
 */
export default function AlternativeSuggestions({ trip }) {
  const alternatives = getAlternatives(trip);
  const { swaps, explore } = alternatives.activities;
  const { attractions, destinations, accommodation } = alternatives;

  const isEmpty =
    swaps.length === 0 &&
    explore.length === 0 &&
    attractions.length === 0 &&
    destinations.length === 0 &&
    accommodation.length === 0;

  return (
    <Card title="Alternatives and suggestions" headingLevel="h2">
      {isEmpty ? (
        <p className="results-note">
          No alternatives were found. This plan already uses the lower-cost
          options that fit your interests.
        </p>
      ) : (
        <>
          {swaps.length > 0 && (
            <Group
              title="Lower-cost activity swaps"
              text="Swap a paid activity for a cheaper one in the same place."
            >
              <ul className="alt-list">
                {swaps.map((item) => (
                  <AltItem
                    key={item.id}
                    kicker={`Instead of ${item.replaces}`}
                    title={item.title}
                    description={item.description}
                    reason={item.reason}
                  />
                ))}
              </ul>
            </Group>
          )}

          {explore.length > 0 && (
            <Group
              title="More activities you may like"
              text="Matching your interests, and not yet in your plan."
            >
              <ul className="alt-list">
                {explore.map((item) => (
                  <AltItem
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    reason={item.reason}
                  />
                ))}
              </ul>
            </Group>
          )}

          {attractions.length > 0 && (
            <Group
              title="Well-known places in your destinations"
              text="Other places worth knowing about while you are there."
            >
              <ul className="alt-places">
                {attractions.map((item) => (
                  <li key={item.id}>
                    <p className="alt-places__name">In {item.destinationName}</p>
                    <ul className="review-tags">
                      {item.places.map((place) => (
                        <li key={place}>
                          <Badge variant="neutral">{place}</Badge>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Group>
          )}

          {destinations.length > 0 && (
            <Group
              title="Similar destinations"
              text="Places that match your interests and are cheaper per day or closer to your starting city."
            >
              <ul className="alt-list">
                {destinations.map((item) => (
                  <AltItem
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    reason={item.reason}
                    action={
                      <Button
                        to={`${DASHBOARD_PATHS.createTrip}?destination=${item.destinationId}`}
                        variant="secondary"
                        size="sm"
                      >
                        Plan a trip here
                      </Button>
                    }
                  />
                ))}
              </ul>
            </Group>
          )}

          {accommodation.length > 0 && (
            <Group
              title="Lower-cost accommodation"
              text="A different type of stay for the same nights."
            >
              <ul className="alt-list">
                {accommodation.map((item) => (
                  <AltItem
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    reason={item.reason}
                  />
                ))}
              </ul>
            </Group>
          )}
        </>
      )}

      <p className="cost-notes">{ALTERNATIVES_DISCLAIMER}</p>
    </Card>
  );
}