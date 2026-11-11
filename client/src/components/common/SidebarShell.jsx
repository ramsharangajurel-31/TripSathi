import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiChevronsLeft, FiChevronsRight, FiHome, FiX } from "react-icons/fi";

import Logo from "./Logo";
import classNames from "../../utils/classNames";

/**
 * Sidebar used by both the traveler dashboard and the admin panel.
 *  - Desktop: fixed column that can be collapsed to icons only
 *  - Tablet and phone (≤ 1024px): slide-in drawer opened from the top bar
 *
 * Props
 *  nav               array of { label, to, icon, end?, ... } menu items
 *  icons             map from an item's `icon` key to a React node
 *  ariaLabel         name of the navigation landmark
 *  homePath          where the logo links to
 *  headerExtra       optional node shown beside the logo (e.g. an "Admin" tag)
 *  getBadge          optional function(item) returning a short string (a
 *                    count) or null
 *  collapsed         icons-only mode (desktop)
 *  mobileOpen        drawer is open (tablet and phone)
 *  onClose           closes the drawer (also called when a link is chosen)
 *  onToggleCollapse  switches collapsed mode
 */
export default function SidebarShell({
  nav,
  icons,
  ariaLabel,
  homePath,
  headerExtra,
  getBadge,
  collapsed,
  mobileOpen,
  onClose,
  onToggleCollapse,
}) {
  const closeButtonRef = useRef(null);

  // When the drawer opens, move focus inside it.
  useEffect(() => {
    if (mobileOpen && closeButtonRef.current) closeButtonRef.current.focus();
  }, [mobileOpen]);

  return (
    <aside
      id="dashboard-sidebar"
      className={classNames("dashboard-sidebar", mobileOpen && "is-open")}
    >
      <div className="dashboard-sidebar__header">
        <span className="sidebar-brand">
          <Logo light to={homePath} onClick={onClose} />
          {headerExtra}
        </span>
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

      <nav className="sidebar-nav" aria-label={ariaLabel}>
        {nav.map((item) => {
          const badge = getBadge ? getBadge(item) : null;

          return (
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
                {icons[item.icon]}
              </span>
              <span className="sidebar-nav__label">{item.label}</span>
              {badge && (
                <span className="sidebar-nav__badge">
                  {badge}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </NavLink>
          );
        })}
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