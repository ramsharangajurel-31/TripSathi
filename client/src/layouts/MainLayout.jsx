import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ScrollManager from "../components/common/ScrollManager";

/**
 * Layout for public pages (home, login, register, 404).
 *
 * Structure: skip link → navbar → <main> (route content) → footer.
 *
 * Accessibility
 *  - "Skip to main content" link is the first focusable element
 *  - After navigating to a different page, focus moves to <main> so
 *    keyboard and screen reader users start at the new content
 */
export default function MainLayout() {
  const mainRef = useRef(null);
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Skip the initial load and hash-only changes; act only on real page changes.
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      if (mainRef.current) mainRef.current.focus({ preventScroll: true });
    }
  }, [pathname]);

  // Focus <main> without changing the URL (a plain "#main-content" link would
  // add a hash to the address bar and trigger the scroll manager).
  const handleSkip = (event) => {
    event.preventDefault();
    if (mainRef.current) {
      mainRef.current.focus();
      mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link" onClick={handleSkip}>
        Skip to main content
      </a>

      <ScrollManager />
      <Navbar />

      <main
        id="main-content"
        ref={mainRef}
        className="page-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <Footer />
    </>
  );
}