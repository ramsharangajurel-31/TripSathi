import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBell,
  FiCheck,
  FiMap,
  FiTrash2,
  FiZap,
} from "react-icons/fi";

import Badge from "../ui/Badge";
import Button from "../ui/Button";
import classNames from "../../utils/classNames";
import { NOTIFICATION_TYPES } from "../../data/notifications";
import { formatRelativeTime } from "../../utils/formatDate";

// NOTIFICATION_TYPES refers to icons by key.
const ICONS = {
  trip: <FiMap />,
  budget: <FiAlertTriangle />,
  tip: <FiZap />,
  system: <FiBell />,
};

/**
 * One notification row.
 *
 * Unread is shown three ways, so colour is never the only signal:
 * a tinted background with an accent bar, a dot, and hidden text
 * "Unread:" for screen readers.
 *
 * Props
 *  notification   { id, type, title, message, link, createdAt, read }
 *  onMarkRead     function(id)
 *  onDelete       function(notification), the page asks for confirmation
 */
export default function NotificationItem({ notification, onMarkRead, onDelete }) {
  const { id, type, title, message, link, createdAt, read } = notification;
  const typeInfo = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;

  return (
    <article className={classNames("notification", !read && "is-unread")}>
      <span className="notification__icon" aria-hidden="true">
        {ICONS[typeInfo.icon] || ICONS.system}
      </span>

      <div className="notification__body">
        <div className="notification__title-line">
          {!read && <span className="notification__dot" aria-hidden="true" />}
          <h3 className="notification__title">
            {!read && <span className="sr-only">Unread: </span>}
            {title}
          </h3>
        </div>

        <p className="notification__message">{message}</p>

        <div className="notification__meta">
          <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
          <time dateTime={createdAt}>{formatRelativeTime(createdAt)}</time>
        </div>
      </div>

      <div className="notification__actions">
        {link && (
          <Button
            to={link}
            variant="secondary"
            size="sm"
            rightIcon={<FiArrowRight />}
            onClick={() => !read && onMarkRead(id)}
          >
            View
          </Button>
        )}

        {!read && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FiCheck />}
            onClick={() => onMarkRead(id)}
          >
            Mark as read
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => onDelete(notification)}
          aria-label={`Delete notification: ${title}`}
        >
          <FiTrash2 aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}