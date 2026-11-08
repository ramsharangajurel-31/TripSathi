import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiAlertCircle,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";

import AuthShell from "../components/common/AuthShell";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import useAuth from "../hooks/useAuth";
import usePageTitle from "../hooks/usePageTitle";
import classNames from "../utils/classNames";
import {
  getPasswordStrength,
  hasErrors,
  validateConfirmPassword,
  validateEmail,
  validateForm,
  validateFullName,
  validatePassword,
  validatePhone,
} from "../utils/validation";

// Order matters: the first failing field receives focus on submit, so keep
// this in the same order as the fields on screen.
const RULES = {
  fullName: (values) => validateFullName(values.fullName),
  email: (values) => validateEmail(values.email),
  phone: (values) => validatePhone(values.phone),
  password: (values) => validatePassword(values.password),
  confirmPassword: (values) =>
    validateConfirmPassword(values.password, values.confirmPassword),
};

const INITIAL_VALUES = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

/**
 * Four-segment password strength meter. The coloured bars are decorative
 * (hidden from screen readers); the text label carries the meaning and is
 * announced politely when it changes.
 */
function PasswordStrength({ password }) {
  const { score, label, level } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className={classNames("strength", `strength--${level}`)}>
      <div className="strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={classNames("strength__bar", bar <= score && "is-filled")}
          />
        ))}
      </div>
      <span className="strength__label" aria-live="polite">
        <span className="sr-only">Password strength: </span>
        {label}
      </span>
    </div>
  );
}

/**
 * Registration page.
 *
 * On success the new account is signed in and <GuestRoute> (see AppRoutes)
 * redirects to the page the visitor originally wanted, or to the dashboard.
 */
export default function Register() {
  usePageTitle("Create account");

  const { register } = useAuth();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((previous) => ({ ...previous, [name]: value }));

    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: "" }));
    if (formError) setFormError("");
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    if (!RULES[name]) return;

    setErrors((previous) => {
      const next = { ...previous, [name]: RULES[name](values) };

      // If the password changes after the confirmation was typed, re-check
      // the confirmation so a stale state never lingers.
      if (name === "password" && values.confirmPassword) {
        next.confirmPassword = RULES.confirmPassword(values);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    // Keep a reference: event.currentTarget is cleared after an await.
    const form = event.currentTarget;

    const formErrors = validateForm(values, RULES);
    setErrors(formErrors);
    setFormError("");

    if (hasErrors(formErrors)) {
      form.elements[Object.keys(formErrors)[0]]?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const result = await register({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });

      if (!result.ok) {
        if (result.field) {
          setErrors((previous) => ({ ...previous, [result.field]: result.error }));
          form.elements[result.field]?.focus();
        } else {
          setFormError(result.error);
        }
        setSubmitting(false);
        return;
      }

      toast.success("Account created. Welcome to TripSathi!");
      // GuestRoute performs the redirect now that the session exists.
    } catch (error) {
      console.error("TripSathi registration error:", error);
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start planning budget-aware trips across Nepal."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      {formError && (
        <div className="alert alert--danger auth__alert" role="alert">
          <FiAlertCircle className="alert__icon" size={18} aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Full name"
          name="fullName"
          required
          leftIcon={<FiUser size={18} />}
          placeholder="e.g. Sita Sharma"
          autoComplete="name"
          value={values.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.fullName}
        />

        <Input
          label="Email"
          name="email"
          type="email"
          required
          leftIcon={<FiMail size={18} />}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
        />

        <Input
          label="Phone number"
          name="phone"
          type="tel"
          required
          leftIcon={<FiPhone size={18} />}
          placeholder="98XXXXXXXX"
          autoComplete="tel"
          inputMode="tel"
          hint="Nepali mobile number, 10 digits."
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
        />

        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            required
            leftIcon={<FiLock size={18} />}
            placeholder="Create a password"
            autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
          />
          <PasswordStrength password={values.password} />
        </div>

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          required
          leftIcon={<FiLock size={18} />}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.confirmPassword}
        />

        <Button type="submit" size="lg" block loading={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}