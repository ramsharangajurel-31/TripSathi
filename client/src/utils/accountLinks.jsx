import { FiBell, FiGrid, FiShield, FiUser } from "react-icons/fi";

import { ROLES } from "../data/demoUsers";
import { ADMIN_HOME, USER_HOME } from "./authRedirect";

/**
 * Menu items for each role. Shared by the desktop account menu and the
 * mobile menu in Navbar, so both show the same destinations.
 */
export function getAccountLinks(user) {
  if (user.role === ROLES.admin) {
    return [{ label: "Admin panel", to: ADMIN_HOME, icon: <FiShield /> }];
  }

  return [
    { label: "Dashboard", to: USER_HOME, icon: <FiGrid /> },
    { label: "Profile", to: `${USER_HOME}/profile`, icon: <FiUser /> },
    {
      label: "Notifications",
      to: `${USER_HOME}/notifications`,
      icon: <FiBell />,
    },
  ];
}