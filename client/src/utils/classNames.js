/**
 * Joins class names, skipping falsy values.
 *
 * classNames("btn", isActive && "is-active", undefined, "btn--sm")
 *   -> "btn is-active btn--sm"
 */
export default function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}