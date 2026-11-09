import { FiCheck } from "react-icons/fi";

import classNames from "../../utils/classNames";

/**
 * Step indicator for the trip wizard.
 *
 * Props
 *  steps         array of { id, label }
 *  currentStep   zero-based index of the step being shown
 *  onStepClick   function(index): called when a COMPLETED step is chosen,
 *                so the user can go back. Future steps are not clickable,
 *                which keeps every step's validation in place.
 *
 * Desktop: numbered markers with labels, joined by lines.
 * Phone: a "Step 2 of 5" summary with a progress bar (see wizard.css).
 *
 * Accessibility: an ordered list in a labelled <nav>; the current step has
 * aria-current="step"; completed steps carry a hidden "completed" label.
 */
export default function TripProgress({ steps, currentStep, onStepClick }) {
  const total = steps.length;
  const percent = Math.round(((currentStep + 1) / total) * 100);

  return (
    <nav className="progress" aria-label="Trip planning progress">
      <p className="progress__summary" aria-hidden="true">
        <span>
          Step {currentStep + 1} of {total}
        </span>
        <strong>{steps[currentStep].label}</strong>
      </p>

      <div className="progress__bar" aria-hidden="true">
        <span className="progress__bar-fill" style={{ width: `${percent}%` }} />
      </div>

      <ol className="progress__list">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === total - 1;

          const content = (
            <>
              <span className="progress__marker" aria-hidden="true">
                {isComplete ? <FiCheck size={16} /> : index + 1}
              </span>
              <span className="progress__label">
                {step.label}
                {isComplete && <span className="sr-only"> (completed)</span>}
              </span>
            </>
          );

          return (
            <li
              key={step.id}
              className={classNames(
                "progress__item",
                isComplete && "is-complete",
                isCurrent && "is-current"
              )}
            >
              {isComplete ? (
                <button
                  type="button"
                  className="progress__step"
                  onClick={() => onStepClick(index)}
                >
                  {content}
                </button>
              ) : (
                <span
                  className="progress__step"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {content}
                </span>
              )}

              {!isLast && <span className="progress__line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}