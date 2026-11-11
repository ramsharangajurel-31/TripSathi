import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { ADMIN_PATHS } from "../../data/adminNavigation";
import { ROLES, USER_STATUS } from "../../data/demoUsers";
import { formatDate, toISODate } from "../../utils/formatDate";
import getInitials from "../../utils/getInitials";

/**
 * The newest accounts, with role, status and join date.
 * Props: users (already sorted and limited by the page)
 */
export default function RecentUsers({ users }) {
  return (
    <Card
      title="Recent users"
      headingLevel="h2"
      padded={false}
      actions={
        <Button to={ADMIN_PATHS.users} variant="ghost" size="sm">
          View all users
        </Button>
      }
    >
      {users.length === 0 ? (
        <p className="admin-chart__empty">No users yet.</p>
      ) : (
        <ul className="person-list">
          {users.map((user) => (
            <li key={user.id} className="person">
              <span className="avatar" aria-hidden="true">
                {getInitials(user.fullName)}
              </span>

              <div className="person__main">
                <p className="person__name">{user.fullName}</p>
                <p className="person__email">{user.email}</p>
                <p className="person__date">
                  Joined {formatDate(toISODate(new Date(user.createdAt)))}
                </p>
              </div>

              <div className="person__badges">
                <Badge variant={user.role === ROLES.admin ? "primary" : "neutral"}>
                  {user.role === ROLES.admin ? "Administrator" : "Traveler"}
                </Badge>
                <Badge variant={user.status === USER_STATUS.active ? "success" : "danger"}>
                  {user.status === USER_STATUS.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}