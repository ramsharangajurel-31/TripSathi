// Routes and sidebar menu of the admin panel. Icons are referenced by key;
// AdminSidebar maps each key to an icon.

import { ADMIN_HOME } from "../utils/authRedirect";

export const ADMIN_PATHS = {
  home: ADMIN_HOME, // "/admin"
  destinations: `${ADMIN_HOME}/destinations`,
  attractions: `${ADMIN_HOME}/attractions`,
  activities: `${ADMIN_HOME}/activities`,
  users: `${ADMIN_HOME}/users`,
};

export const ADMIN_NAV = [
  { label: "Overview", to: ADMIN_PATHS.home, icon: "overview", end: true },
  { label: "Destinations", to: ADMIN_PATHS.destinations, icon: "destinations" },
  { label: "Attractions", to: ADMIN_PATHS.attractions, icon: "attractions" },
  { label: "Activities", to: ADMIN_PATHS.activities, icon: "activities" },
  { label: "Users", to: ADMIN_PATHS.users, icon: "users" },
];