import {
  FiAlertCircle,
  FiColumns,
  FiEdit3,
  FiPieChart,
  FiPrinter,
  FiSliders,
} from "react-icons/fi";

const FEATURES = [
  {
    icon: <FiPieChart />,
    title: "Clear budget breakdown",
    text: "Transport, stay, food and activities are shown separately in NPR, with the amount left from your budget.",
  },
  {
    icon: <FiSliders />,
    title: "What-if simulator",
    text: "Change your budget, trip length or group size and see how costs and activities shift before you commit.",
  },
  {
    icon: <FiColumns />,
    title: "Side-by-side comparison",
    text: "Compare two itineraries on cost, duration, activities and travel intensity to pick the better fit.",
  },
  {
    icon: <FiEdit3 />,
    title: "Fully editable plans",
    text: "Add, remove and reorder activities, adjust estimated costs and keep your own notes.",
  },
  {
    icon: <FiAlertCircle />,
    title: "Conflict awareness",
    text: "Spot when a plan goes over budget or packs too much into a day, and see lower-cost alternatives.",
  },
  {
    icon: <FiPrinter />,
    title: "Save, print and export",
    text: "Keep your itineraries in one place and print them or save them as a PDF for the trip.",
  },
];

/**
 * "Why TripSathi" feature grid.
 * TripSathi is a planning and decision-support tool. It does not book
 * hotels, flights or tours, and the note at the bottom says so plainly.
 * The id lets the navbar link "/#features" scroll here.
 */
export default function WhyTripSathi() {
  return (
    <section
      id="features"
      className="section section--muted"
      aria-labelledby="why-title"
    >
      <div className="container">
        <div className="section-header">
          <span className="section-header__eyebrow">Why TripSathi</span>
          <h2 id="why-title" className="section-header__title">
            Plan with confidence, not guesswork
          </h2>
          <p className="section-header__subtitle">
            Built around the questions travelers actually ask: can we afford it,
            will it fit in our days, and what are our options?
          </p>
        </div>

        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="feature-card">
              <span className="feature-card__icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__text">{feature.text}</p>
            </li>
          ))}
        </ul>

        <p className="estimate-note">
          TripSathi is a planning tool. It does not book hotels, flights or
          tours, and it does not take payments. Costs shown are estimates.
        </p>
      </div>
    </section>
  );
}