import { useState } from "react";

import Modal from "../common/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { DAY_NOTE_MAX } from "../../utils/tripValidation";

/**
 * Small dialog to write or clear the note of one day.
 * Props: day, onSave(note), onClose()
 */
export default function DayNoteModal({ day, onSave, onClose }) {
  const [note, setNote] = useState(day.notes || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (note.length > DAY_NOTE_MAX) {
      setError(`Keep this under ${DAY_NOTE_MAX} characters.`);
      return;
    }
    onSave(note);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Note for day ${day.dayNumber}`}
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="day-note-form">
            Save note
          </Button>
        </>
      }
    >
      <form id="day-note-form" onSubmit={handleSubmit} noValidate>
        <Input
          as="textarea"
          rows={4}
          label="Note"
          name="note"
          maxLength={DAY_NOTE_MAX}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setError("");
          }}
          error={error}
          hint={`${note.length}/${DAY_NOTE_MAX} characters. Leave empty to remove the note.`}
          data-autofocus
        />
      </form>
    </Modal>
  );
}