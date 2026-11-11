import { useState } from "react";
import { toast } from "react-toastify";
import { FiEdit2, FiEye, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SafeImage from "../../components/common/SafeImage";
import AdminNotice from "../../components/admin/AdminNotice";
import DataTable from "../../components/admin/DataTable";
import DestinationDetailsModal from "../../components/admin/DestinationDetailsModal";
import DestinationFormModal from "../../components/admin/DestinationFormModal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import useAdminData from "../../hooks/useAdminData";
import usePageTitle from "../../hooks/usePageTitle";
import { ADMIN_PATHS } from "../../data/adminNavigation";
import { INTERESTS } from "../../data/destinations";

const INTEREST_LABELS = Object.fromEntries(INTERESTS.map((item) => [item.id, item.label]));
const MAX_INTEREST_BADGES = 2;

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/** Admin page: list, search, filter, add, edit, view and delete destinations. */
export default function ManageDestinations() {
  usePageTitle("Manage destinations");

  const {
    destinations,
    addDestination,
    updateDestination,
    deleteDestination,
    countsByDestination,
  } = useAdminData();

  const [editor, setEditor] = useState(null); // { mode, destination?, key }
  const [viewingId, setViewingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const countsOf = (id) => countsByDestination[id] || { attractions: 0, activities: 0 };
  const viewing = destinations.find((item) => item.id === viewingId);

  const openEditor = (config) => setEditor({ ...config, key: `${config.mode}-${Date.now()}` });

  const handleSave = (data) => {
    if (editor.mode === "add") {
      const created = addDestination(data);
      toast.success(`"${created.name}" added.`);
    } else {
      updateDestination(editor.destination.id, data);
      toast.success(`"${data.name}" updated.`);
    }
    setEditor(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;

    const removed = deleteDestination(pendingDelete.id);
    toast.info(
      `"${pendingDelete.name}" deleted, with ${plural(removed.attractions, "attraction", "attractions")} and ${plural(
        removed.activities,
        "activity",
        "activities"
      )}.`
    );
    setPendingDelete(null);
  };

  const columns = [
    {
      key: "name",
      label: "Destination",
      rowHeader: true,
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <div className="table__cell-main">
          <span className="thumb">
            <SafeImage src={row.image} alt="" />
          </span>
          <div>
            <p className="cell-title">{row.name}</p>
            <p className="cell-sub">{row.tagline}</p>
          </div>
        </div>
      ),
    },
    { key: "province", label: "Province", sortable: true },
    {
      key: "interests",
      label: "Interests",
      render: (row) => {
        const shown = row.interests.slice(0, MAX_INTEREST_BADGES);
        const more = row.interests.length - shown.length;

        return (
          <div className="review-tags">
            {shown.map((id) => (
              <Badge key={id} variant="neutral">
                {INTEREST_LABELS[id] || id}
              </Badge>
            ))}
            {more > 0 && <Badge variant="neutral">+{more}</Badge>}
          </div>
        );
      },
    },
    {
      key: "recommendedDays",
      label: "Days",
      sortable: true,
      render: (row) => `${row.recommendedDays} ${row.recommendedDays === 1 ? "day" : "days"}`,
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (row) => Number(row.rating).toFixed(1),
    },
    {
      key: "content",
      label: "Content",
      sortable: true,
      sortValue: (row) => countsOf(row.id).attractions + countsOf(row.id).activities,
      render: (row) => {
        const counts = countsOf(row.id);
        return `${plural(counts.attractions, "attraction", "attractions")} · ${plural(
          counts.activities,
          "activity",
          "activities"
        )}`;
      },
    },
    {
      key: "labels",
      label: "Labels",
      render: (row) =>
        row.popular || row.featured ? (
          <div className="review-tags">
            {row.popular && <Badge variant="primary">Popular</Badge>}
            {row.featured && <Badge variant="info">Featured</Badge>}
          </div>
        ) : (
          "—"
        ),
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
            onClick={() => setViewingId(row.id)}
            aria-label={`View ${row.name}`}
          >
            <FiEye aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => openEditor({ mode: "edit", destination: row })}
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

  const provinces = [...new Set(destinations.map((item) => item.province))].sort();

  const filters = [
    {
      id: "province",
      label: "Province",
      options: provinces.map((province) => ({ value: province, label: province })),
      match: (row, value) => row.province === value,
    },
    {
      id: "labels",
      label: "Labels",
      options: [
        { value: "popular", label: "Popular" },
        { value: "featured", label: "Featured" },
        { value: "none", label: "No label" },
      ],
      match: (row, value) =>
        value === "none" ? !row.popular && !row.featured : Boolean(row[value]),
    },
  ];

  return (
    <>
      <PageHeader
        title="Manage destinations"
        subtitle="Places travelers can plan trips to."
        breadcrumbs={[
          { label: "Admin", to: ADMIN_PATHS.home },
          { label: "Destinations" },
        ]}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => openEditor({ mode: "add" })}>
            Add destination
          </Button>
        }
      />

      <AdminNotice />

      <DataTable
        caption="Destinations"
        columns={columns}
        rows={destinations}
        getSearchText={(row) => `${row.name} ${row.province} ${row.tagline}`}
        searchLabel="Search destinations"
        searchPlaceholder="Search by name, province or tagline"
        filters={filters}
        initialSort={{ key: "name", direction: "asc" }}
        pageSize={8}
        itemLabel="destinations"
        emptyState={{
          icon: <FiMapPin />,
          title: "No destinations",
          message: "Add a destination, or restore the demonstration catalog from the admin overview.",
          actionLabel: "Add destination",
          onAction: () => openEditor({ mode: "add" }),
        }}
      />

      {editor && (
        <DestinationFormModal
          key={editor.key}
          mode={editor.mode}
          destination={editor.destination}
          others={destinations.filter((item) => item.id !== editor.destination?.id)}
          onSave={handleSave}
          onClose={() => setEditor(null)}
        />
      )}

      {viewing && (
        <DestinationDetailsModal
          key={viewing.id}
          destination={viewing}
          counts={countsOf(viewing.id)}
          onEdit={() => {
            setViewingId(null);
            openEditor({ mode: "edit", destination: viewing });
          }}
          onClose={() => setViewingId(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this destination?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed together with its ${plural(
                countsOf(pendingDelete.id).attractions,
                "attraction",
                "attractions"
              )} and ${plural(
                countsOf(pendingDelete.id).activities,
                "activity",
                "activities"
              )}. You can bring the originals back with "Restore demonstration catalog" on the overview page.`
            : ""
        }
        confirmLabel="Delete destination"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}