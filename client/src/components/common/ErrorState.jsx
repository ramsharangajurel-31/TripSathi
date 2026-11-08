import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import Button from "../ui/Button";
import classNames from "../../utils/classNames";

/**
 * Message shown when something fails: a page cannot load, saved data is
 * corrupted, or (in the backend phase) an API request fails.
 *
 * Props
 *  icon          React node (default: warning triangle)
 *  title         short heading (default "Something went wrong")
 *  message       plain-language explanation (default: generic retry text)
 *  onRetry       click handler; when given, a retry button is shown
 *  retryLabel    label of the retry button (default "Try again")
 *  secondaryLabel / secondaryTo   optional second button that navigates,
 *                e.g. "Go to dashboard"
 *  className     extra class
 *
 * The wrapper uses role="alert" so screen readers announce the error as
 * soon as it appears.
 *
 * Examples
 *  <ErrorState onRetry={loadTrips} />
 *
 *  <ErrorState
 *    title="Trip not found"
 *    message="This itinerary may have been deleted."
 *    secondaryLabel="Back to saved trips"
 *    secondaryTo="/dashboard/saved-trips"
 *  />
 */
export default function ErrorState({
  icon = <FiAlertTriangle />,
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  retryLabel = "Try again",
  secondaryLabel,
  secondaryTo,
  className,
}) {
  const hasSecondary = secondaryLabel && secondaryTo;

  return (
    <div className={classNames("state", "state--error", className)} role="alert">
      <span className="state__icon" aria-hidden="true">
        {icon}
      </span>

      <h3 className="state__title">{title}</h3>
      {message && <p className="state__text">{message}</p>}

      {(onRetry || hasSecondary) && (
        <div className="state__actions">
          {onRetry && (
            <Button onClick={onRetry} leftIcon={<FiRefreshCw />}>
              {retryLabel}
            </Button>
          )}
          {hasSecondary && (
            <Button variant="secondary" to={secondaryTo}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}