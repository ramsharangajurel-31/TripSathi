// ==========================================================================
// TripSathi – Demo users and storage keys
//
// FRONTEND DEMONSTRATION ONLY.
// These accounts, and the way passwords are kept in localStorage, are NOT
// secure and must never be used in production. When the backend phase
// starts, this file is deleted: the server will store hashed passwords and
// issue JWT tokens, and the frontend will never see a password again.
//
// AuthContext seeds localStorage with DEMO_USERS the first time the app
// runs. The admin "Manage Users" page (Phase 7) edits the same list.
// ==========================================================================

// Every localStorage key the app uses, in one place.
export const STORAGE_KEYS = {
  users: "tripsathi.users",
  session: "tripsathi.session",
  trips: "tripsathi.trips",
  notifications: "tripsathi.notifications",
  tripDraft: "tripsathi.tripDraft", // one draft per user: "tripsathi.tripDraft.<userId>"
};

export const ROLES = {
  user: "user",
  admin: "admin",
};

export const USER_STATUS = {
  active: "active",
  inactive: "inactive",
};

export const DEMO_USERS = [
  {
    id: "u-demo",
    fullName: "Demo Traveler",
    email: "demo@tripsathi.com",
    phone: "9800000001",
    password: "Demo@1234",
    role: ROLES.user,
    status: USER_STATUS.active,
    location: "Kathmandu, Nepal",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "u-admin",
    fullName: "TripSathi Admin",
    email: "admin@tripsathi.com",
    phone: "9800000002",
    password: "Admin@1234",
    role: ROLES.admin,
    status: USER_STATUS.active,
    location: "Kathmandu, Nepal",
    createdAt: "2026-01-01T09:00:00.000Z",
  },
];

// Shown in the README and in the demo-accounts note on the Login page.
export const DEMO_CREDENTIALS = [
  {
    label: "Traveler",
    email: "demo@tripsathi.com",
    password: "Demo@1234",
    opens: "User dashboard",
  },
  {
    label: "Admin",
    email: "admin@tripsathi.com",
    password: "Admin@1234",
    opens: "Admin panel",
  },
];