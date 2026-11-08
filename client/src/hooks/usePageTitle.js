import { useEffect } from "react";

const DEFAULT_TITLE = "TripSathi – Your Intelligent Travel Companion";

/**
 * Sets the browser tab title for the current page ("Log in | TripSathi").
 * Helps keyboard and screen reader users, and makes browser history and
 * bookmarks readable. The default title is restored when the page unmounts.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | TripSathi` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}