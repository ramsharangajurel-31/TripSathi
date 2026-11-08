import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import Modal from "./Modal";
import Button from "../ui/Button";
import classNames from "../../utils/classNames";

/**
 * Confirmation dialog for destructive or irreversible actions
 * (delete trip, delete user, discard changes ...).
 *
 * Built on Modal, so it inherits Escape to close, focus trap, scroll lock
 * and focus return. Focus starts on the Cancel button, so pressing Enter by
 * accident never confirms a deletion.
 *
 * Props
 *  isOpen         boolean – controls visibility
 *  onConfirm      function – called when the confirm button is clicked
 *  onCancel       function – called for Cancel, Escape and backdrop click
 *  title          heading (default "Are you sure?")
 *  message        explanation of what will happen
 *  confirmLabel   label of the confirm button (default "Confirm")
 *  cancelLabel    label of the cancel button (default "Cancel")
 *  variant        "danger" (default) | "warning"
 *  loading        shows a spinner on the confirm button and blocks closing
 *                 (use while an async delete is running)
 *  icon           custom React node for the round icon
 *
 * Example
 *  <ConfirmDialog
 *    isOpen={Boolean(tripToDelete)}
 *    title="Delete this trip?"
 *    message="This itinerary will be permanently removed from your saved trips."
 *    confirmLabel="Delete trip"
 *    onConfirm={handleDelete}
 *    onCancel={() => setTripToDelete(null)}
 *  />
 */
export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  icon,
}) {
  const isDanger = variant === "danger";
  const resolvedIcon = icon || (isDanger ? <FiTrash2 /> : <FiAlertTriangle />);

  // Block every way of closing while an action is running.
  const handleClose = () => {
    if (!loading && onCancel) onCancel();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={title}
      size="sm"
      hideCloseButton
      closeOnOverlayClick={!loading}
    >
      <div className="confirm">
        <span
          className={classNames(
            "confirm__icon",
            isDanger && "confirm__icon--danger"
          )}
          aria-hidden="true"
        >
          {resolvedIcon}
        </span>

        <h2 className="confirm__title">{title}</h2>
        {message && <p className="confirm__message">{message}</p>}

        <div className="modal__footer">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            data-autofocus
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}