import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 50;

/**
 * Restores expected scrolling behaviour for a single-page app.
 * Renders nothing; place it once inside the router.
 *
 *  - Navigating to a new page scrolls to the top
 *  - Navigating to a hash link (e.g. "/#destinations") scrolls to that section
 *  - Clicking the same hash link twice scrolls again (it reacts to
 *    location.key, which changes on every navigation)
 *
 * If the target section is not in the DOM yet (the page is still rendering),
 * it retries briefly before giving up.
 */
export default function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      // "instant" overrides the global smooth scrolling for page changes
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return undefined;
    }

    let id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      id = hash.slice(1);
    }

    let attempts = 0;
    let timer;

    const scrollToTarget = () => {
      const target = document.getElementById(id);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        timer = window.setTimeout(scrollToTarget, RETRY_DELAY_MS);
      }
    };

    scrollToTarget();

    return () => window.clearTimeout(timer);
  }, [pathname, hash, key]);

  return null;
}