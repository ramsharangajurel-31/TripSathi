import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiAlertCircle, FiInfo, FiLock, FiMail } from "react-icons/fi";

import AuthShell from "../components/common/AuthShell";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import useAuth from "../hooks/useAuth";
import usePageTitle from "../hooks/usePageTitle";
import { DEMO_CREDENTIALS } from "../data/demoUsers";
import {
  hasErrors,
  validateEmail,
  validateForm,
  validateLoginPassword,
} from "../utils/validation";

const RULES = {
  email: (values) => validateEmail(values.email),
  password: (values) => validateLoginPassword(values.password),
};

const INITIAL_VALUES = { email: "", password: "", remember: false };

/**
 * Login page.
 *
 * On success the user is redirected by <GuestRoute> (see AppRoutes): as soon
 * as the session exists, GuestRoute sends them to the page they originally
 * wanted (including ?query), or to their dashboard. This page therefore does
 * not navigate by itself.
 */
export default function Login() {
  usePageTitle("Log in");

  const location = useLocation();
  const { login } = useAuth();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Set by ProtectedRoute when someone was sent here from a private page.
  const redirected = Boolean(location.state?.from);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setValues((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: "" }));
    if (formError) setFormError("");
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    if (!RULES[name]) return;
    setErrors((previous) => ({ ...previous, [name]: RULES[name](values) }));
  };

  // One-click fill for the demo accounts (demonstration build only).
  const fillDemoAccount = (account) => {
    setValues((previous) => ({
      ...previous,
      email: account.email,
      password: account.password,
    }));
    setErrors({});
    setFormError("");
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
      const result = await login(values.email, values.password, values.remember);

      if (!result.ok) {
        setFormError(result.error);
        setSubmitting(false);
        return;
      }

      const firstName = result.user.fullName.trim().split(/\s+/)[0];
      toast.success(`Welcome back, ${firstName}!`);
      // GuestRoute performs the redirect now that the session exists.
    } catch (error) {
      console.error("TripSathi login error:", error);
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your saved trips and keep planning."
      footer={
        <>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      {redirected && !formError && (
        <div className="alert alert--info auth__alert" role="status">
          <FiInfo className="alert__icon" size={18} aria-hidden="true" />
          <span>Please log in to continue.</span>
        </div>
      )}

      {formError && (
        <div className="alert alert--danger auth__alert" role="alert">
          <FiAlertCircle className="alert__icon" size={18} aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
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
          label="Password"
          name="password"
          type="password"
          required
          leftIcon={<FiLock size={18} />}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
        />

        <div className="auth__row">
          <label className="check">
            <input
              type="checkbox"
              name="remember"
              checked={values.remember}
              onChange={handleChange}
            />
            Remember me
          </label>
        </div>

        <Button type="submit" size="lg" block loading={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <section className="demo-accounts" aria-labelledby="demo-accounts-title">
        <h2 id="demo-accounts-title" className="demo-accounts__title">
          Demo accounts
        </h2>
        <p className="demo-accounts__note">
          This is a demonstration build. Use one of these accounts to explore.
        </p>
        <ul className="demo-accounts__list">
          {DEMO_CREDENTIALS.map((account) => (
            <li key={account.email} className="demo-accounts__item">
              <div className="demo-accounts__details">
                <p className="font-semibold">
                  {account.label}{" "}
                  <span className="text-secondary font-medium">
                    (opens {account.opens.toLowerCase()})
                  </span>
                </p>
                <p className="demo-accounts__credentials">
                  {account.email} / {account.password}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fillDemoAccount(account)}
                aria-label={`Fill in the ${account.label} demo account`}
              >
                Use
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </AuthShell>
  );
}