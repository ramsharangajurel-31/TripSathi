import { forwardRef, useId, useState } from "react";
import { FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import classNames from "../../utils/classNames";

/**
 * Reusable text field with label, hint, error message and optional icon.
 * Handles accessibility wiring (label, aria-invalid, aria-describedby).
 *
 * Props
 *  label       visible label text
 *  name        field name
 *  type        any input type; "password" gets a show/hide toggle automatically
 *  as          "input" (default) | "textarea"
 *  error       error message string (turns the field red)
 *  hint        helper text shown below the field when there is no error
 *  required    shows an asterisk and sets the required attribute
 *  leftIcon    React node shown inside the field (e.g. <FiMail />)
 *  rows        textarea rows (only when as="textarea")
 *  className   extra class for the outer wrapper
 *  inputClassName  extra class for the field itself
 *
 * Works controlled (value + onChange) or uncontrolled. All other props
 * (placeholder, min, max, autoComplete, onBlur, disabled ...) are passed
 * straight to the underlying element.
 */
const Input = forwardRef(function Input(
  {
    label,
    name,
    id,
    type = "text",
    as = "input",
    error,
    hint,
    required = false,
    leftIcon = null,
    rows = 4,
    className,
    inputClassName,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const [showPassword, setShowPassword] = useState(false);

  const fieldId = id || `${name || "field"}-${generatedId}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const isTextarea = as === "textarea";
  const isPassword = type === "password" && !isTextarea;
  const resolvedType = isPassword && showPassword ? "text" : type;

  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const fieldClasses = classNames(
    "form-control",
    error && "form-control--error",
    leftIcon && !isTextarea && "form-control--with-icon",
    isPassword && "form-control--with-action",
    inputClassName
  );

  const sharedProps = {
    id: fieldId,
    name,
    ref,
    required,
    className: fieldClasses,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    ...rest,
  };

  return (
    <div className={classNames("form-group", className)}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && (
            <span className="form-label__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {isTextarea ? (
        <textarea rows={rows} {...sharedProps} />
      ) : (
        <div className="input-wrapper">
          {leftIcon && (
            <span className="input-wrapper__icon" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input type={resolvedType} {...sharedProps} />

          {isPassword && (
            <button
              type="button"
              className="input-wrapper__action"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          )}
        </div>
      )}

      {error ? (
        <p id={errorId} className="form-error" aria-live="polite">
          <FiAlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="form-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export default Input;