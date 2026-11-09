import { Link } from "react-router-dom";
import { FiBookmark, FiPlusCircle, FiUser } from "react-icons/fi";

import { QUICK_ACTIONS } from "../../data/dashboardData";
import classNames from "../../utils/classNames";

const ICONS = {
  create: <FiPlusCircle />,
  saved: <FiBookmark />,
  profile: <FiUser />,
};

/** Large action cards driven by QUICK_ACTIONS in data/dashboardData.js. */
export default function QuickActions() {
  return (
    <section className="dashboard-section" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="sr-only">
        Quick actions
      </h2>

      <ul className="quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <li key={action.id}>
            <Link
              to={action.to}
              className={classNames(
                "quick-action",
                action.primary && "quick-action--primary"
              )}
            >
              <span className="quick-action__icon" aria-hidden="true">
                {ICONS[action.icon]}
              </span>
              <span>
                <span className="quick-action__title">{action.title}</span>
                <span className="quick-action__text">{action.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}