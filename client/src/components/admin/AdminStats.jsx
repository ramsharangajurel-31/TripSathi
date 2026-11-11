import { Link } from "react-router-dom";

/**
 * Statistic cards for the admin overview. Cards with a `to` are links to the
 * matching management page.
 *
 * Props
 *  stats   [{ id, label, value, hint?, icon, to? }]
 */
export default function AdminStats({ stats }) {
  return (
    <ul className="stats-grid stats-grid--auto" aria-label="System statistics">
      {stats.map((stat) => {
        const content = (
          <>
            <span className="stat-card__icon" aria-hidden="true">
              {stat.icon}
            </span>
            <span>
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
              {stat.hint && <span className="stat-card__hint">{stat.hint}</span>}
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