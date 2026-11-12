import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import useLogout from "../../hooks/useLogout";

import Logo from "./Logo";
import UserMenu from "./UserMenu";
import { getAccountLinks } from "../../utils/accountLinks";
import Button from "../ui/Button";
import classNames from "../../utils/classNames";
import getInitials from "../../utils/getInitials";
import useAuth from "../../hooks/useAuth";
import { PUBLIC_NAV_LINKS } from "../../data/navigation";
import { getHomePath } from "../../utils/authRedirect";
import { ROLES } from "../../data/demoUsers";

/**
 * Public site navigation bar with a responsive mobile menu.
 *
 * Signed out : Log in / Get started buttons
 * Signed in  : Dashboard (or Admin panel) button + account dropdown
 *
 * - Desktop: logo, links, actions
 * - Tablet and phone (≤ 768px): hamburger button opens a menu panel that
 *   also contains the account section
 * - The menu closes on link click, Escape, and when the screen grows wider
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);
 
    const { user, isAuthenticated } = useAuth();
  const logout = useLogout();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };
  
  useEffect(() => {
    const query = window.matchMedia("(min-width: 769px)");
    const handleChange = (event) => {
      if (event.matches) setMenuOpen(false);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        if (toggleRef.current) toggleRef.current.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Hash links (e.g. "/#destinations") use Link so they never show an
  // "active" state; page links use NavLink so the current page is highlighted.
  const renderLink = ({ label, to, end }) => {
    if (to.includes("#")) {
      return (
        <Link key={label} to={to} className="navbar__link" onClick={closeMenu}>
          {label}
        </Link>
      );
    }

    return (
      <NavLink
        key={label}
        to={to}
        end={end}
        className={({ isActive }) =>
          classNames("navbar__link", isActive && "is-active")
        }
        onClick={closeMenu}
      >
        {label}
      </NavLink>
    );
  };

  const homePath = isAuthenticated ? getHomePath(user) : "/";
  const homeLabel =
    isAuthenticated && user.role === ROLES.admin ? "Admin panel" : "Dashboard";

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo onClick={closeMenu} />

        <nav className="navbar__links" aria-label="Main navigation">
          {PUBLIC_NAV_LINKS.map(renderLink)}
        </nav>

        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Button to={homePath} variant="secondary" size="sm">
                {homeLabel}
              </Button>
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost">
                Log in
              </Button>
              <Button to="/register">Get started</Button>
            </>
          )}
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="navbar__toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? (
            <FiX size={22} aria-hidden="true" />
          ) : (
            <FiMenu size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          className="navbar__mobile"
          aria-label="Mobile navigation"
        >
          {PUBLIC_NAV_LINKS.map(renderLink)}

          {isAuthenticated ? (
            <div className="navbar__mobile-actions">
              <div className="navbar__mobile-user">
                <span className="avatar" aria-hidden="true">
                  {getInitials(user.fullName)}
                </span>
                <div>
                  <p className="user-menu__header-name">{user.fullName}</p>
                  <p className="user-menu__header-email">{user.email}</p>
                </div>
              </div>

              {getAccountLinks(user).map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="navbar__link"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}

              <Button
                variant="outline-danger"
                block
                leftIcon={<FiLogOut />}
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
          ) : (
            <div className="navbar__mobile-actions">
              <Button to="/login" variant="secondary" block onClick={closeMenu}>
                Log in
              </Button>
              <Button to="/register" block onClick={closeMenu}>
                Get started
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}