import classNames from "../../utils/classNames";

/**
 * Loading indicator with three display modes.
 *
 * Props
 *  variant     "page" (default)  fills the content area, centred
 *              "fullscreen"      covers the whole viewport (app start, route guards)
 *              "inline"          small spinner next to text (buttons, cards)
 *  message     text shown with the spinner (default "Loading...")
 *  className   extra class
 *
 * Examples
 *  <Loading />                                  // inside a page while data loads
 *  <Loading variant="fullscreen" message="Checking your session..." />
 *  <Loading variant="inline" message="Saving..." />
 *
 * The wrapper uses role="status" so screen readers announce the message.
 */
export default function Loading({
  variant = "page",
  message = "Loading...",
  className,
}) {
  if (variant === "inline") {
    return (
      <span
        className={classNames("loading-inline", className)}
        role="status"
        aria-live="polite"
      >
        <span className="spinner spinner--sm" aria-hidden="true" />
        {message}
      </span>
    );
  }

  return (
    <div
      className={classNames(
        "loading-screen",
        variant === "fullscreen" && "loading-screen--fullscreen",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}