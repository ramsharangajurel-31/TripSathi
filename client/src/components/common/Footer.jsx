import { Link } from "react-router-dom";

import Logo from "./Logo";
import { FOOTER_LINK_GROUPS } from "../../data/navigation";

/**
 * Public site footer: brand summary, link groups and a legal line.
 * Link data comes from data/navigation.js so Navbar and Footer stay in sync.
 * Styles: .footer, .footer__* in layout.css.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo light />
            <p>
              Your Intelligent Travel Companion. TripSathi helps travelers plan
              personalized, budget-aware itineraries across Nepal. It is a
              planning and decision-support tool, not a booking platform.
            </p>
          </div>

          {FOOTER_LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="footer__heading">{group.title}</h2>
              <ul className="footer__links">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer__bottom">
          <p>© {currentYear} TripSathi. All rights reserved.</p>
          <p>Made for travelers exploring Nepal.</p>
        </div>
      </div>
    </footer>
  );
}