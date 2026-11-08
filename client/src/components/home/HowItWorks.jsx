import { FiEdit3, FiMap, FiSave, FiSliders } from "react-icons/fi";

const STEPS = [
  {
    icon: <FiEdit3 />,
    title: "Describe your trip",
    text: "Choose destinations and dates, or simply write what you have in mind in your own words.",
  },
  {
    icon: <FiSliders />,
    title: "Set budget and interests",
    text: "Enter your total budget in NPR, the number of travelers and what you enjoy, from nature to culture.",
  },
  {
    icon: <FiMap />,
    title: "Review your itinerary",
    text: "See a day-by-day plan with activities, transport, stays and a clear cost breakdown.",
  },
  {
    icon: <FiSave />,
    title: "Refine, save and share",
    text: "Edit activities, test what-if changes, compare options, then save, print or export the plan.",
  },
];

/**
 * "How TripSathi works" section: four numbered steps.
 * The id lets the navbar link "/#how-it-works" scroll here.
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section" aria-labelledby="how-title">
      <div className="container">
        <div className="section-header">
          <span className="section-header__eyebrow">How it works</span>
          <h2 id="how-title" className="section-header__title">
            From idea to itinerary in four steps
          </h2>
          <p className="section-header__subtitle">
            No spreadsheets and no guesswork. Just the details that matter for
            your trip.
          </p>
        </div>

        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="step">
              <span className="step__number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="step__icon" aria-hidden="true">
                {step.icon}
              </span>
              <h3 className="step__title">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="step__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}