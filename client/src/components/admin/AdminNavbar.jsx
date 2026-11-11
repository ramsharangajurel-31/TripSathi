import { FiMenu } from "react-icons/fi";

import Logo from "../common/Logo";
import UserMenu from "../common/UserMenu";
import useAuth from "../../hooks/useAuth";
import useLogout from "../../hooks/useLogout";
import { ADMIN_PATHS } from "../../data/adminNavigation";

/**
 * Sticky top bar of the admin panel: menu button and logo on small screens,
 * an "Administration" label, and the account menu.
 *
 * Props
 *  menuOpen        whether the mobile drawer is open (for aria-expanded)
 *  onMenuClick     opens the mobile drawer
 *  menuButtonRef   ref to the menu button so the layout can return focus
 */
export default function AdminNavbar({ menuOpen, onMenuClick, menuButtonRef }) {
  const { user } = useAuth();
  const logout = useLogout();

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
        <Logo to={ADMIN_PATHS.home} className="dashboard-topbar__logo" />
        <span className="topbar-title">Administration</span>
      </div>

      <div className="dashboard-topbar__right">
        <UserMenu user={user} onLogout={logout} />
      </div>
    </header>
  );
}