import { useState } from "react";

import Modal from "../common/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { TRIP_LIMITS } from "../../data/tripOptions";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateRange, addDays } from "../../utils/formatDate";
import { NOTES_MAX, validateTripInfo } from "../../utils/tripValidation";
import { getDurationDays } from "../../utils/tripUtils";
import { hasErrors } from "../../utils/validation";

/**
 * Dialog for the trip's basic details. Mounted only while open, so its form
 * always starts from the trip's current values.
 *
 * Props
 *  trip     the trip being edited
 *  onSave   function(values): the page applies the update
 *  onClose  function()
 */
export default function EditTripModal({ trip, onSave, onClose }) {
  const [values, setValues] = useState(() => ({
    title: trip.title,
    departureDate: trip.departureDate,
    budgetTotal: String(trip.budget?.total ?? ""),
    adults: String(trip.travelers?.adults ?? 1),
    children: String(trip.travelers?.children ?? 0),
    notes: trip.notes || "",
  }));
  const [errors, setErrors] = useState({});

  const length = getDurationDays(trip.departureDate, trip.returnDate);
  const newReturn = values.departureDate ? addDays(values.departureDate, length - 1) : "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((previous) => ({
      ...previous,
      [name]: name === "budgetTotal" ? value.replace(/\D/g, "") : value,
    }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formErrors = validateTripInfo(values);
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      form.elements[Object.keys(formErrors)[0]]?.focus();
      return;
    }
    onSave(values);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit trip details"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-trip-form">
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-trip-form" className="auth__form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Trip name"
          name="title"
          required
          maxLength={100}
          value={values.title}
          onChange={handleChange}
          error={errors.title}
          data-autofocus
        />

        <Input
          label="Departure date"
          name="departureDate"
          type="date"
          required
          value={values.departureDate}
          onChange={handleChange}
          error={errors.departureDate}
          hint={
            newReturn
              ? `The trip keeps its ${length}-day length: ${formatDateRange(values.departureDate, newReturn)}.`
              : undefined
          }
        />

        <Input
          label="Total budget (NPR)"
          name="budgetTotal"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={String(TRIP_LIMITS.maxBudget).length}
          value={values.budgetTotal}
          onChange={handleChange}
          error={errors.budgetTotal}
          hint={values.budgetTotal ? formatCurrency(Number(values.budgetTotal)) : undefined}
        />

        <div className="form-row">
          <Input
            label="Adults"
            name="adults"
            type="number"
            required
            inputMode="numeric"
            min={TRIP_LIMITS.minAdults}
            max={TRIP_LIMITS.maxAdults}
            value={values.adults}
            onChange={handleChange}
            error={errors.adults}
          />
          <Input
            label="Children"
            name="children"
            type="number"
            required
            inputMode="numeric"
            min={0}
            max={TRIP_LIMITS.maxChildren}
            value={values.children}
            onChange={handleChange}
            error={errors.children}
          />
        </div>
        <p className="wizard__note">
          Changing travelers recalculates the cost. Activities and days are not
          changed. To plan different destinations or a different length, create
          a new trip.
        </p>

        <Input
          as="textarea"
          rows={3}
          label="Notes"
          name="notes"
          maxLength={NOTES_MAX}
          value={values.notes}
          onChange={handleChange}
          error={errors.notes}
          hint={`${values.notes.length}/${NOTES_MAX} characters. Optional.`}
        />
      </form>
    </Modal>
  );
}