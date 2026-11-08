import { Link } from "react-router-dom";
import { FiBell, FiMenu } from "react-icons/fi";

import Logo from "../common/Logo";
import UserMenu from "../common/UserMenu";
import useAuth from "../../hooks/useAuth";
import useLogout from "../../hooks/useLogout";
import useNotifications from "../../hooks/useNotifications";
import { DASHBOARD_PATHS } from "../../data/dashboardData";

/**
 * Sticky top bar of the dashboard: menu button and logo on small screens,
 * notification bell with unread count, and the account menu.
 *
 * Props
 *  menuOpen        whether the mobile drawer is open (for aria-expanded)
 *  onMenuClick     opens the mobile drawer
 *  menuButtonRef   ref to the menu button so the layout can return focus
 *                  to it when the drawer closes
 */
export default function DashboardNavbar({ menuOpen, onMenuClick, menuButtonRef }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const logout = useLogout();

  const unreadText = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button
          ref={menuButtonRef}
          type="button"
          className="dashboard-topbar__menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="dashboard-sidebar"
        >
          <FiMenu size={22} aria-hidden="true" />
        </button>
        <Logo to={DASHBOARD_PATHS.home} className="dashboard-topbar__logo" />
      </div>

      <div className="dashboard-topbar__right">
        <Link
          to={DASHBOARD_PATHS.notifications}
          className="dashboard-topbar__icon-btn"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <FiBell aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="dashboard-topbar__badge" aria-hidden="true">
              {unreadText}
            </span>
          )}
        </Link>

        <UserMenu user={user} onLogout={logout} />
      </div>
    </header>
  );
}