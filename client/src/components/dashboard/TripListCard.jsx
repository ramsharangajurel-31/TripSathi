import Card from "../ui/Card";
import EmptyState from "../common/EmptyState";
import TripRow from "../trip/TripRow";

/**
 * A card holding a list of trips, or an empty state when there are none.
 *
 * Props
 *  title          card heading
 *  trips          array of trips
 *  showCountdown  passed to each row
 *  actions        React node in the card header (e.g. a "View all" button)
 *  empty          props for EmptyState: { icon, title, message,
 *                 actionLabel, actionTo }
 */
export default function TripListCard({
  title,
  trips,
  showCountdown = false,
  actions,
  empty,
}) {
  return (
    <Card title={title} headingLevel="h2" actions={actions} padded={false}>
      {trips.length === 0 ? (
        <div className="card__body">
          <EmptyState {...empty} />
        </div>
      ) : (
        <ul className="trip-list">
          {trips.map((trip) => (
            <li key={trip.id}>
              <TripRow trip={trip} showCountdown={showCountdown} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}