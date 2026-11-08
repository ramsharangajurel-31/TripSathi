import { useCallback, useMemo } from "react";

import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";
import SEED_NOTIFICATIONS from "../data/notifications";
import { STORAGE_KEYS } from "../data/demoUsers";

const createNotificationId = () =>
  `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * The signed-in user's notifications, with actions to change them.
 *
 *   const { notifications, unreadCount, markAsRead, markAllAsRead,
 *           deleteNotification, addNotification } = useNotifications();
 *
 *  notifications       this user's notifications, newest first
 *  unreadCount         number of unread notifications (for the badge)
 *  markAsRead(id)
 *  markAllAsRead()
 *  deleteNotification(id)
 *  addNotification({ type, title, message, link })
 *                      for events the app creates itself, such as "trip
 *                      saved". type is one of NOTIFICATION_TYPES.
 *
 * Storage works like useTrips: one shared list ("tripsathi.notifications"),
 * and every action touches only the current user's entries. New accounts
 * start with an empty list.
 */
export default function useNotifications() {
  const { user } = useAuth();
  const userId = user ? user.id : null;

  const [stored, setStored] = useLocalStorage(
    STORAGE_KEYS.notifications,
    SEED_NOTIFICATIONS
  );

  const all = useMemo(
    () => (Array.isArray(stored) ? stored : SEED_NOTIFICATIONS),
    [stored]
  );

  const notifications = useMemo(
    () =>
      all
        .filter((item) => item.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [all, userId]
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const mutate = useCallback(
    (updater) => {
      setStored((previous) =>
        updater(Array.isArray(previous) ? previous : SEED_NOTIFICATIONS)
      );
    },
    [setStored]
  );

  const markAsRead = useCallback(
    (notificationId) => {
      if (!userId) return;
      mutate((list) =>
        list.map((item) =>
          item.id === notificationId && item.userId === userId
            ? { ...item, read: true }
            : item
        )
      );
    },
    [userId, mutate]
  );

  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    mutate((list) =>
      list.map((item) =>
        item.userId === userId && !item.read ? { ...item, read: true } : item
      )
    );
  }, [userId, mutate]);

  const deleteNotification = useCallback(
    (notificationId) => {
      if (!userId) return;
      mutate((list) =>
        list.filter(
          (item) => !(item.id === notificationId && item.userId === userId)
        )
      );
    },
    [userId, mutate]
  );

  const addNotification = useCallback(
    ({ type = "system", title, message, link = null }) => {
      if (!userId) return null;

      const notification = {
        id: createNotificationId(),
        userId,
        type,
        title,
        message,
        link,
        createdAt: new Date().toISOString(),
        read: false,
      };

      mutate((list) => [notification, ...list]);
      return notification;
    },
    [userId, mutate]
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}