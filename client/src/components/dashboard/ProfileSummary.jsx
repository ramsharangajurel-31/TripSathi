import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";

import Button from "../ui/Button";
import Card from "../ui/Card";
import { DASHBOARD_PATHS } from "../../data/dashboardData";
import getInitials from "../../utils/getInitials";

/** Compact account card for the dashboard sidebar column. */
export default function ProfileSummary({ user }) {
  return (
    <Card title="Your profile" headingLevel="h2">
      <div className="profile-summary__top">
        <span className="avatar" aria-hidden="true">
          {getInitials(user.fullName)}
        </span>
        <p className="profile-summary__name">{user.fullName}</p>
      </div>

      <ul className="profile-summary__list">
        <li className="profile-summary__row">
          <FiMail size={16} aria-hidden="true" />
          <span>
            <span className="sr-only">Email: </span>
            {user.email}
          </span>
        </li>
        <li className="profile-summary__row">
          <FiPhone size={16} aria-hidden="true" />
          <span>
            <span className="sr-only">Phone: </span>
            {user.phone || "Not set"}
          </span>
        </li>
        <li className="profile-summary__row">
          <FiMapPin size={16} aria-hidden="true" />
          <span>
            <span className="sr-only">Location: </span>
            {user.location || "Not set"}
          </span>
        </li>
      </ul>

      <Button to={DASHBOARD_PATHS.profile} variant="secondary" size="sm" block>
        Edit profile
      </Button>
    </Card>
  );
}