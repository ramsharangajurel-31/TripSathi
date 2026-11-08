import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBell,
  FiChevronDown,
  FiGrid,
  FiLogOut,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { ROLES } from "../../data/demoUsers";
import { ADMIN_HOME, USER_HOME } from "../../utils/authRedirect";
import getInitials from "../../utils/getInitials";
import classNames from "../../utils/classNames";

/**
 * Menu items for each role. Shared with the mobile menu in Navbar so both
 * show exactly the same destinations.
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

/**
 * Desktop account dropdown (avatar + name). Uses the disclosure pattern:
 * a button with aria-expanded that reveals a list of links.
 *
 * Closes on: outside click, Escape (focus returns to the button), choosing
 * an item, and when keyboard focus leaves the menu.
 *
 * Props
 *  user      current user (from useAuth)
 *  onLogout  function called by the "Log out" item
 */
export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  const links = getAccountLinks(user);
  const firstName = user.fullName.trim().split(/\s+/)[0];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        if (buttonRef.current) buttonRef.current.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Close when Tab moves focus out of the whole menu.
  const handleBlur = (event) => {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.relatedTarget)
    ) {
      setOpen(false);
    }
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <div className="user-menu" ref={wrapperRef} onBlur={handleBlur}>
      <button
        ref={buttonRef}
        type="button"
        className="user-menu__button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account menu for ${user.fullName}`}
      >
        <span className="avatar" aria-hidden="true">
          {getInitials(user.fullName)}
        </span>
        <span className="user-menu__name">{firstName}</span>
        <FiChevronDown
          size={16}
          aria-hidden="true"
          className={classNames("user-menu__chevron", open && "is-open")}
        />
      </button>

      {open && (
        <div id={panelId} className="user-menu__panel">
          <div className="user-menu__header">
            <p className="user-menu__header-name">{user.fullName}</p>
            <p className="user-menu__header-email">{user.email}</p>
          </div>

          <ul className="user-menu__list">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="user-menu__item"
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="user-menu__item user-menu__item--danger"
                onClick={handleLogout}
              >
                <span aria-hidden="true">
                  <FiLogOut />
                </span>
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}