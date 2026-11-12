import { useState } from "react";

import Modal from "../common/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { ACTIVITY_INTENSITIES, ACTIVITY_SLOTS } from "../../data/activities";
import { INTERESTS } from "../../data/destinations";
import { validateCatalogActivity } from "../../utils/adminValidation";
import {
  activityToValues,
  emptyActivityValues,
  valuesToActivity,
} from "../../utils/activityForm";
import { decimalOnly, digitsOnly, focusField } from "../../utils/destinationForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { CHILD_FACTOR } from "../../utils/tripUtils";
import { hasErrors } from "../../utils/validation";

const TYPE_OPTIONS = INTERESTS.map((item) => ({ value: item.id, label: item.label }));
const DIFFICULTY_OPTIONS = ACTIVITY_INTENSITIES.map((item) => ({ value: item.id, label: item.label }));
const TIME_OPTIONS = ACTIVITY_SLOTS.map((slot) => ({ value: slot.id, label: slot.label }));

/**
 * Dialog for adding or editing an activity in the catalog. Mounted only
 * while open (the page gives it a fresh `key`), so the form always starts
 * from the right values.
 *
 * Props
 *  mode          "add" | "edit"
 *  activity      the activity being edited (edit mode)
 *  destinations  all destinations, for the destination drop-down
 *  others        every other activity, to reject duplicate names
 *  onSave        function(data): the page stores the activity
 *  onClose       function()
 */
export default function CatalogActivityFormModal({
  mode,
  activity,
  destinations,
  others,
  onSave,
  onClose,
}) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState(() =>
    isEdit ? activityToValues(activity) : emptyActivityValues()
  );
  const [errors, setErrors] = useState({});

  const destinationOptions = [...destinations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({ value: item.id, label: item.name }));

  const handleChange = (event) => {
    const { name, value } = event.target;

    let next = value;
    if (name === "costPerPerson") next = digitsOnly(value);
    if (name === "durationHours") next = decimalOnly(value);

    setValues((previous) => ({ ...previous, [name]: next }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: "" } : previous));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    const formErrors = validateCatalogActivity(values, {
      destinationIds: destinations.map((item) => item.id),
      others,
    });
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      focusField(form, Object.keys(formErrors)[0]);
      return;
    }
    onSave(valuesToActivity(values));
  };

  const cost = values.costPerPerson === "" ? null : Number(values.costPerPerson);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Edit ${activity.name}` : "Add activity"}
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="catalog-activity-form">
            {isEdit ? "Save changes" : "Add activity"}
          </Button>
        </>
      }
    >
      <form
        id="catalog-activity-form"
        className="auth__form"
        onSubmit={handleSubmit}
        noValidate
      >
        <Input
          label="Activity name"
          name="name"
          required
          maxLength={80}
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          data-autofocus
        />

        <div className="form-row">
          <Select
            label="Destination"
            name="destinationId"
            required
            placeholder="Select a destination"
            options={destinationOptions}
            value={values.destinationId}
            onChange={handleChange}
            error={errors.destinationId}
          />
          <Select
            label="Type"
            name="category"
            required
            placeholder="Select a type"
            options={TYPE_OPTIONS}
            value={values.category}
            onChange={handleChange}
            error={errors.category}
          />
        </div>

        <div className="form-row">
          <Input
            label="Duration (hours)"
            name="durationHours"
            required
            inputMode="decimal"
            maxLength={4}
            value={values.durationHours}
            onChange={handleChange}
            error={errors.durationHours}
            hint="From 0.5 to 24 hours."
          />
          <Input
            label="Estimated cost per person (NPR)"
            name="costPerPerson"
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={7}
            value={values.costPerPerson}
            onChange={handleChange}
            error={errors.costPerPerson}
            hint={
              cost === null
                ? "Enter 0 if the activity is free."
                : cost === 0
                  ? "Free activity."
                  : `${formatCurrency(cost)} per person.`
            }
          />
        </div>
        <p className="wizard__note" style={{ marginTop: 0 }}>
          The cost is for ONE traveler. The trip planner multiplies it by the group
          size, counting children at {Math.round(CHILD_FACTOR * 100)}%. These are
          sample estimates, so check real prices before relying on them.
        </p>

        <div className="form-row">
          <Select
            label="Difficulty"
            name="intensity"
            required
            options={DIFFICULTY_OPTIONS}
            value={values.intensity}
            onChange={handleChange}
            error={errors.intensity}
          />
          <Select
            label="Best time of day"
            name="bestTime"
            required
            options={TIME_OPTIONS}
            value={values.bestTime}
            onChange={handleChange}
            error={errors.bestTime}
          />
        </div>

        <Input
          as="textarea"
          rows={3}
          label="Description"
          name="description"
          maxLength={300}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
          hint={`${values.description.length}/300 characters. Optional.`}
        />
      </form>
    </Modal>
  );
}