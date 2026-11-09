import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { ROLES, USER_STATUS } from "../../data/demoUsers";
import { formatDate, toISODate } from "../../utils/formatDate";
import getInitials from "../../utils/getInitials";

/**
 * Identity card and account information.
 * Read-only: nothing here can be edited.
 */
export default function AccountSummary({ user }) {
  const memberSince = formatDate(toISODate(new Date(user.createdAt)));
  const isActive = user.status === USER_STATUS.active;

  return (
    <Card>
      <div className="account-summary__top">
        <span className="avatar avatar--lg" aria-hidden="true">
          {getInitials(user.fullName)}
        </span>
        <h2 className="account-summary__name">{user.fullName}</h2>
        <p className="account-summary__email">{user.email}</p>
      </div>

      <h3 className="account-summary__heading">Account information</h3>
      <dl className="info-list">
        <div className="info-list__row">
          <dt>Account type</dt>
          <dd>{user.role === ROLES.admin ? "Administrator" : "Traveler"}</dd>
        </div>
        <div className="info-list__row">
          <dt>Status</dt>
          <dd>
            <Badge variant={isActive ? "success" : "danger"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </dd>
        </div>
        <div className="info-list__row">
          <dt>Member since</dt>
          <dd>{memberSince}</dd>
        </div>
      </dl>
    </Card>
  );
}