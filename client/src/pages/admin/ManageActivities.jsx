import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiActivity,
  FiCreditCard,
  FiEdit2,
  FiGift,
  FiInfo,
  FiPlus,
  FiTrash2,
  FiTrendingUp,
} from "react-icons/fi";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AdminNotice from "../../components/admin/AdminNotice";
import AdminStats from "../../components/admin/AdminStats";
import CatalogActivityFormModal from "../../components/admin/CatalogActivityFormModal";
import DataTable from "../../components/admin/DataTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import useAdminData from "../../hooks/useAdminData";
import usePageTitle from "../../hooks/usePageTitle";
import { ACTIVITY_INTENSITIES, ACTIVITY_SLOTS } from "../../data/activities";
import { ADMIN_PATHS } from "../../data/adminNavigation";
import { INTERESTS } from "../../data/destinations";
import { describeDuration } from "../../utils/activityForm";
import { formatCurrency } from "../../utils/formatCurrency";

const TYPE_LABELS = Object.fromEntries(INTERESTS.map((item) => [item.id, item.label]));
const DIFFICULTY_LABELS = Object.fromEntries(ACTIVITY_INTENSITIES.map((item) => [item.id, item.label]));
const DIFFICULTY_VARIANTS = { easy: "success", moderate: "warning", challenging: "danger" };
const TIME_LABELS = Object.fromEntries(ACTIVITY_SLOTS.map((slot) => [slot.id, slot.label]));

const costText = (cost) => (cost === 0 ? "Free" : formatCurrency(cost));

/**
 * Admin page: list, search, filter, add, edit and delete catalog activities,
 * with a cost summary on top.
 */
export default function ManageActivities() {
  usePageTitle("Manage activities");

  const {
    destinations,
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    getDestinationName,
  } = useAdminData();

  const [editor, setEditor] = useState(null); // { mode, activity?, key }
  const [pendingDelete, setPendingDelete] = useState(null);

  const canAdd = destinations.length > 0;

  const openEditor = (config) => setEditor({ ...config, key: `${config.mode}-${Date.now()}` });

  // ---------- Cost summary ----------
  const summary = useMemo(() => {
    const paid = activities.filter((item) => item.costPerPerson > 0);
    const total = paid.reduce((sum, item) => sum + item.costPerPerson, 0);
    const highest = paid.reduce(
      (top, item) => (!top || item.costPerPerson > top.costPerPerson ? item : top),
      null
    );

    return {
      paidCount: paid.length,
      freeCount: activities.length - paid.length,
      average: paid.length > 0 ? Math.round(total / paid.length) : 0,
      highest,
    };
  }, [activities]);

  const stats = [
    { id: "count", label: "Activities", value: activities.length, icon: <FiActivity /> },
    {
      id: "average",
      label: "Average cost per person",
      value: summary.paidCount > 0 ? formatCurrency(summary.average) : "—",
      hint: `${summary.paidCount} paid ${summary.paidCount === 1 ? "activity" : "activities"}`,
      icon: <FiCreditCard />,
    },
    { id: "free", label: "Free activities", value: summary.freeCount, icon: <FiGift /> },
    {
      id: "highest",
      label: "Highest cost per person",
      value: summary.highest ? formatCurrency(summary.highest.costPerPerson) : "—",
      hint: summary.highest ? summary.highest.name : undefined,
      icon: <FiTrendingUp />,
    },
  ];

  // ---------- Actions ----------
  const handleSave = (data) => {
    if (editor.mode === "add") {
      const created = addActivity(data);
      toast.success(`"${created.name}" added to ${getDestinationName(created.destinationId)}.`);
    } else {
      updateActivity(editor.activity.id, data);
      toast.success(`"${data.name}" updated.`);
    }
    setEditor(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteActivity(pendingDelete.id);
    toast.info(`"${pendingDelete.name}" deleted.`);
    setPendingDelete(null);
  };

  // ---------- Table ----------
  const columns = [
    {
      key: "name",
      label: "Activity",
      rowHeader: true,
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <div>
          <p className="cell-title">{row.name}</p>
          {row.description && <p className="cell-sub">{row.description}</p>}
        </div>
      ),
    },
    {
      key: "destination",
      label: "Destination",
      sortable: true,
      sortValue: (row) => getDestinationName(row.destinationId).toLowerCase(),
      render: (row) => getDestinationName(row.destinationId),
    },
    {
      key: "category",
      label: "Type",
      sortable: true,
      sortValue: (row) => (TYPE_LABELS[row.category] || row.category).toLowerCase(),
      render: (row) => <Badge variant="neutral">{TYPE_LABELS[row.category] || row.category}</Badge>,
    },
    {
      key: "durationHours",
      label: "Duration",
      sortable: true,
      render: (row) => describeDuration(row.durationHours),
    },
    {
      key: "intensity",
      label: "Difficulty",
      sortable: true,
      sortValue: (row) => ACTIVITY_INTENSITIES.findIndex((item) => item.id === row.intensity),
      render: (row) => (
        <Badge variant={DIFFICULTY_VARIANTS[row.intensity] || "neutral"}>
          {DIFFICULTY_LABELS[row.intensity] || row.intensity}
        </Badge>
      ),
    },
    {
      key: "bestTime",
      label: "Best time",
      sortable: true,
      sortValue: (row) => ACTIVITY_SLOTS.findIndex((slot) => slot.id === row.bestTime),
      render: (row) => TIME_LABELS[row.bestTime] || row.bestTime,
    },
    {
      key: "costPerPerson",
      label: "Cost per person",
      sortable: true,
      render: (row) => costText(row.costPerPerson),
    },
    {
      key: "actions",
      label: "Actions",
      hideLabel: true,
      render: (row) => (
        <div className="table__actions">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => openEditor({ mode: "edit", activity: row })}
            aria-label={`Edit ${row.name}`}
          >
            <FiEdit2 aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => setPendingDelete(row)}
            aria-label={`Delete ${row.name}`}
          >
            <FiTrash2 aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      id: "destination",
      label: "Destination",
      options: [...destinations]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({ value: item.id, label: item.name })),
      match: (row, value) => row.destinationId === value,
    },
    {
      id: "type",
      label: "Type",
      options: INTERESTS.map((item) => ({ value: item.id, label: item.label })),
      match: (row, value) => row.category === value,
    },
    {
      id: "difficulty",
      label: "Difficulty",
      options: ACTIVITY_INTENSITIES.map((item) => ({ value: item.id, label: item.label })),
      match: (row, value) => row.intensity === value,
    },
    {
      id: "cost",
      label: "Cost",
      options: [
        { value: "free", label: "Free" },
        { value: "low", label: "Under NPR 1,000" },
        { value: "mid", label: "NPR 1,000 to 4,999" },
        { value: "high", label: "NPR 5,000 and over" },
      ],
      match: (row, value) => {
        const cost = row.costPerPerson;
        if (value === "free") return cost === 0;
        if (value === "low") return cost > 0 && cost < 1000;
        if (value === "mid") return cost >= 1000 && cost < 5000;
        return cost >= 5000;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Manage activities"
        subtitle="Things to do at each destination, with their estimated costs."
        breadcrumbs={[
          { label: "Admin", to: ADMIN_PATHS.home },
          { label: "Activities" },
        ]}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => openEditor({ mode: "add" })} disabled={!canAdd}>
            Add activity
          </Button>
        }
      />

      <AdminNotice />

      {!canAdd && (
        <div className="alert alert--warning admin-notice" role="status">
          <FiInfo className="alert__icon" size={18} aria-hidden="true" />
          <span>
            Activities belong to a destination. <Link to={ADMIN_PATHS.destinations}>Add a destination</Link>{" "}
            first, or restore the demonstration catalog from the overview page.
          </span>
        </div>
      )}

      <AdminStats stats={stats} />

      <DataTable
        caption="Activities"
        columns={columns}
        rows={activities}
        getSearchText={(row) =>
          `${row.name} ${getDestinationName(row.destinationId)} ${TYPE_LABELS[row.category] || ""} ${
            row.description || ""
          }`
        }
        searchLabel="Search activities"
        searchPlaceholder="Search by name, destination or type"
        filters={filters}
        initialSort={{ key: "name", direction: "asc" }}
        pageSize={10}
        itemLabel="activities"
        emptyState={{
          icon: <FiActivity />,
          title: "No activities",
          message: canAdd
            ? "Add an activity, or restore the demonstration catalog from the admin overview."
            : "Add a destination first, then activities can be added to it.",
          actionLabel: canAdd ? "Add activity" : undefined,
          onAction: canAdd ? () => openEditor({ mode: "add" }) : undefined,
        }}
      />

      <p className="cost-notes">
        <span>Costs are sample estimates per person, for demonstration. </span>
        <span>
          Trips that were already planned keep their own copy of each activity, so editing the
          catalog does not change them.
        </span>
      </p>

      {editor && (
        <CatalogActivityFormModal
          key={editor.key}
          mode={editor.mode}
          activity={editor.activity}
          destinations={destinations}
          others={activities.filter((item) => item.id !== editor.activity?.id)}
          onSave={handleSave}
          onClose={() => setEditor(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this activity?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" in ${getDestinationName(
                pendingDelete.destinationId
              )} will be removed. You can bring the originals back with "Restore demonstration catalog" on the overview page.`
            : ""
        }
        confirmLabel="Delete activity"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}