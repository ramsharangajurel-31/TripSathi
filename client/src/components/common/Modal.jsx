import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import classNames from "../../utils/classNames";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// Tracks open modals so body scroll is unlocked only when the last one closes.
let openModalCount = 0;

/**
 * Accessible modal dialog.
 *
 * Behaviour
 *  - Rendered in a portal on document.body
 *  - Escape key closes it
 *  - Clicking the dark backdrop closes it (can be disabled)
 *  - Keyboard focus is trapped inside while open (Tab / Shift+Tab loop)
 *  - Focus moves into the dialog on open and returns to the element that
 *    opened it on close
 *  - Page scrolling is locked while open
 *
 * Props
 *  isOpen               boolean – controls visibility
 *  onClose              function – called for Escape, backdrop and X button
 *  title                heading text (also used as the accessible name)
 *  ariaLabel            accessible name when there is no visible title
 *  size                 "sm" | "md" (default) | "lg"
 *  footer               React node – usually action buttons
 *  closeOnOverlayClick  default true. Set false for forms with unsaved data
 *  hideCloseButton      hides the X button
 *  className            extra class for the dialog box
 *
 * To choose which element gets focus first, add the attribute
 * `data-autofocus` to it. Otherwise the first focusable element in the
 * body receives focus.
 *
 * Example
 *  <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit activity"
 *         footer={<>
 *           <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *           <Button type="submit" form="activity-form">Save</Button>
 *         </>}>
 *    <form id="activity-form">...</form>
 *  </Modal>
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  size = "md",
  footer,
  closeOnOverlayClick = true,
  hideCloseButton = false,
  className,
  children,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);

  // Keep the latest onClose without re-running the focus effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;

    openModalCount += 1;
    document.body.classList.add("no-scroll");

    // Initial focus
    const body = dialog.querySelector(".modal__body");
    const initialTarget =
      dialog.querySelector("[data-autofocus]") ||
      (body && body.querySelector(FOCUSABLE_SELECTOR)) ||
      dialog.querySelector(FOCUSABLE_SELECTOR) ||
      dialog;
    initialTarget.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (onCloseRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialog.querySelectorAll(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) {
        document.body.classList.remove("no-scroll");
      }

      if (
        previouslyFocused &&
        typeof previouslyFocused.focus === "function" &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // mousedown (not click) so that selecting text inside the dialog and
  // releasing the mouse on the backdrop does not close it by accident.
  const handleOverlayMouseDown = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      if (onClose) onClose();
    }
  };

  const showHeader = Boolean(title) || !hideCloseButton;

  return createPortal(
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        ref={dialogRef}
        className={classNames(
          "modal",
          size !== "md" && `modal--${size}`,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
      >
        {showHeader && (
          <div className="modal__header">
            {title ? (
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideCloseButton && (
              <button
                type="button"
                className="modal__close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <FiX size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}