import { Link } from "react-router-dom";
import classNames from "../../utils/classNames";

/**
 * TripSathi logo: mountain mark + wordmark, linking to the home page.
 *
 * Props
 *  to         destination route (default "/")
 *  light      white wordmark for dark backgrounds (footer, hero)
 *  onClick    optional click handler (e.g. close the mobile menu)
 *  className  extra class
 */
export default function Logo({ to = "/", light = false, onClick, className }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={classNames("logo", light && "logo--light", className)}
      aria-label="TripSathi home"
    >
      <svg
        className="logo__mark"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <rect className="logo__mark-bg" width="64" height="64" rx="14" />
        <path className="logo__mark-peak" d="M14 44 L27 22 L35 34 L41 26 L50 44 Z" />
        <circle className="logo__mark-sun" cx="46" cy="18" r="5" />
      </svg>
      <span className="logo__text">
        Trip<span>Sathi</span>
      </span>
    </Link>
  );
}