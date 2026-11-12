import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Loading from "../components/common/Loading";
import ScrollManager from "../components/common/ScrollManager";
import classNames from "../utils/classNames";

/**
 * Shell for every signed-in area: sidebar + top bar + page content. Used by
 * the traveler dashboard and the admin panel.
 *
 *  - Desktop: sidebar can be collapsed to icons
 *  - Tablet and phone: sidebar is a drawer. Escape and the dark overlay
 *    close it; page scrolling is locked and the page behind is made inert
 *    while it is open
 *  - "Skip to main content" link and focus on <main> after navigation
 *
 * Props
 *  Sidebar   component receiving { collapsed, mobileOpen, onClose, onToggleCollapse }
 *  Topbar    component receiving { menuOpen, onMenuClick, menuButtonRef }
 *  variant   "dashboard" (default) | "admin": adds a modifier class so the
 *            admin panel can be styled differently
 */
export default function PanelLayout({ Sidebar, Topbar, variant = "dashboard" }) {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const menuButtonRef = useRef(null);
  const previousPathname = useRef(pathname);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  // Leaving the small-screen layout (resize, rotate) closes the drawer.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1025px)");
    const handleChange = (event) => {
      if (event.matches) setMobileOpen(false);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  // While the drawer is open: lock scrolling and let Escape close it.
  useEffect(() => {
    if (!mobileOpen) return undefined;

    document.body.classList.add("no-scroll");

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      // Wait for the page to become interactive again before moving focus.
      window.requestAnimationFrame(() => {
        if (menuButtonRef.current) menuButtonRef.current.focus();
      });
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // After moving to a different page, focus <main> for keyboard users.
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      if (mainRef.current) mainRef.current.focus({ preventScroll: true });
    }
  }, [pathname]);

  const handleSkip = (event) => {
    event.preventDefault();
    if (mainRef.current) {
      mainRef.current.focus();
      mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className={classNames(
        "dashboard",
        collapsed && "dashboard--collapsed",
        variant === "admin" && "dashboard--admin"
      )}
    >
      <a href="#main-content" className="skip-link" onClick={handleSkip}>
        Skip to main content
      </a>

      <ScrollManager />

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
        onToggleCollapse={() => setCollapsed((previous) => !previous)}
      />

      {mobileOpen && (
        <div
          className="dashboard__overlay"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <div className="dashboard__main" inert={mobileOpen || undefined}>
        <Topbar
          menuOpen={mobileOpen}
          onMenuClick={() => setMobileOpen(true)}
          menuButtonRef={menuButtonRef}
        />

        <main
          id="main-content"
          ref={mainRef}
          className="dashboard__content"
          tabIndex={-1}
        >
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}