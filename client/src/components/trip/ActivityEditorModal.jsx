import { useMemo, useState } from "react";

import Modal from "../common/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import activities, {
  ACTIVITY_SLOTS,
  getActivitiesByDestination,
  getActivityById,
} from "../../data/activities";
import { INTERESTS } from "../../data/destinations";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  ACTIVITY_NOTES_MAX,
  validateActivityForm,
} from "../../utils/tripValidation";
import { getDayActivities, getPayingUnits } from "../../utils/tripUtils";
import { hasErrors } from "../../utils/validation";

const CATEGORY_OPTIONS = INTERESTS.map((item) => ({ value: item.id, label: item.label }));
const SLOT_OPTIONS = ACTIVITY_SLOTS.map((slot) => ({ value: slot.id, label: slot.label }));

function toValues(trip, initial) {
  const item = initial.item;

  return {
    catalogId: "",
    name: item ? item.name : "",
    category: item ? item.category : trip.interests?.[0] || INTERESTS[0].id,
    durationHours: item ? String(item.durationHours ?? "") : "2",
    costPerPerson: item ? String(item.costPerPerson ?? 0) : "0",
    notes: item ? item.notes || "" : "",
    dayId: initial.dayId,
    slot: initial.slot,
  };
}

/**
 * Dialog to add a new activity or edit an existing one. It also moves an
 * activity: choose another day or time of day and save.
 *
 * Mounted only while open (the parent gives it a fresh `key`), so the form
 * always starts clean.
 *
 * Props
 *  mode     "add" | "edit"
 *  trip     the trip (for days, destinations and traveller count)
 *  initial  { dayId, slot, item? }  (item is present when editing)
 *  onSave   function(data, location): data = activity fields,
 *           location = { dayId, slot }
 *  onClose  function()
 */
export default function ActivityEditorModal({ mode, trip, initial, onSave, onClose }) {
  const isEdit = mode === "edit";
  const [values, setValues] = useState(() => toValues(trip, initial));
  const [errors, setErrors] = useState({});

  const dayOptions = trip.days.map((day) => ({
    value: day.id,
    label: `Day ${day.dayNumber}: ${day.title}`,
  }));

  // Catalog activities for the selected day's destination that are not
  // already planned that day.
  const catalogOptions = useMemo(() => {
    const day = trip.days.find((item) => item.id === values.dayId);
    if (!day) return [];

    const usedToday = new Set(getDayActivities(day).map((item) => item.activityId));
    return getActivitiesByDestination(day.destinationId).filter(
      (activity) => !usedToday.has(activity.id)
    );
  }, [trip.days, values.dayId]);

  const units = getPayingUnits(trip);
  const cost = Number(values.costPerPerson);
  const showGroupCost = values.costPerPerson !== "" && Number.isFinite(cost) && cost > 0;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((previous) => {
      const next = { ...previous, [name]: name === "costPerPerson" ? value.replace(/\D/g, "") : value };
      // A different day offers different catalog activities.
      if (name === "dayId") next.catalogId = "";
      return next;
    });
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const handleCatalogChange = (event) => {
    const catalogId = event.target.value;
    const activity = catalogId ? getActivityById(catalogId) : null;

    setValues((previous) =>
      activity
        ? {
            ...previous,
            catalogId,
            name: activity.name,
            category: activity.category,
            durationHours: String(activity.durationHours),
            costPerPerson: String(activity.costPerPerson),
          }
        : { ...previous, catalogId: "" }
    );
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formErrors = validateActivityForm(values, trip.days.map((day) => day.id));
    setErrors(formErrors);

    if (hasErrors(formErrors)) {
      form.elements[Object.keys(formErrors)[0]]?.focus();
      return;
    }

    onSave(
      {
        activityId: values.catalogId || initial.item?.activityId || null,
        name: values.name,
        category: values.category,
        durationHours: values.durationHours,
        costPerPerson: values.costPerPerson,
        notes: values.notes,
      },
      { dayId: values.dayId, slot: values.slot }
    );
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit activity" : "Add activity"}
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="activity-form">
            {isEdit ? "Save changes" : "Add activity"}
          </Button>
        </>
      }
    >
      <form id="activity-form" className="auth__form" onSubmit={handleSubmit} noValidate>
        {!isEdit && (
          <Select
            label="Start from the catalog"
            name="catalogId"
            options={[
              { value: "", label: "Custom activity (fill in below)" },
              ...catalogOptions.map((activity) => ({
                value: activity.id,
                label: `${activity.name} (${
                  activity.costPerPerson === 0 ? "Free" : formatCurrency(activity.costPerPerson)
                })`,
              })),
            ]}
            value={values.catalogId}
            onChange={handleCatalogChange}
            hint={
              catalogOptions.length === 0
                ? "All catalog activities for this destination are already planned on this day."
                : `${catalogOptions.length} suggested for this day's destination. You can still change every field.`
            }
          />
        )}

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
            label="Type"
            name="category"
            required
            options={CATEGORY_OPTIONS}
            value={values.category}
            onChange={handleChange}
            error={errors.category}
          />
          <Input
            label="Duration (hours)"
            name="durationHours"
            type="number"
            required
            inputMode="decimal"
            step="0.5"
            min="0.5"
            max="24"
            value={values.durationHours}
            onChange={handleChange}
            error={errors.durationHours}
          />
        </div>

        <Input
          label="Cost per person (NPR)"
          name="costPerPerson"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={7}
          value={values.costPerPerson}
          onChange={handleChange}
          error={errors.costPerPerson}
          hint={
            showGroupCost
              ? `${formatCurrency(Math.round(cost * units))} for your whole group. Enter 0 for a free activity.`
              : "Enter 0 for a free activity."
          }
        />

        <div className="form-row">
          <Select
            label="Day"
            name="dayId"
            required
            options={dayOptions}
            value={values.dayId}
            onChange={handleChange}
            error={errors.dayId}
          />
          <Select
            label="Time of day"
            name="slot"
            required
            options={SLOT_OPTIONS}
            value={values.slot}
            onChange={handleChange}
            error={errors.slot}
          />
        </div>
        {isEdit && (
          <p className="wizard__note">
            Choose a different day or time to move this activity there.
          </p>
        )}

        <Input
          as="textarea"
          rows={3}
          label="Notes"
          name="notes"
          maxLength={ACTIVITY_NOTES_MAX}
          value={values.notes}
          onChange={handleChange}
          error={errors.notes}
          hint={`${values.notes.length}/${ACTIVITY_NOTES_MAX} characters. Optional.`}
        />
      </form>
    </Modal>
  );
}

// `activities` is imported so a typo in the catalog import fails the build
// here, where the dialog depends on it.
void activities;