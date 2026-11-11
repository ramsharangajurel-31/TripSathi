import { useCallback, useMemo } from "react";

import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";
import SEED_NOTIFICATIONS from "../data/notifications";
import SAMPLE_TRIPS from "../data/sampleTrips";
import { DEMO_USERS, STORAGE_KEYS, USER_STATUS } from "../data/demoUsers";

// Passwords never leave this hook: admin pages only see the public fields.
function toPublicUser(user, tripCount) {
  const copy = { ...user, tripCount };
  delete copy.password;
  return copy;
}

/**
 * The real list of accounts, for the admin "Manage users" page.
 *
 *   const { users, setUserStatus, deleteUser } = useAdminUsers();
 *
 *  users                  every account WITHOUT its password, each with a
 *                         `tripCount`
 *  setUserStatus(id, status)  "active" or "inactive". Returns
 *                         { ok: true } or { ok: false, error }
 *  deleteUser(id)         removes the account together with its trips and
 *                         notifications. Returns { ok: true, removedTrips }
 *                         or { ok: false, error }
 *
 * Rule: an administrator cannot deactivate or delete their own account, so
 * the admin panel can never lock everyone out.
 *
 * This changes the SAME account list the login page uses, so deactivating a
 * user takes effect for real: that person can no longer log in, and a
 * session that is already open ends.
 */
export default function useAdminUsers() {
  const { user: currentUser } = useAuth();

  const [storedUsers, setStoredUsers] = useLocalStorage(STORAGE_KEYS.users, DEMO_USERS);
  const [storedTrips, setStoredTrips] = useLocalStorage(STORAGE_KEYS.trips, SAMPLE_TRIPS);
  const [, setStoredNotifications] = useLocalStorage(
    STORAGE_KEYS.notifications,
    SEED_NOTIFICATIONS
  );

  const trips = useMemo(
    () => (Array.isArray(storedTrips) ? storedTrips : SAMPLE_TRIPS),
    [storedTrips]
  );

  const users = useMemo(() => {
    const list = Array.isArray(storedUsers) ? storedUsers : DEMO_USERS;

    const tripCounts = {};
    trips.forEach((trip) => {
      tripCounts[trip.userId] = (tripCounts[trip.userId] || 0) + 1;
    });

    return list.map((user) => toPublicUser(user, tripCounts[user.id] || 0));
  }, [storedUsers, trips]);

  const isSelf = useCallback((id) => Boolean(currentUser) && currentUser.id === id, [currentUser]);

  const setUserStatus = useCallback(
    (id, status) => {
      if (!Object.values(USER_STATUS).includes(status)) {
        return { ok: false, error: "Unknown status." };
      }
      if (isSelf(id)) {
        return { ok: false, error: "You cannot change the status of your own account." };
      }
      if (!users.some((user) => user.id === id)) {
        return { ok: false, error: "This account no longer exists." };
      }

      setStoredUsers((previous) =>
        (Array.isArray(previous) ? previous : DEMO_USERS).map((user) =>
          user.id === id ? { ...user, status } : user
        )
      );
      return { ok: true };
    },
    [isSelf, users, setStoredUsers]
  );

  const deleteUser = useCallback(
    (id) => {
      if (isSelf(id)) {
        return { ok: false, error: "You cannot delete your own account." };
      }
      if (!users.some((user) => user.id === id)) {
        return { ok: false, error: "This account no longer exists." };
      }

      let removedTrips = 0;

      setStoredUsers((previous) =>
        (Array.isArray(previous) ? previous : DEMO_USERS).filter((user) => user.id !== id)
      );
      setStoredTrips((previous) => {
        const list = Array.isArray(previous) ? previous : SAMPLE_TRIPS;
        const next = list.filter((trip) => trip.userId !== id);
        removedTrips = list.length - next.length;
        return next;
      });
      setStoredNotifications((previous) =>
        (Array.isArray(previous) ? previous : SEED_NOTIFICATIONS).filter(
          (item) => item.userId !== id
        )
      );

      return { ok: true, removedTrips };
    },
    [isSelf, users, setStoredUsers, setStoredTrips, setStoredNotifications]
  );

    return { users, allTrips: trips, setUserStatus, deleteUser };
}