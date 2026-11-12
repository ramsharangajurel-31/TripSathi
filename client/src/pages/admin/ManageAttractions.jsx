import { useState } from "react";
import { toast } from "react-toastify";
import { FiEdit2, FiFlag, FiInfo, FiPlus, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AdminNotice from "../../components/admin/AdminNotice";
import AttractionFormModal from "../../components/admin/AttractionFormModal";
import DataTable from "../../components/admin/DataTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import useAdminData from "../../hooks/useAdminData";
import usePageTitle from "../../hooks/usePageTitle";
import { ATTRACTION_TYPES } from "../../data/adminData";
import { ADMIN_PATHS } from "../../data/adminNavigation";
import { describeEntryFee } from "../../utils/attractionForm";
import { formatCurrency } from "../../utils/formatCurrency";

const feeText = (fee) => describeEntryFee(fee, formatCurrency);

/** Admin page: list, search, filter, add, edit and delete attractions. */
export default function ManageAttractions() {
  usePageTitle("Manage attractions");

  const {
    destinations,
    attractions,
    addAttraction,
    updateAttraction,
    deleteAttraction,
    getDestinationName,
  } = useAdminData();

  const [editor, setEditor] = useState(null); // { mode, attraction?, key }
  const [pendingDelete, setPendingDelete] = useState(null);

  const canAdd = destinations.length > 0;

  const openEditor = (config) => setEditor({ ...config, key: `${config.mode}-${Date.now()}` });

  const handleSave = (data) => {
    if (editor.mode === "add") {
      const created = addAttraction(data);
      toast.success(`"${created.name}" added to ${getDestinationName(created.destinationId)}.`);
    } else {
      updateAttraction(editor.attraction.id, data);
      toast.success(`"${data.name}" updated.`);
    }
    setEditor(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteAttraction(pendingDelete.id);
    toast.info(`"${pendingDelete.name}" deleted.`);
    setPendingDelete(null);
  };

  const columns = [
    {
      key: "name",
      label: "Attraction",
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
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => <Badge variant="neutral">{row.type}</Badge>,
    },
    {
      key: "entryFee",
      label: "Entry fee",
      sortable: true,
      sortValue: (row) => row.entryFee,
      render: (row) => feeText(row.entryFee),
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
            onClick={() => openEditor({ mode: "edit", attraction: row })}
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
      options: ATTRACTION_TYPES.map((type) => ({ value: type, label: type })),
      match: (row, value) => row.type === value,
    },
    {
      id: "fee",
      label: "Entry fee",
      options: [
        { value: "paid", label: "Paid" },
        { value: "free", label: "Free" },
        { value: "unknown", label: "Unknown" },
      ],
      match: (row, value) => {
        if (value === "unknown") return row.entryFee === null || row.entryFee === undefined;
        if (value === "free") return row.entryFee === 0;
        return row.entryFee > 0;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Manage attractions"
        subtitle="Places and sights within each destination."
        breadcrumbs={[
          { label: "Admin", to: ADMIN_PATHS.home },
          { label: "Attractions" },
        ]}
        actions={
          <Button leftIcon={<FiPlus />} onClick={() => openEditor({ mode: "add" })} disabled={!canAdd}>
            Add attraction
          </Button>
        }
      />

      <AdminNotice />

      {!canAdd && (
        <div className="alert alert--warning admin-notice" role="status">
          <FiInfo className="alert__icon" size={18} aria-hidden="true" />
          <span>
            Attractions belong to a destination. <Link to={ADMIN_PATHS.destinations}>Add a destination</Link>{" "}
            first, or restore the demonstration catalog from the overview page.
          </span>
        </div>
      )}

      <DataTable
        caption="Attractions"
        columns={columns}
        rows={attractions}
        getSearchText={(row) =>
          `${row.name} ${getDestinationName(row.destinationId)} ${row.type} ${row.description || ""}`
        }
        searchLabel="Search attractions"
        searchPlaceholder="Search by name, destination or type"
        filters={filters}
        initialSort={{ key: "name", direction: "asc" }}
        pageSize={10}
        itemLabel="attractions"
        emptyState={{
          icon: <FiFlag />,
          title: "No attractions",
          message: canAdd
            ? "Add an attraction, or restore the demonstration catalog from the admin overview."
            : "Add a destination first, then attractions can be added to it.",
          actionLabel: canAdd ? "Add attraction" : undefined,
          onAction: canAdd ? () => openEditor({ mode: "add" }) : undefined,
        }}
      />

      {editor && (
        <AttractionFormModal
          key={editor.key}
          mode={editor.mode}
          attraction={editor.attraction}
          destinations={destinations}
          others={attractions.filter((item) => item.id !== editor.attraction?.id)}
          onSave={handleSave}
          onClose={() => setEditor(null)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this attraction?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" in ${getDestinationName(
                pendingDelete.destinationId
              )} will be removed. You can bring the originals back with "Restore demonstration catalog" on the overview page.`
            : ""
        }
        confirmLabel="Delete attraction"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}