import { useRef, useState } from "react";
import { FiTrash2, FiUpload } from "react-icons/fi";

import Modal from "../common/Modal";
import SafeImage from "../common/SafeImage";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { PROVINCES } from "../../data/adminData";
import { BUDGET_TIERS, INTERESTS } from "../../data/destinations";
import { COST_FIELDS, costKey, validateDestination } from "../../utils/adminValidation";
import {
  NUMERIC_CLEANERS,
  digitsOnly,
  destinationToValues,
  emptyDestinationValues,
  focusField,
  valuesToDestination,
} from "../../utils/destinationForm";
import { fileToResizedDataUrl } from "../../utils/imageUtils";
import { hasErrors } from "../../utils/validation";

const TIER_LABELS = { budget: "Budget", standard: "Standard", premium: "Premium" };

/**
 * Dialog for adding or editing a destination. Mounted only while open (the
 * page gives it a fresh `key`), so the form always starts from the right
 * values.
 *
 * Props
 *  mode         "add" | "edit"
 *  destination  the destination being edited (edit mode)
 *  others       the other destinations, to reject duplicate names
 *  onSave       function(data): the page stores the destination
 *  onClose      function()
 */
export default function DestinationFormModal({ mode, destination, others, onSave, onClose }) {
  const isEdit = mode === "edit";
  const fileRef = useRef(null);

  const [values, setValues] = useState(() =>
    isEdit ? destinationToValues(destination) : emptyDestinationValues()
  );
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const clearError = (name) =>
    setErrors((previous) => (previous[name] ? { ...previous, [name]: "" } : previous));

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;

    let next = value;
    if (type === "checkbox") next = checked;
    else if (NUMERIC_CLEANERS[name]) next = NUMERIC_CLEANERS[name](value);
    else if (name.startsWith("cost_")) next = digitsOnly(value);

    setValues((previous) => ({ ...previous, [name]: next }));
    clearError(name);
  };

  const toggleInterest = (id) => {
    setValues((previous) => ({
      ...previous,
      interests: previous.interests.includes(id)
        ? previous.interests.filter((item) => item !== id)
        : [...previous.interests, id],
    }));
    clearError("interests");
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be chosen again
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setValues((previous) => ({ ...previous, image: dataUrl }));
      clearError("image");
    } catch (error) {
      setErrors((previous) => ({ ...previous, image: error.message }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    const formErrors = validateDestination(values, others);
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      focusField(form, Object.keys(formErrors)[0]);
      return;
    }
    onSave(valuesToDestination(values));
  };

  const isUploaded = values.image.startsWith("data:");

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Edit ${destination.name}` : "Add destination"}
      size="lg"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="destination-form" disabled={uploading}>
            {isEdit ? "Save changes" : "Add destination"}
          </Button>
        </>
      }
    >
      <form id="destination-form" className="auth__form" onSubmit={handleSubmit} noValidate>
        {/* ---------- Basics ---------- */}
        <div className="form-row">
          <Input
            label="Destination name"
            name="name"
            required
            maxLength={60}
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            data-autofocus
          />
          <Select
            label="Province"
            name="province"
            required
            placeholder="Select a province"
            options={PROVINCES}
            value={values.province}
            onChange={handleChange}
            error={errors.province}
          />
        </div>

        <Input
          label="Tagline"
          name="tagline"
          required
          maxLength={100}
          value={values.tagline}
          onChange={handleChange}
          error={errors.tagline}
          hint="One short line, for example: Lakeside calm beneath the Annapurna range."
        />

        <Input
          as="textarea"
          rows={4}
          label="Description"
          name="description"
          required
          maxLength={600}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
          hint={`${values.description.length}/600 characters.`}
        />

        {/* ---------- Image ---------- */}
        <div className="image-field">
          <div className="image-field__preview">
            <SafeImage src={values.image} alt="Destination image preview" fallbackLabel="No image" />
          </div>

          <div className="image-field__controls">
            <p className="form-label">Image</p>
            <div className="image-field__buttons">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FiUpload />}
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                Upload image
              </Button>
              {values.image && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<FiTrash2 />}
                  onClick={() => {
                    setValues((previous) => ({ ...previous, image: "" }));
                    clearError("image");
                  }}
                >
                  Remove image
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleFile}
              />
            </div>

            <Input
              label="Or an image address"
              name="image"
              placeholder="https://... or /images/pokhara.jpg"
              value={isUploaded ? "" : values.image}
              onChange={handleChange}
              error={errors.image}
              hint={
                isUploaded
                  ? "Using an uploaded image. It is resized and kept in this browser."
                  : "Optional. Uploaded images are resized and kept in this browser only."
              }
            />
          </div>
        </div>

        {/* ---------- Interests ---------- */}
        <fieldset className="fieldset">
          <legend className="fieldset__legend">
            Interests
            <span className="form-label__required" aria-hidden="true">
              *
            </span>
          </legend>
          <p className="wizard__section-text">What kind of travelers is this place good for?</p>

          <div className="check-grid">
            {INTERESTS.map((interest) => (
              <label key={interest.id} className="check">
                <input
                  type="checkbox"
                  name="interests"
                  value={interest.id}
                  checked={values.interests.includes(interest.id)}
                  onChange={() => toggleInterest(interest.id)}
                />
                {interest.label}
              </label>
            ))}
          </div>

          {errors.interests && <p className="form-error fieldset__error">{errors.interests}</p>}
        </fieldset>

        {/* ---------- Travel information ---------- */}
        <div className="form-row">
          <Input
            label="Best season"
            name="bestSeason"
            required
            maxLength={40}
            placeholder="e.g. Oct – Nov, Mar – Apr"
            value={values.bestSeason}
            onChange={handleChange}
            error={errors.bestSeason}
          />
          <Input
            label="Altitude (metres)"
            name="altitudeM"
            required
            inputMode="numeric"
            maxLength={4}
            value={values.altitudeM}
            onChange={handleChange}
            error={errors.altitudeM}
          />
        </div>

        <div className="form-row">
          <Input
            label="Recommended days"
            name="recommendedDays"
            required
            inputMode="numeric"
            maxLength={2}
            value={values.recommendedDays}
            onChange={handleChange}
            error={errors.recommendedDays}
          />
          <Input
            label="Rating (0 to 5)"
            name="rating"
            required
            inputMode="decimal"
            maxLength={3}
            placeholder="e.g. 4.5"
            value={values.rating}
            onChange={handleChange}
            error={errors.rating}
          />
        </div>

        {/* ---------- Access ---------- */}
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Getting there from Kathmandu</legend>
          <p className="wizard__section-text">
            Use 0 km and 0 hours for Kathmandu itself.
          </p>

          <div className="form-row">
            <Input
              label="Distance (km)"
              name="distanceKm"
              required
              inputMode="numeric"
              maxLength={4}
              value={values.distanceKm}
              onChange={handleChange}
              error={errors.distanceKm}
            />
            <Input
              label="Travel time (hours)"
              name="hours"
              required
              inputMode="decimal"
              maxLength={4}
              value={values.hours}
              onChange={handleChange}
              error={errors.hours}
            />
          </div>

          <Input
            label="How to get there"
            name="mode"
            required
            maxLength={120}
            placeholder="e.g. Tourist bus or private car (flight about 30 min)"
            value={values.mode}
            onChange={handleChange}
            error={errors.mode}
          />
        </fieldset>

        {/* ---------- Costs ---------- */}
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Estimated cost per person per day (NPR)</legend>
          <p className="wizard__section-text">
            Sample estimates for each budget level. Enter 0 if a cost does not apply.
          </p>

          <div className="cost-groups">
            {BUDGET_TIERS.map((tier) => (
              <fieldset key={tier} className="fieldset cost-fieldset">
                <legend className="cost-fieldset__legend">{TIER_LABELS[tier]} level</legend>
                <div className="form-row form-row--3">
                  {COST_FIELDS.map((field) => {
                    const key = costKey(tier, field.key);

                    return (
                      <Input
                        key={key}
                        label={field.label}
                        name={key}
                        required
                        inputMode="numeric"
                        maxLength={7}
                        value={values[key]}
                        onChange={handleChange}
                        error={errors[key]}
                      />
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </fieldset>

        {/* ---------- Flags ---------- */}
        <fieldset className="fieldset">
          <legend className="fieldset__legend">Labels</legend>
          <div className="check-grid">
            <label className="check">
              <input type="checkbox" name="popular" checked={values.popular} onChange={handleChange} />
              Popular destination
            </label>
            <label className="check">
              <input type="checkbox" name="featured" checked={values.featured} onChange={handleChange} />
              Featured destination
            </label>
          </div>
          <p className="wizard__note">
            These labels are kept in the admin data only. The traveler pages read
            their own copy in this demonstration.
          </p>
        </fieldset>
      </form>
    </Modal>
  );
}