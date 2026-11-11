import {
  FiBell,
  FiBookmark,
  FiColumns,
  FiGrid,
  FiPlusCircle,
  FiUser,
} from "react-icons/fi";

import SidebarShell from "../common/SidebarShell";
import useNotifications from "../../hooks/useNotifications";
import { DASHBOARD_NAV, DASHBOARD_PATHS } from "../../data/dashboardData";

// Menu items in dashboardData.js refer to icons by key.
const ICONS = {
  overview: <FiGrid />,
  create: <FiPlusCircle />,
  saved: <FiBookmark />,
  compare: <FiColumns />,
  notifications: <FiBell />,
  profile: <FiUser />,
};

/**
 * Traveler dashboard sidebar. Receives collapsed, mobileOpen, onClose and
 * onToggleCollapse from the layout and passes them on.
 */
export default function DashboardSidebar(props) {
  const { unreadCount } = useNotifications();

  // The Notifications item shows the unread count.
  const getBadge = (item) =>
    item.showBadge && unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : null;

  return (
    <SidebarShell
      nav={DASHBOARD_NAV}
      icons={ICONS}
      ariaLabel="Dashboard"
      homePath={DASHBOARD_PATHS.home}
      getBadge={getBadge}
      {...props}
    />
  );
}