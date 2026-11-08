import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiChevronsLeft,
  FiChevronsRight,
  FiGrid,
  FiHome,
  FiPlusCircle,
  FiUser,
  FiX,
} from "react-icons/fi";

import Logo from "../common/Logo";
import useNotifications from "../../hooks/useNotifications";
import classNames from "../../utils/classNames";
import { DASHBOARD_NAV, DASHBOARD_PATHS } from "../../data/dashboardData";

// Menu items in dashboardData.js refer to icons by key.
const ICONS = {
  overview: <FiGrid />,
  create: <FiPlusCircle />,
  saved: <FiBookmark />,
  notifications: <FiBell />,
  profile: <FiUser />,
};

/**
 * Dashboard sidebar.
 *  - Desktop: fixed column that can be collapsed to icons only
 *  - Tablet and phone (≤ 1024px): slide-in drawer opened from the top bar
 *
 * Props
 *  collapsed         icons-only mode (desktop)
 *  mobileOpen        drawer is open (tablet and phone)
 *  onClose           closes the drawer (also called when a link is chosen)
 *  onToggleCollapse  switches collapsed mode
 */
export default function DashboardSidebar({
  collapsed,
  mobileOpen,
  onClose,
  onToggleCollapse,
}) {
  const { unreadCount } = useNotifications();
  const closeButtonRef = useRef(null);

  // When the drawer opens, move focus inside it.
  useEffect(() => {
    if (mobileOpen && closeButtonRef.current) closeButtonRef.current.focus();
  }, [mobileOpen]);

  const unreadText = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <aside
      id="dashboard-sidebar"
      className={classNames("dashboard-sidebar", mobileOpen && "is-open")}
    >
      <div className="dashboard-sidebar__header">
        <Logo light to={DASHBOARD_PATHS.home} onClick={onClose} />
        <button
          ref={closeButtonRef}
          type="button"
          className="dashboard-sidebar__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <FiX size={20} aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Dashboard">
        {DASHBOARD_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              classNames("sidebar-nav__link", isActive && "is-active")
            }
            onClick={onClose}
          >
            <span className="sidebar-nav__icon" aria-hidden="true">
              {ICONS[item.icon]}
            </span>
            <span className="sidebar-nav__label">{item.label}</span>
            {item.showBadge && unreadCount > 0 && (
              <span className="sidebar-nav__badge">
                {unreadText}
                <span className="sr-only"> unread</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="dashboard-sidebar__footer">
        <Link
          to="/"
          className="sidebar-nav__link"
          title={collapsed ? "Back to website" : undefined}
          onClick={onClose}
        >
          <span className="sidebar-nav__icon" aria-hidden="true">
            <FiHome />
          </span>
          <span className="sidebar-nav__label">Back to website</span>
        </Link>

        <button
          type="button"
          className="sidebar-nav__link dashboard-sidebar__collapse"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : undefined}
        >
          <span className="sidebar-nav__icon" aria-hidden="true">
            {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
          </span>
          <span className="sidebar-nav__label">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </button>
      </div>
    </aside>
  );
}