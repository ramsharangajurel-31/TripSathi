import { useState } from "react";

import Modal from "../common/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { ATTRACTION_TYPES } from "../../data/adminData";
import { validateAttraction } from "../../utils/adminValidation";
import {
  attractionToValues,
  emptyAttractionValues,
  valuesToAttraction,
} from "../../utils/attractionForm";
import { digitsOnly, focusField } from "../../utils/destinationForm";
import { formatCurrency } from "../../utils/formatCurrency";
import { hasErrors } from "../../utils/validation";

/**
 * Dialog for adding or editing an attraction. Mounted only while open (the
 * page gives it a fresh `key`), so the form always starts from the right
 * values.
 *
 * Props
 *  mode          "add" | "edit"
 *  attraction    the attraction being edited (edit mode)
 *  destinations  all destinations, for the destination drop-down
 *  others        every other attraction, to reject duplicate names
 *  onSave        function(data): the page stores the attraction
 *  onClose       function()
 */
export default function AttractionFormModal({
  mode,
  attraction,
  destinations,
  others,
  onSave,
  onClose,
}) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState(() =>
    isEdit ? attractionToValues(attraction) : emptyAttractionValues()
  );
  const [errors, setErrors] = useState({});

  const destinationOptions = [...destinations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({ value: item.id, label: item.name }));

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next = name === "entryFee" ? digitsOnly(value) : value;

    setValues((previous) => ({ ...previous, [name]: next }));
    setErrors((previous) => (previous[name] ? { ...previous, [name]: "" } : previous));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    const formErrors = validateAttraction(values, {
      destinationIds: destinations.map((item) => item.id),
      others,
    });
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      focusField(form, Object.keys(formErrors)[0]);
      return;
    }
    onSave(valuesToAttraction(values));
  };

  const fee = values.entryFee === "" ? null : Number(values.entryFee);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Edit ${attraction.name}` : "Add attraction"}
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="attraction-form">
            {isEdit ? "Save changes" : "Add attraction"}
          </Button>
        </>
      }
    >
      <form id="attraction-form" className="auth__form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Attraction name"
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
            name="type"
            required
            placeholder="Select a type"
            options={ATTRACTION_TYPES}
            value={values.type}
            onChange={handleChange}
            error={errors.type}
          />
        </div>

        <Input
          as="textarea"
          rows={3}
          label="Description"
          name="description"
          maxLength={400}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
          hint={`${values.description.length}/400 characters. Optional.`}
        />

        <Input
          label="Entry fee per person (NPR)"
          name="entryFee"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={values.entryFee}
          onChange={handleChange}
          error={errors.entryFee}
          hint={
            fee === null
              ? "Leave empty if the fee is unknown. Enter 0 if entry is free."
              : fee === 0
                ? "Entry is free."
                : `${formatCurrency(fee)} per person. Check the current fee before relying on it.`
          }
        />
      </form>
    </Modal>
  );
}