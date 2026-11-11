import { FiMap, FiUserPlus } from "react-icons/fi";

import Card from "../ui/Card";
import { formatRelativeTime } from "../../utils/formatDate";

const ICONS = { user: <FiUserPlus />, trip: <FiMap /> };

/**
 * Feed of recent events. Props: events from getRecentActivity().
 * It is built from account and trip creation dates, and says so.
 */
export default function RecentActivity({ events }) {
  return (
    <Card title="Recent activity" headingLevel="h2" padded={false}>
      {events.length === 0 ? (
        <p className="admin-chart__empty">Nothing has happened yet.</p>
      ) : (
        <ul className="feed">
          {events.map((event) => (
            <li key={event.id} className="feed__item">
              <span className="feed__icon" aria-hidden="true">
                {ICONS[event.type]}
              </span>
              <div>
                <p className="feed__text">{event.text}</p>
                <time className="feed__time" dateTime={event.time}>
                  {formatRelativeTime(event.time)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="feed__note">
        Built from account and trip creation dates. This demonstration does not
        keep a separate activity log.
      </p>
    </Card>
  );
}