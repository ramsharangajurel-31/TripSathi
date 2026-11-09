import { useState } from "react";
import { toast } from "react-toastify";
import { FiAlertCircle, FiLock } from "react-icons/fi";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import useAuth from "../../hooks/useAuth";
import {
  hasErrors,
  validateConfirmPassword,
  validateForm,
  validateLoginPassword,
  validatePassword,
} from "../../utils/validation";

const RULES = {
  currentPassword: (values) => validateLoginPassword(values.currentPassword),
  newPassword: (values) => {
    const message = validatePassword(values.newPassword);
    if (message) return message;
    if (values.newPassword === values.currentPassword) {
      return "Choose a password different from your current one.";
    }
    return "";
  },
  confirmPassword: (values) =>
    validateConfirmPassword(values.newPassword, values.confirmPassword),
};

const INITIAL_VALUES = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/** Change-password card. Fields are cleared after a successful change. */
export default function ChangePasswordForm() {
  const { changePassword } = useAuth();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

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
      if (name === "newPassword" && values.confirmPassword) {
        next.confirmPassword = RULES.confirmPassword(values);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const form = event.currentTarget;
    const formErrors = validateForm(values, RULES);
    setErrors(formErrors);
    setFormError("");

    if (hasErrors(formErrors)) {
      form.elements[Object.keys(formErrors)[0]]?.focus();
      return;
    }

    setSaving(true);

    try {
      const result = await changePassword(values.currentPassword, values.newPassword);

      if (!result.ok) {
        if (result.field) {
          setErrors((previous) => ({ ...previous, [result.field]: result.error }));
          form.elements[result.field]?.focus();
        } else {
          setFormError(result.error);
        }
        return;
      }

      setValues(INITIAL_VALUES);
      setErrors({});
      toast.success("Password changed.");
    } catch (error) {
      console.error("TripSathi password change error:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Change password" headingLevel="h2">
      {formError && (
        <div className="alert alert--danger auth__alert" role="alert">
          <FiAlertCircle className="alert__icon" size={18} aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          required
          leftIcon={<FiLock size={18} />}
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.currentPassword}
        />

        <div className="form-row">
          <Input
            label="New password"
            name="newPassword"
            type="password"
            required
            leftIcon={<FiLock size={18} />}
            autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            value={values.newPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.newPassword}
          />
          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            required
            leftIcon={<FiLock size={18} />}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
          />
        </div>

        <div className="form-actions">
          <Button type="submit" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}