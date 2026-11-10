import { useState } from "react";
import { toast } from "react-toastify";
import {
  FiArrowDown,
  FiArrowUp,
  FiEdit2,
  FiInfo,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import ConfirmDialog from "../common/ConfirmDialog";
import Button from "../ui/Button";
import ActivityEditorModal from "./ActivityEditorModal";
import DayNoteModal from "./DayNoteModal";
import ItineraryTimeline from "./ItineraryTimeline";
import {
  addActivity,
  moveActivity,
  removeActivity,
  updateActivity,
  updateDayNote,
} from "../../utils/tripEditUtils";

/**
 * The daily itinerary, with editing controls when `editing` is true.
 *
 * Props
 *  trip      the trip
 *  editing   shows Add / Edit / Remove / Move / day-note controls
 *  onChange  function(updater): updater is (trip) => newTrip. The page
 *            applies it to the latest saved trip.
 */
export default function EditableItinerary({ trip, editing, onChange }) {
  const [activityEditor, setActivityEditor] = useState(null); // { mode, dayId, slot, item?, key }
  const [noteDayId, setNoteDayId] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null); // activity item

  if (!editing) return <ItineraryTimeline trip={trip} />;

  const openEditor = (config) =>
    setActivityEditor({ ...config, key: `${config.mode}-${Date.now()}` });

  const handleSaveActivity = (data, location) => {
    if (activityEditor.mode === "add") {
      onChange((current) => addActivity(current, location.dayId, location.slot, data));
      toast.success("Activity added.");
    } else {
      const itemId = activityEditor.item.id;
      onChange((current) => updateActivity(current, itemId, data, location));
      toast.success("Activity updated.");
    }
    setActivityEditor(null);
  };

  const handleRemove = () => {
    const itemId = pendingRemove.id;
    onChange((current) => removeActivity(current, itemId));
    setPendingRemove(null);
    toast.info("Activity removed.");
  };

  const handleSaveNote = (note) => {
    const dayId = noteDayId;
    onChange((current) => updateDayNote(current, dayId, note));
    setNoteDayId(null);
    toast.success(note.trim() ? "Day note saved." : "Day note removed.");
  };

  const renderActivityActions = (item, day, slotId) => {
    const list = day.slots?.[slotId] || [];
    const index = list.findIndex((entry) => entry.id === item.id);

    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          disabled={index <= 0}
          onClick={() => onChange((current) => moveActivity(current, item.id, -1))}
          aria-label={`Move ${item.name} earlier`}
        >
          <FiArrowUp aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          disabled={index === -1 || index >= list.length - 1}
          onClick={() => onChange((current) => moveActivity(current, item.id, 1))}
          aria-label={`Move ${item.name} later`}
        >
          <FiArrowDown aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => openEditor({ mode: "edit", dayId: day.id, slot: slotId, item })}
          aria-label={`Edit ${item.name}`}
        >
          <FiEdit2 aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => setPendingRemove(item)}
          aria-label={`Remove ${item.name}`}
        >
          <FiTrash2 aria-hidden="true" />
        </Button>
      </>
    );
  };

  const renderSlotFooter = (day, slotId) => (
    <div className="slot__add">
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<FiPlus />}
        onClick={() => openEditor({ mode: "add", dayId: day.id, slot: slotId })}
      >
        Add activity
      </Button>
    </div>
  );

  const renderDayFooter = (day) => (
    <div className="day__edit-bar">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<FiMessageSquare />}
        onClick={() => setNoteDayId(day.id)}
      >
        {day.notes ? "Edit day note" : "Add day note"}
      </Button>
    </div>
  );

  const noteDay = trip.days.find((day) => day.id === noteDayId);

  return (
    <>
        <div
        className="alert alert--info no-print"
        role="note"
        style={{ marginBottom: "1.5rem" }}
      >
        <FiInfo className="alert__icon" size={18} aria-hidden="true" />
        <span>
          You are editing this itinerary. Changes save automatically and the
          costs above update straight away. Use the arrows to reorder activities
          within a time of day, and Edit to move one to another day.
        </span>
      </div>

      <ItineraryTimeline
        trip={trip}
        renderActivityActions={renderActivityActions}
        renderSlotFooter={renderSlotFooter}
        renderDayFooter={renderDayFooter}
      />

      {activityEditor && (
        <ActivityEditorModal
          key={activityEditor.key}
          mode={activityEditor.mode}
          trip={trip}
          initial={{
            dayId: activityEditor.dayId,
            slot: activityEditor.slot,
            item: activityEditor.item,
          }}
          onSave={handleSaveActivity}
          onClose={() => setActivityEditor(null)}
        />
      )}

      {noteDay && (
        <DayNoteModal
          key={noteDay.id}
          day={noteDay}
          onSave={handleSaveNote}
          onClose={() => setNoteDayId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingRemove)}
        title="Remove this activity?"
        message={
          pendingRemove
            ? `"${pendingRemove.name}" will be removed from this day. You can add it again later.`
            : ""
        }
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}