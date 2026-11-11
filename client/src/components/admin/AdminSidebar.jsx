import { FiActivity, FiFlag, FiGrid, FiMapPin, FiUsers } from "react-icons/fi";

import SidebarShell from "../common/SidebarShell";
import { ADMIN_NAV, ADMIN_PATHS } from "../../data/adminNavigation";

const ICONS = {
  overview: <FiGrid />,
  destinations: <FiMapPin />,
  attractions: <FiFlag />,
  activities: <FiActivity />,
  users: <FiUsers />,
};

/** Admin panel sidebar. Props come from the layout (see PanelLayout). */
export default function AdminSidebar(props) {
  return (
    <SidebarShell
      nav={ADMIN_NAV}
      icons={ICONS}
      ariaLabel="Administration"
      homePath={ADMIN_PATHS.home}
      headerExtra={<span className="admin-tag">Admin</span>}
      {...props}
    />
  );
}