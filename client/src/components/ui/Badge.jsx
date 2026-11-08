import classNames from "../../utils/classNames";

const VARIANTS = ["neutral", "primary", "success", "warning", "danger", "info"];

/**
 * Small status / category label.
 *
 * Props
 *  variant   "neutral" | "primary" | "success" | "warning" | "danger" | "info"
 *            (default "neutral"; unknown values fall back to "neutral")
 *  icon      optional React node shown before the text (e.g. <FiCheck />)
 *  className extra class
 *
 * Examples
 *  <Badge variant="success">Active</Badge>
 *  <Badge variant="warning" icon={<FiClock />}>Upcoming</Badge>
 *  <Badge variant="info">Sample data</Badge>
 *
 * Colour is never the only signal: always include readable text inside the
 * badge (for example "Inactive", not just a red dot).
 */
export default function Badge({
  variant = "neutral",
  icon = null,
  className,
  children,
  ...rest
}) {
  const safeVariant = VARIANTS.includes(variant) ? variant : "neutral";

  return (
    <span
      className={classNames("badge", `badge--${safeVariant}`, className)}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}