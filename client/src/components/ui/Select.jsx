import { forwardRef, useId } from "react";
import { FiAlertCircle } from "react-icons/fi";
import classNames from "../../utils/classNames";

/**
 * Reusable native select with label, hint and error message.
 * A native <select> is used on purpose: it is fully accessible and gives
 * the best experience on mobile devices.
 *
 * Props
 *  label        visible label text
 *  name         field name
 *  options      array of strings OR objects: { value, label, disabled? }
 *  placeholder  text for the empty first option (e.g. "Select destination").
 *               Omit it to render no empty option.
 *  error        error message string
 *  hint         helper text shown when there is no error
 *  required     shows an asterisk and sets the required attribute
 *  className    extra class for the outer wrapper
 *  selectClassName  extra class for the select itself
 *
 * Works controlled (value + onChange) or uncontrolled. Other props
 * (disabled, onBlur, autoComplete ...) go straight to the <select>.
 */
const Select = forwardRef(function Select(
  {
    label,
    name,
    id,
    options = [],
    placeholder,
    error,
    hint,
    required = false,
    className,
    selectClassName,
    children,
    ...rest
  },
  ref
) {
  const generatedId = useId();

  const fieldId = id || `${name || "select"}-${generatedId}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const describedBy =
    [error ? errorId : null, !error && hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  // Accept plain strings or { value, label, disabled } objects.
  const normalizedOptions = options.map((option) =>
    typeof option === "object" && option !== null
      ? option
      : { value: option, label: String(option) }
  );

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

      <select
        id={fieldId}
        name={name}
        ref={ref}
        required={required}
        className={classNames(
          "form-control",
          error && "form-control--error",
          selectClassName
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}

        {normalizedOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}

        {/* Allows <optgroup> or custom <option> children when needed */}
        {children}
      </select>

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

export default Select;