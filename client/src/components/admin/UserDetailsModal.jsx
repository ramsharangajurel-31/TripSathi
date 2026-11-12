import { FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";

import Modal from "../common/Modal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { ROLES, USER_STATUS } from "../../data/demoUsers";
import { formatDate, formatDateRange, toISODate } from "../../utils/formatDate";
import getInitials from "../../utils/getInitials";

const MAX_TRIPS_SHOWN = 5;

function Row({ label, children }) {
  return (
    <div className="info-list__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Read-only view of one account, with the status and delete actions.
 *
 * Props
 *  user          the account (without its password)
 *  trips         that user's trips
 *  isSelf        true for the signed-in administrator's own account
 *  onActivate    function(): sets the account active
 *  onDeactivate  function(): the page asks for confirmation first
 *  onDelete      function(): the page asks for confirmation first
 *  onClose       function()
 */
export default function UserDetailsModal({
  user,
  trips,
  isSelf,
  onActivate,
  onDeactivate,
  onDelete,
  onClose,
}) {
  const isActive = user.status === USER_STATUS.active;
  const savedCount = trips.filter((trip) => trip.saved).length;
  const recent = [...trips]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, MAX_TRIPS_SHOWN);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="User details"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {isActive ? (
            <Button
              variant="secondary"
              leftIcon={<FiUserX />}
              onClick={onDeactivate}
              disabled={isSelf}
            >
              Deactivate
            </Button>
          ) : (
            <Button leftIcon={<FiUserCheck />} onClick={onActivate} disabled={isSelf}>
              Activate
            </Button>
          )}
          <Button
            variant="outline-danger"
            leftIcon={<FiTrash2 />}
            onClick={onDelete}
            disabled={isSelf}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="account-summary__top" style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem" }}>
        <span className="avatar avatar--lg" aria-hidden="true">
          {getInitials(user.fullName)}
        </span>
        <h3 className="account-summary__name">{user.fullName}</h3>
        <p className="account-summary__email">{user.email}</p>
        <div className="review-tags" style={{ justifyContent: "center", marginTop: "0.75rem" }}>
          <Badge variant={user.role === ROLES.admin ? "primary" : "neutral"}>
            {user.role === ROLES.admin ? "Administrator" : "Traveler"}
          </Badge>
          <Badge variant={isActive ? "success" : "danger"}>{isActive ? "Active" : "Inactive"}</Badge>
          {isSelf && <Badge variant="info">You</Badge>}
        </div>
      </div>

      {isSelf && (
        <p className="wizard__note" style={{ marginTop: 0, marginBottom: "1rem" }}>
          This is your own account, so it can&apos;t be deactivated or deleted from here.
        </p>
      )}

      <dl className="info-list">
        <Row label="Phone">{user.phone || "Not set"}</Row>
        <Row label="Location">{user.location || "Not set"}</Row>
        <Row label="Member since">{formatDate(toISODate(new Date(user.createdAt)))}</Row>
        <Row label="Trips created">{trips.length}</Row>
        <Row label="Saved trips">{savedCount}</Row>
      </dl>

      {recent.length > 0 && (
        <>
          <h3 className="whatif__group-title" style={{ marginTop: "1.5rem" }}>
            Recent trips
          </h3>
          <ul className="insights" style={{ marginBottom: 0 }}>
            {recent.map((trip) => (
              <li key={trip.id}>
                {trip.title} ({formatDateRange(trip.departureDate, trip.returnDate)})
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}