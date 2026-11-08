import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../hooks/useAuth";
import useLocalStorage, {
  readStorage,
  removeStorage,
  writeStorage,
} from "../hooks/useLocalStorage";
import {
  DEMO_USERS,
  ROLES,
  STORAGE_KEYS,
  USER_STATUS,
} from "../data/demoUsers";
import { normalizePhone } from "../utils/validation";

// ==========================================================================
// FRONTEND DEMONSTRATION AUTH. Not secure: passwords are kept in plain text
// in localStorage. In the backend phase this file keeps its public API but
// calls the server, which stores hashed passwords and returns JWT tokens.
// ==========================================================================

const INVALID_LOGIN = "Incorrect email or password.";
const INACTIVE_ACCOUNT =
  "This account is inactive. Please contact the administrator.";

// ---------- Session storage ----------
// "Remember me" ON  -> session in localStorage (survives closing the browser)
// "Remember me" OFF -> session in sessionStorage (ends with the browser tab)

function readSessionUserId() {
  const persistent = readStorage(STORAGE_KEYS.session, null);
  if (persistent && persistent.userId) return persistent.userId;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.session);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.userId ? parsed.userId : null;
  } catch {
    return null;
  }
}

function clearSession() {
  removeStorage(STORAGE_KEYS.session);
  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    // sessionStorage unavailable: nothing to clear
  }
}

function saveSession(userId, remember) {
  clearSession();

  if (remember) {
    writeStorage(STORAGE_KEYS.session, { userId });
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId }));
  } catch (error) {
    console.warn("TripSathi: could not save the session.", error);
  }
}

// ---------- Helpers ----------

const createId = () =>
  `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

// Never expose the password to components.
function toPublicUser(user) {
  const copy = { ...user };
  delete copy.password;
  return copy;
}

// ---------- Provider ----------

export default function AuthProvider({ children }) {
  const [storedUsers, setStoredUsers] = useLocalStorage(
    STORAGE_KEYS.users,
    DEMO_USERS
  );
  const [sessionUserId, setSessionUserId] = useState(readSessionUserId);
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingLogout, setPendingLogout] = useState(false);

  // Guard against hand-edited storage holding something that is not a list.
  const users = useMemo(
    () => (Array.isArray(storedUsers) ? storedUsers : DEMO_USERS),
    [storedUsers]
  );

  // First run: write the demo accounts to localStorage.
  useEffect(() => {
    if (readStorage(STORAGE_KEYS.users, null) === null) {
      writeStorage(STORAGE_KEYS.users, DEMO_USERS);
    }
  }, []);

  // Logging out (or in) in another tab updates this tab too.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.session || event.key === null) {
        setSessionUserId(readSessionUserId());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // The current user is derived from the users list, so profile edits and
  // admin changes (for example deactivating an account) apply immediately.
  const user = useMemo(() => {
    if (!sessionUserId) return null;
    const found = users.find((item) => item.id === sessionUserId);
    return found && found.status === USER_STATUS.active
      ? toPublicUser(found)
      : null;
  }, [users, sessionUserId]);

  // ---------- Actions ----------

  const login = useCallback(
    async (email, password, remember = false) => {
      const found = users.find(
        (item) => normalizeEmail(item.email) === normalizeEmail(email)
      );

      // Same message for "no such email" and "wrong password", so the form
      // cannot be used to discover which emails are registered.
      if (!found || found.password !== password) {
        return { ok: false, error: INVALID_LOGIN };
      }

      if (found.status !== USER_STATUS.active) {
        return { ok: false, error: INACTIVE_ACCOUNT };
      }

      saveSession(found.id, remember);
      setSessionUserId(found.id);
      return { ok: true, user: toPublicUser(found) };
    },
    [users]
  );

  const register = useCallback(
    async ({ fullName, email, phone, password }) => {
      const cleanEmail = normalizeEmail(email);

      if (users.some((item) => normalizeEmail(item.email) === cleanEmail)) {
        return {
          ok: false,
          field: "email",
          error: "An account with this email already exists.",
        };
      }

      const newUser = {
        id: createId(),
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: normalizePhone(phone),
        password,
        role: ROLES.user,
        status: USER_STATUS.active,
        location: "",
        createdAt: new Date().toISOString(),
      };

      setStoredUsers((previous) => [
        ...(Array.isArray(previous) ? previous : DEMO_USERS),
        newUser,
      ]);

      // New accounts are signed in for this browser session only.
      saveSession(newUser.id, false);
      setSessionUserId(newUser.id);
      return { ok: true, user: toPublicUser(newUser) };
    },
    [users, setStoredUsers]
  );

  // Logging out takes two steps: go to the home page FIRST, then clear the
  // session once the location has really changed. Clearing it earlier would
  // let the route guard of the page being left redirect to /login.
  const logout = useCallback(() => {
    setPendingLogout(true);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (pendingLogout && location.pathname === "/") {
      clearSession();
      setSessionUserId(null);
      setPendingLogout(false);
    }
  }, [pendingLogout, location.pathname]);
  const updateProfile = useCallback(
    async ({ fullName, email, phone, location }) => {
      if (!user) return { ok: false, error: "You need to be logged in." };

      const cleanEmail = normalizeEmail(email);
      const emailTaken = users.some(
        (item) =>
          item.id !== user.id && normalizeEmail(item.email) === cleanEmail
      );

      if (emailTaken) {
        return {
          ok: false,
          field: "email",
          error: "Another account already uses this email.",
        };
      }

      const changes = {
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: normalizePhone(phone),
        location: (location || "").trim(),
      };

      setStoredUsers((previous) =>
        (Array.isArray(previous) ? previous : DEMO_USERS).map((item) =>
          item.id === user.id ? { ...item, ...changes } : item
        )
      );

      return { ok: true, user: { ...user, ...changes } };
    },
    [user, users, setStoredUsers]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!user) return { ok: false, error: "You need to be logged in." };

      const stored = users.find((item) => item.id === user.id);
      if (!stored || stored.password !== currentPassword) {
        return {
          ok: false,
          field: "currentPassword",
          error: "Your current password is incorrect.",
        };
      }

      setStoredUsers((previous) =>
        (Array.isArray(previous) ? previous : DEMO_USERS).map((item) =>
          item.id === user.id ? { ...item, password: newPassword } : item
        )
      );

      return { ok: true };
    },
    [user, users, setStoredUsers]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user ? user.role === ROLES.admin : false,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, login, register, logout, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}