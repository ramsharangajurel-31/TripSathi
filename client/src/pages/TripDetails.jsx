import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiBookmark,
  FiCheck,
  FiColumns,
  FiEdit2,
  FiInfo,
  FiSliders,
  FiTrash2,
} from "react-icons/fi";

import PageHeader from "../components/common/PageHeader";
import ErrorState from "../components/common/ErrorState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import AlternativeSuggestions from "../components/trip/AlternativeSuggestions";
import BudgetBreakdown from "../components/trip/BudgetBreakdown";
import EditableItinerary from "../components/trip/EditableItinerary";
import EditTripModal from "../components/trip/EditTripModal";
import ExportItinerary, { PrintHeader } from "../components/trip/ExportItinerary";
import RouteMap from "../components/trip/RouteMap";
import TripSummary from "../components/trip/TripSummary";
import WeatherSection from "../components/trip/WeatherSection";
import usePageTitle from "../hooks/usePageTitle";
import useTrips from "../hooks/useTrips";
import { DASHBOARD_PATHS } from "../data/dashboardData";
import { updateTripInfo } from "../utils/tripEditUtils";

/**
 * Itinerary results page at /dashboard/trips/:tripId.
 *
 * Only trips that belong to the signed-in user can be opened: useTrips
 * returns the current user's trips, so someone else's trip id shows the
 * same "not found" message as a deleted one.
 *
 * Editing: "Edit details" opens a dialog; "Edit itinerary" switches the
 * daily plan into edit mode. Every change is saved at once.
 */
export default function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getTripById, updateTrip, toggleSaved, deleteTrip } = useTrips();

  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const trip = getTripById(tripId);

  usePageTitle(trip ? trip.title : "Trip not found");

  // While a deletion finishes and the page navigates away, show nothing
  // instead of flashing "not found".
  if (deleting) return null;

  if (!trip) {
    return (
      <ErrorState
        title="Trip not found"
        message="This itinerary may have been deleted, or it belongs to a different account."
        secondaryLabel="Back to dashboard"
        secondaryTo={DASHBOARD_PATHS.home}
      />
    );
  }

  const handleToggleSaved = () => {
    const updated = toggleSaved(trip.id);
    if (updated) {
      toast.success(updated.saved ? "Trip saved." : "Trip removed from saved trips.");
    }
  };

  // Applies an edit to the latest saved version of the trip.
  const applyChange = (updater) => updateTrip(trip.id, updater);

  const handleSaveDetails = (values) => {
    applyChange((current) => updateTripInfo(current, values));
    setDetailsOpen(false);
    toast.success("Trip details updated.");
  };

  const handleDelete = () => {
    setDeleting(true);
    navigate(DASHBOARD_PATHS.home);
    deleteTrip(trip.id);
    toast.info("Trip deleted.");
  };

  const notes = trip.generationNotes || [];
  const hasPersonalText = Boolean(trip.description?.trim() || trip.notes?.trim());

  return (
    <>
        <PageHeader
        className="no-print"
        title={trip.title}
        subtitle="Your day-by-day plan with estimated costs."
        breadcrumbs={[
          { label: "Dashboard", to: DASHBOARD_PATHS.home },
          { label: trip.title },
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<FiSliders />}
              onClick={() => setDetailsOpen(true)}
            >
              Edit details
            </Button>
            <Button
              variant={editing ? "accent" : "secondary"}
              leftIcon={editing ? <FiCheck /> : <FiEdit2 />}
              onClick={() => setEditing((previous) => !previous)}
              aria-pressed={editing}
            >
              {editing ? "Done editing" : "Edit itinerary"}
            </Button>
                                    <Button
              to={`${DASHBOARD_PATHS.compare}?a=${trip.id}`}
              variant="secondary"
              leftIcon={<FiColumns />}
            >
              Compare
            </Button>
            <ExportItinerary trip={trip} />
            <Button
              variant={trip.saved ? "secondary" : "primary"}
              leftIcon={<FiBookmark />}
              onClick={handleToggleSaved}
            >
              {trip.saved ? "Remove from saved" : "Save trip"}
            </Button>
            <Button
              variant="outline-danger"
              leftIcon={<FiTrash2 />}
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </Button>
          </>
        }
      />

          <div className="results">
        <PrintHeader trip={trip} />

        <TripSummary trip={trip} /> 

        {notes.length > 0 && (
          <div className="alert alert--info" role="note">
            <FiInfo className="alert__icon" size={18} aria-hidden="true" />
            <div>
              <p className="font-semibold">Things to know about this plan</p>
              <ul>
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              {trip.editedAt && (
                <p className="text-sm" style={{ marginTop: "0.5rem" }}>
                  These notes were written when the plan was first created. You have
                  edited it since, so the costs and budget figures on this page are
                  the current ones.
                </p>
              )}
            </div>
          </div>
        )}

        <BudgetBreakdown trip={trip} />

        <EditableItinerary trip={trip} editing={editing} onChange={applyChange} />

        <RouteMap trip={trip} />

        <WeatherSection trip={trip} />

          <div className="no-print">
          <AlternativeSuggestions trip={trip} />
        </div>

        {hasPersonalText && (
          <Card title="Your notes" headingLevel="h2">
            {trip.description?.trim() && (
              <p>
                <strong>Your description: </strong>
                {trip.description}
              </p>
            )}
            {trip.notes?.trim() && (
              <p style={trip.description?.trim() ? { marginTop: "0.75rem" } : undefined}>
                <strong>Notes: </strong>
                {trip.notes}
              </p>
            )}
          </Card>
        )}
      </div>

      {detailsOpen && (
        <EditTripModal
          trip={trip}
          onSave={handleSaveDetails}
          onClose={() => setDetailsOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete this trip?"
        message="This itinerary will be permanently removed from your account. This cannot be undone."
        confirmLabel="Delete trip"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}