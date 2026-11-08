
import { FiInbox } from "react-icons/fi";
import Button from "../ui/Button";
import classNames from "../../utils/classNames";

/**
 * Friendly message shown when a list or section has no data
 * (no saved trips, no search results, no notifications ...).
 *
 * Props
 *  icon         React node (default: inbox icon)
 *  title        short heading (default "Nothing here yet")
 *  message      one or two sentences explaining what to do next
 *  actionLabel  label of the primary button (omit for no button)
 *  actionTo     internal route for the primary button
 *  onAction     click handler for the primary button (use instead of actionTo)
 *  secondaryLabel / secondaryTo / onSecondary   optional second button
 *  className    extra class
 *
 * Examples
 *  <EmptyState
 *    title="No saved trips"
 *    message="Create your first itinerary and save it here."
 *    actionLabel="Create a trip"
 *    actionTo="/dashboard/create-trip"
 *  />
 *
 *  <EmptyState
 *    icon={<FiSearch />}
 *    title="No results found"
 *    message="Try a different keyword or clear your filters."
 *    actionLabel="Clear filters"
 *    onAction={clearFilters}
 *  />
 */
export default function EmptyState({
  icon = <FiInbox />,
  title = "Nothing here yet",
  message,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  onSecondary,
  className,
}) {
  const hasPrimary = actionLabel && (actionTo || onAction);
  const hasSecondary = secondaryLabel && (secondaryTo || onSecondary);

  return (
    <div className={classNames("state", className)}>
      <span className="state__icon" aria-hidden="true">
        {icon}
      </span>

      <h3 className="state__title">{title}</h3>
      {message && <p className="state__text">{message}</p>}

      {(hasPrimary || hasSecondary) && (
        <div className="state__actions">
          {hasPrimary && (
            <Button to={actionTo} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {hasSecondary && (
            <Button
              variant="secondary"
              to={secondaryTo}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}