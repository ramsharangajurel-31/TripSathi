import { Link } from "react-router-dom";
import { FiBell, FiBookmark, FiCalendar, FiMap } from "react-icons/fi";

import { DASHBOARD_PATHS } from "../../data/dashboardData";

/**
 * Four statistic cards. Cards with a destination are links.
 * Values are passed in, so this component has no data logic of its own.
 */
export default function DashboardStats({
  totalTrips,
  savedTrips,
  upcomingTrips,
  unreadNotifications,
}) {
  const stats = [
    { id: "total", label: "Trips created", value: totalTrips, icon: <FiMap /> },
    {
      id: "saved",
      label: "Saved trips",
      value: savedTrips,
      icon: <FiBookmark />,
      to: DASHBOARD_PATHS.savedTrips,
    },
    {
      id: "upcoming",
      label: "Upcoming trips",
      value: upcomingTrips,
      icon: <FiCalendar />,
    },
    {
      id: "unread",
      label: "Unread notifications",
      value: unreadNotifications,
      icon: <FiBell />,
      to: DASHBOARD_PATHS.notifications,
    },
  ];

  return (
    <ul className="stats-grid" aria-label="Your trip statistics">
      {stats.map((stat) => {
        const content = (
          <>
            <span className="stat-card__icon" aria-hidden="true">
              {stat.icon}
            </span>
            <span>
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
            </span>
          </>
        );

        return (
          <li key={stat.id}>
            {stat.to ? (
              <Link to={stat.to} className="stat-card">
                {content}
              </Link>
            ) : (
              <div className="stat-card">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}