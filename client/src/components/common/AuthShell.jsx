import { FiCheckCircle } from "react-icons/fi";

const POINTS = [
  "Budget breakdown in NPR for every trip",
  "Day-by-day itineraries you can edit",
  "Compare options and test what-if changes",
  "Save, print and export your plans",
];

/**
 * Two-panel layout shared by Login and Register.
 * Left: brand panel (hidden on tablets and phones). Right: the form card.
 *
 * Props
 *  title      page heading (rendered as the page's <h1>)
 *  subtitle   short line under the heading
 *  footer     React node under the form (the "Don't have an account?" link)
 *  children   the form
 */
export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <h2 className="auth__aside-title">
          Plan smarter trips across <span>Nepal</span>
        </h2>
        <p className="auth__aside-text">
          TripSathi turns your budget, dates and interests into a clear
          itinerary, so you can decide with confidence.
        </p>
        <ul className="auth__points">
          {POINTS.map((point) => (
            <li key={point}>
              <FiCheckCircle size={18} aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </aside>

      <div className="auth__panel">
        <div className="auth__card">
          <header className="auth__header">
            <h1 className="auth__title">{title}</h1>
            {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          </header>

          {children}

          {footer && <p className="auth__footer">{footer}</p>}
        </div>
      </div>
    </div>
  );
}