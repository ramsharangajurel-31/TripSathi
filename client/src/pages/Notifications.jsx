import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiBell, FiCheckCircle } from "react-icons/fi";

import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import NotificationItem from "../components/dashboard/NotificationItem";
import useNotifications from "../hooks/useNotifications";
import usePageTitle from "../hooks/usePageTitle";
import classNames from "../utils/classNames";
import { DASHBOARD_PATHS } from "../data/dashboardData";

/**
 * Notifications page: filter (All / Unread), mark as read, mark all as read
 * and delete with confirmation. Data and actions come from useNotifications.
 */
export default function Notifications() {
  usePageTitle("Notifications");

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);

  const visible = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((item) => !item.read)
        : notifications,
    [notifications, filter]
  );

  const filters = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
  ];

  const handleMarkAll = () => {
    markAllAsRead();
    toast.success("All notifications marked as read.");
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteNotification(pendingDelete.id);
    setPendingDelete(null);
    toast.info("Notification deleted.");
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `You have ${unreadCount} unread ${
                unreadCount === 1 ? "notification" : "notifications"
              }.`
            : "You are all caught up."
        }
        breadcrumbs={[
          { label: "Dashboard", to: DASHBOARD_PATHS.home },
          { label: "Notifications" },
        ]}
        actions={
          notifications.length > 0 && (
            <Button
              variant="secondary"
              leftIcon={<FiCheckCircle />}
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<FiBell />}
          title="No notifications"
          message="Updates about your trips, budgets and tips will appear here."
          actionLabel="Create a trip"
          actionTo={DASHBOARD_PATHS.createTrip}
        />
      ) : (
        <>
          <div className="filter-tabs" role="group" aria-label="Filter notifications">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={classNames("filter-tab", filter === item.id && "is-active")}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
                <span className="filter-tab__count">{item.count}</span>
              </button>
            ))}
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            Showing {visible.length}{" "}
            {visible.length === 1 ? "notification" : "notifications"}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={<FiCheckCircle />}
              title="No unread notifications"
              message="You have read everything. Nice work."
              actionLabel="Show all notifications"
              onAction={() => setFilter("all")}
            />
          ) : (
            <Card padded={false}>
              <ul className="notification-list">
                {visible.map((item) => (
                  <li key={item.id}>
                    <NotificationItem
                      notification={item}
                      onMarkRead={markAsRead}
                      onDelete={setPendingDelete}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this notification?"
        message="It will be removed from your list. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}