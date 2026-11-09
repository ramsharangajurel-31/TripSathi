import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiInfo,
  FiMap,
} from "react-icons/fi";

import Button from "../ui/Button";
import BudgetStep from "./BudgetStep";
import DestinationStep from "./DestinationStep";
import InterestsStep from "./InterestsStep";
import PreferencesStep from "./PreferencesStep";
import ReviewStep from "./ReviewStep";
import TripProgress from "./TripProgress";
import useTripForm from "../../hooks/useTripForm";
import { DASHBOARD_PATHS } from "../../data/dashboardData";

// Order matches STEP_VALIDATORS in utils/tripValidation.js and the step
// indexes used by the review screen's "Edit" buttons.
const STEPS = [
  { id: "destination", label: "Destination and dates", Component: DestinationStep },
  { id: "budget", label: "Budget and travelers", Component: BudgetStep },
  { id: "interests", label: "Interests", Component: InterestsStep },
  { id: "preferences", label: "Preferences", Component: PreferencesStep },
  { id: "review", label: "Review", Component: ReviewStep },
];

// Where to go after a trip is created. Phase 5 adds the itinerary page, and
// this becomes tripPath(trip.id) so the user lands on the new itinerary.
const AFTER_CREATE_PATH = DASHBOARD_PATHS.home;

/**
 * The five-step trip planning wizard.
 *
 * Props
 *  initialParams  { q, destination } read from the URL by CreateTrip
 *
 * Enter on a text field acts like "Next" (it is a real <form>), and a
 * failed validation moves keyboard focus to the first problem.
 */
export default function TripForm({ initialParams }) {
  const navigate = useNavigate();
  const form = useTripForm(initialParams);
  const panelRef = useRef(null);
  const previousStep = useRef(form.stepIndex);

  const current = STEPS[form.stepIndex];
  const StepComponent = current.Component;

  // New step: focus its heading and bring the wizard into view.
  useEffect(() => {
    if (previousStep.current === form.stepIndex) return;
    previousStep.current = form.stepIndex;

    const heading = panelRef.current?.querySelector("#wizard-step-title");
    if (heading) heading.focus({ preventScroll: true });

    document
      .getElementById("trip-wizard")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form.stepIndex]);

  // Failed validation: focus the first field (or card group) with an error.
  useEffect(() => {
    if (!form.attempt) return;

    const target = panelRef.current?.querySelector(
      ".form-control--error, .fieldset__error"
    );
    if (!target) return;

    if (target.classList.contains("form-control--error")) {
      target.focus();
      return;
    }

    const field = target.closest("fieldset")?.querySelector("input:not(:disabled)");
    if (field) {
      field.focus();
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [form.attempt]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.isLastStep) {
      form.next();
      return;
    }

    const result = form.submit();

    if (result.ok) {
      toast.success("Your itinerary has been created.");
      navigate(AFTER_CREATE_PATH);
    } else if (result.reason === "invalid") {
      toast.error("Please fix the highlighted fields.");
    }
  };

  const showBack = form.stepIndex > 0 || form.returnToReview;

  return (
    <div className="wizard" id="trip-wizard">
      <TripProgress
        steps={STEPS}
        currentStep={form.stepIndex}
        onStepClick={(index) => form.goToStep(index)}
      />

      {form.restored && (
        <div className="alert alert--info wizard__notice" role="status">
          <FiInfo className="alert__icon" size={18} aria-hidden="true" />
          <span>We restored your unfinished trip.</span>
          <Button variant="ghost" size="sm" onClick={form.startOver}>
            Start over
          </Button>
        </div>
      )}

      <form
        ref={panelRef}
        className="wizard__panel"
        onSubmit={handleSubmit}
        noValidate
      >
        <StepComponent
          values={form.values}
          errors={form.errors}
          onChange={form.onChange}
          onEditStep={(index) => form.goToStep(index, { fromReview: true })}
          prefilledFromSearch={form.prefilledFromSearch}
        />

        {form.submitError && (
          <div className="alert alert--danger wizard__notice" role="alert">
            <FiAlertCircle className="alert__icon" size={18} aria-hidden="true" />
            <span>{form.submitError}</span>
          </div>
        )}

        <div className="wizard__footer">
          {showBack && (
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={form.back}
              disabled={form.submitting}
            >
              {form.returnToReview ? "Back to review" : "Back"}
            </Button>
          )}

          <div className="wizard__footer-end">
            {form.isLastStep ? (
              <Button
                type="submit"
                size="lg"
                leftIcon={<FiMap />}
                loading={form.submitting}
              >
                {form.submitting ? "Creating itinerary..." : "Create itinerary"}
              </Button>
            ) : (
              <Button type="submit" rightIcon={<FiArrowRight />}>
                {form.returnToReview ? "Continue to review" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}