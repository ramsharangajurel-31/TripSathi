import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  FiEye,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from "react-icons/fi";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AdminNotice from "../../components/admin/AdminNotice";
import AdminStats from "../../components/admin/AdminStats";
import DataTable from "../../components/admin/DataTable";
import UserDetailsModal from "../../components/admin/UserDetailsModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import useAdminUsers from "../../hooks/useAdminUsers";
import useAuth from "../../hooks/useAuth";
import usePageTitle from "../../hooks/usePageTitle";
import { ADMIN_PATHS } from "../../data/adminNavigation";
import { ROLES, USER_STATUS } from "../../data/demoUsers";
import { formatDate, toISODate } from "../../utils/formatDate";
import getInitials from "../../utils/getInitials";

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const joinedText = (user) => formatDate(toISODate(new Date(user.createdAt)));

/**
 * Admin page: list, search, filter, view, activate, deactivate and delete
 * accounts. Works on the real account list, so the changes take effect for
 * real: a deactivated user can no longer log in.
 */
export default function ManageUsers() {
  usePageTitle("Manage users");

  const { user: currentUser } = useAuth();
  const { users, allTrips, setUserStatus, deleteUser } = useAdminUsers();

  const [viewingId, setViewingId] = useState(null);
  const [pending, setPending] = useState(null); // { type: "deactivate" | "delete", user }

  const isSelf = (user) => Boolean(currentUser) && currentUser.id === user.id;
  const viewing = users.find((user) => user.id === viewingId);

  const tripsOf = (userId) => allTrips.filter((trip) => trip.userId === userId);

  // ---------- Statistics ----------
  const counts = useMemo(() => {
    const active = users.filter((user) => user.status === USER_STATUS.active).length;
    const administrators = users.filter((user) => user.role === ROLES.admin).length;
    return { active, inactive: users.length - active, administrators };
  }, [users]);

  const stats = [
    { id: "total", label: "Total users", value: users.length, icon: <FiUsers /> },
    { id: "active", label: "Active", value: counts.active, icon: <FiUserCheck /> },
    { id: "inactive", label: "Inactive", value: counts.inactive, icon: <FiUserX /> },
    { id: "admins", label: "Administrators", value: counts.administrators, icon: <FiShield /> },
  ];

  // ---------- Actions ----------
  const activate = (user) => {
    const result = setUserStatus(user.id, USER_STATUS.active);
    if (result.ok) toast.success(`${user.fullName} is active again.`);
    else toast.error(result.error);
  };

  const handleConfirm = () => {
    if (!pending) return;
    const { type, user } = pending;

    if (type === "deactivate") {
      const result = setUserStatus(user.id, USER_STATUS.inactive);
      if (result.ok) toast.success(`${user.fullName} was deactivated.`);
      else toast.error(result.error);
    } else {
      const result = deleteUser(user.id);
      if (result.ok) {
        if (viewingId === user.id) setViewingId(null);
        toast.info(
          `${user.fullName} was deleted${
            result.removedTrips > 0
              ? `, with ${plural(result.removedTrips, "trip", "trips")}`
              : ""
          }.`
        );
      } else {
        toast.error(result.error);
      }
    }
    setPending(null);
  };

  // ---------- Table ----------
  const columns = [
    {
      key: "name",
      label: "User",
      rowHeader: true,
      sortable: true,
      sortValue: (row) => row.fullName.toLowerCase(),
      render: (row) => (
        <div className="table__cell-main">
          <span className="avatar" aria-hidden="true">
            {getInitials(row.fullName)}
          </span>
          <div>
            <p className="cell-title">
              {row.fullName} {isSelf(row) && <Badge variant="info">You</Badge>}
            </p>
            <p className="cell-sub">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row) => (
        <Badge variant={row.role === ROLES.admin ? "primary" : "neutral"}>
          {row.role === ROLES.admin ? "Administrator" : "Traveler"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={row.status === USER_STATUS.active ? "success" : "danger"}>
          {row.status === USER_STATUS.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { key: "tripCount", label: "Trips", sortable: true },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (row) => joinedText(row),
    },
    {
      key: "actions",
      label: "Actions",
      hideLabel: true,
      render: (row) => {
        const self = isSelf(row);
        const active = row.status === USER_STATUS.active;

        return (
          <div className="table__actions">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setViewingId(row.id)}
              aria-label={`View ${row.fullName}`}
            >
              <FiEye aria-hidden="true" />
            </Button>

            {active ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                disabled={self}
                title={self ? "You cannot deactivate your own account" : undefined}
                onClick={() => setPending({ type: "deactivate", user: row })}
                aria-label={
                  self
                    ? `Deactivate ${row.fullName} (not available for your own account)`
                    : `Deactivate ${row.fullName}`
                }
              >
                <FiUserX aria-hidden="true" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => activate(row)}
                aria-label={`Activate ${row.fullName}`}
              >
                <FiUserCheck aria-hidden="true" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              iconOnly
              disabled={self}
              title={self ? "You cannot delete your own account" : undefined}
              onClick={() => setPending({ type: "delete", user: row })}
              aria-label={
                self
                  ? `Delete ${row.fullName} (not available for your own account)`
                  : `Delete ${row.fullName}`
              }
            >
              <FiTrash2 aria-hidden="true" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filters = [
    {
      id: "role",
      label: "Role",
      options: [
        { value: ROLES.user, label: "Traveler" },
        { value: ROLES.admin, label: "Administrator" },
      ],
      match: (row, value) => row.role === value,
    },
    {
      id: "status",
      label: "Status",
      options: [
        { value: USER_STATUS.active, label: "Active" },
        { value: USER_STATUS.inactive, label: "Inactive" },
      ],
      match: (row, value) => row.status === value,
    },
  ];

  // ---------- Confirmation text ----------
  const pendingTrips = pending ? tripsOf(pending.user.id).length : 0;
  const isDelete = pending?.type === "delete";

  return (
    <>
      <PageHeader
        title="Manage users"
        subtitle="Registered accounts. Changes here take effect immediately."
        breadcrumbs={[
          { label: "Admin", to: ADMIN_PATHS.home },
          { label: "Users" },
        ]}
      />

      <AdminNotice />

      <AdminStats stats={stats} />

      <DataTable
        caption="Registered users"
        columns={columns}
        rows={users}
        getSearchText={(row) => `${row.fullName} ${row.email} ${row.phone || ""} ${row.location || ""}`}
        searchLabel="Search users"
        searchPlaceholder="Search by name, email or phone"
        filters={filters}
        initialSort={{ key: "name", direction: "asc" }}
        pageSize={10}
        itemLabel="users"
        emptyState={{
          icon: <FiUsers />,
          title: "No users",
          message: "Registered accounts will appear here.",
        }}
      />

      <p className="cost-notes">
        <span>
          Deactivating an account stops that person from logging in and ends any open session.
          Deleting an account also removes its trips and notifications.{" "}
        </span>
        <span>You cannot deactivate or delete your own account.</span>
      </p>

      {viewing && (
        <UserDetailsModal
          key={viewing.id}
          user={viewing}
          trips={tripsOf(viewing.id)}
          isSelf={isSelf(viewing)}
          onActivate={() => activate(viewing)}
          onDeactivate={() => setPending({ type: "deactivate", user: viewing })}
          onDelete={() => setPending({ type: "delete", user: viewing })}
          onClose={() => setViewingId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pending)}
        variant={isDelete ? "danger" : "warning"}
        title={isDelete ? "Delete this user?" : "Deactivate this user?"}
        message={
          pending
            ? isDelete
              ? `${pending.user.fullName} (${pending.user.email}) will be deleted together with ${plural(
                  pendingTrips,
                  "trip",
                  "trips"
                )} and all notifications. This cannot be undone.`
              : `${pending.user.fullName} will no longer be able to log in, and will be signed out if they are signed in now. You can activate the account again at any time.`
            : ""
        }
        confirmLabel={isDelete ? "Delete user" : "Deactivate"}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}