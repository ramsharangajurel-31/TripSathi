import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FiAlertCircle,
  FiEdit2,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import useAuth from "../../hooks/useAuth";
import {
  hasErrors,
  normalizePhone,
  validateEmail,
  validateForm,
  validateFullName,
  validatePhone,
} from "../../utils/validation";

const RULES = {
  fullName: (values) => validateFullName(values.fullName),
  email: (values) => validateEmail(values.email),
  phone: (values) => validatePhone(values.phone),
  location: (values) =>
    (values.location || "").trim().length > 100
      ? "Location must be 100 characters or fewer."
      : "",
};

const toValues = (user) => ({
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || "",
  location: user.location || "",
});

/**
 * Personal information: shown read-only until "Edit profile" is chosen.
 * Save is enabled only when something actually changed.
 */
export default function ProfileForm({ user }) {
  const { updateProfile } = useAuth();
  const formRef = useRef(null);

  const [values, setValues] = useState(() => toValues(user));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty =
    values.fullName.trim() !== user.fullName ||
    values.email.trim().toLowerCase() !== user.email ||
    normalizePhone(values.phone) !== (user.phone || "") ||
    values.location.trim() !== (user.location || "");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: "" }));
    if (formError) setFormError("");
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    if (!isEditing || !RULES[name]) return;
    setErrors((previous) => ({ ...previous, [name]: RULES[name](values) }));
  };

  const startEditing = () => {
    setIsEditing(true);
    formRef.current?.elements.fullName?.focus();
  };

  const cancelEditing = () => {
    setValues(toValues(user));
    setErrors({});
    setFormError("");
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEditing || saving) return;

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
      const result = await updateProfile(values);

      if (!result.ok) {
        if (result.field) {
          setErrors((previous) => ({ ...previous, [result.field]: result.error }));
          form.elements[result.field]?.focus();
        } else {
          setFormError(result.error);
        }
        return;
      }

      setValues(toValues(result.user));
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (error) {
      console.error("TripSathi profile update error:", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Personal information"
      headingLevel="h2"
      actions={
        !isEditing && (
          <Button
            key="edit"
            variant="secondary"
            size="sm"
            leftIcon={<FiEdit2 />}
            onClick={startEditing}
          >
            Edit profile
          </Button>
        )
      }
    >
      {formError && (
        <div className="alert alert--danger auth__alert" role="alert">
          <FiAlertCircle className="alert__icon" size={18} aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <Input
            label="Full name"
            name="fullName"
            required
            leftIcon={<FiUser size={18} />}
            autoComplete="name"
            readOnly={!isEditing}
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
            autoComplete="email"
            inputMode="email"
            readOnly={!isEditing}
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
            autoComplete="tel"
            inputMode="tel"
            hint={isEditing ? "Nepali mobile number, 10 digits." : undefined}
            readOnly={!isEditing}
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.phone}
          />
          <Input
            label="Location"
            name="location"
            leftIcon={<FiMapPin size={18} />}
            placeholder={isEditing ? "e.g. Kathmandu, Nepal" : "Not set"}
            autoComplete="address-level2"
            readOnly={!isEditing}
            value={values.location}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.location}
          />
        </div>

        {isEditing && (
          <div className="form-actions">
            <Button key="cancel" variant="ghost" onClick={cancelEditing} disabled={saving}>
              Cancel
            </Button>
            <Button key="save" type="submit" loading={saving} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}