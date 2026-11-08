import { forwardRef } from "react";
import { Link } from "react-router-dom";
import classNames from "../../utils/classNames";

/**
 * Reusable button. Renders a <button>, a router <Link> (when `to` is given)
 * or a plain <a> (when `href` is given) with identical styling.
 *
 * Props
 *  variant   "primary" | "accent" | "secondary" | "ghost" | "danger" |
 *            "outline-danger" | "light" | "outline-light"      (default "primary")
 *  size      "sm" | "md" | "lg"                                (default "md")
 *  block     full-width button
 *  loading   shows a spinner and blocks clicks
 *  iconOnly  square icon button – you MUST pass aria-label
 *  leftIcon / rightIcon   React nodes (e.g. <FiPlus />)
 *  to        internal route (react-router)
 *  href      external URL
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    block = false,
    loading = false,
    iconOnly = false,
    leftIcon = null,
    rightIcon = null,
    type = "button",
    disabled = false,
    to,
    href,
    className,
    onClick,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  const classes = classNames(
    "btn",
    `btn--${variant}`,
    size !== "md" && `btn--${size}`,
    block && "btn--block",
    iconOnly && "btn--icon",
    loading && "is-loading",
    className
  );

  const content = (
    <>
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </>
  );

  // Links cannot be natively disabled, so block navigation manually.
  const handleLinkClick = (event) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    if (onClick) onClick(event);
  };

  if (to) {
    return (
      <Link
        ref={ref}
        to={to}
        className={classes}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={handleLinkClick}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={handleLinkClick}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;