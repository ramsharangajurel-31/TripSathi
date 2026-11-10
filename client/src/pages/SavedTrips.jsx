import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiBookmark, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";

import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Pagination from "../components/ui/Pagination";
import Select from "../components/ui/Select";
import TripRow from "../components/trip/TripRow";
import usePageTitle from "../hooks/usePageTitle";
import useTrips from "../hooks/useTrips";
import { DASHBOARD_PATHS } from "../data/dashboardData";
import { getTripCosts, getTripDestinationNames } from "../utils/tripUtils";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: "newest", label: "Recently created" },
  { value: "departure", label: "Departure date (soonest)" },
  { value: "cost-low", label: "Estimated cost (low to high)" },
  { value: "cost-high", label: "Estimated cost (high to low)" },
  { value: "name", label: "Name (A to Z)" },
];

const SORTERS = {
  newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  departure: (a, b) => a.departureDate.localeCompare(b.departureDate),
  "cost-low": (a, b) => getTripCosts(a).total - getTripCosts(b).total,
  "cost-high": (a, b) => getTripCosts(b).total - getTripCosts(a).total,
  name: (a, b) => a.title.localeCompare(b.title),
};

/**
 * Saved trips: the itineraries the user chose to keep, with search by name
 * or destination, sorting, pagination, "remove from saved" (the trip stays
 * on the dashboard) and delete (with confirmation).
 */
export default function SavedTrips() {
  usePageTitle("Saved trips");

  const { savedTrips, toggleSaved, deleteTrip } = useTrips();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = text
      ? savedTrips.filter((trip) =>
          `${trip.title} ${getTripDestinationNames(trip)}`.toLowerCase().includes(text)
        )
      : savedTrips;

    return [...filtered].sort(SORTERS[sort]);
  }, [savedTrips, query, sort]);

  // A removed trip can leave the current page empty; step back to a real one.
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const handleUnsave = (trip) => {
    toggleSaved(trip.id);
    toast.success(`"${trip.title}" removed from saved trips. It is still on your dashboard.`);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteTrip(pendingDelete.id);
    setPendingDelete(null);
    toast.info("Trip deleted.");
  };

  return (
    <>
      <PageHeader
        title="Saved trips"
        subtitle={
          savedTrips.length > 0
            ? `${savedTrips.length} saved ${savedTrips.length === 1 ? "itinerary" : "itineraries"}.`
            : "Itineraries you save will appear here."
        }
        breadcrumbs={[
          { label: "Dashboard", to: DASHBOARD_PATHS.home },
          { label: "Saved trips" },
        ]}
        actions={
          <Button to={DASHBOARD_PATHS.createTrip} leftIcon={<FiPlus />}>
            Create a trip
          </Button>
        }
      />

      {savedTrips.length === 0 ? (
        <EmptyState
          icon={<FiBookmark />}
          title="No saved trips"
          message="Open a trip and choose Save trip to keep it here. Trips you have not saved are still listed on your dashboard."
          actionLabel="Create a trip"
          actionTo={DASHBOARD_PATHS.createTrip}
          secondaryLabel="Go to dashboard"
          secondaryTo={DASHBOARD_PATHS.home}
        />
      ) : (
        <>
          <div className="saved-toolbar">
            <Input
              label="Search saved trips"
              name="search"
              type="search"
              leftIcon={<FiSearch size={18} />}
              placeholder="Search by name or destination"
              autoComplete="off"
              value={query}
              onChange={handleQueryChange}
            />
            <Select
              label="Sort by"
              name="sort"
              options={SORT_OPTIONS}
              value={sort}
              onChange={handleSortChange}
            />
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {results.length} saved {results.length === 1 ? "trip" : "trips"} shown
          </p>

          {results.length === 0 ? (
            <EmptyState
              icon={<FiSearch />}
              title="No trips match your search"
              message="Try a different name or destination, or clear the search."
              actionLabel="Clear search"
              onAction={() => {
                setQuery("");
                setPage(1);
              }}
            />
          ) : (
            <>
              <Card padded={false}>
                <ul className="trip-list">
                  {visible.map((trip) => (
                    <li key={trip.id}>
                      <TripRow trip={trip} showCountdown />
                      <div className="saved-trip__actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<FiBookmark />}
                          onClick={() => handleUnsave(trip)}
                          aria-label={`Remove ${trip.title} from saved trips`}
                        >
                          Remove from saved
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<FiTrash2 />}
                          onClick={() => setPendingDelete(trip)}
                          aria-label={`Delete ${trip.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <Pagination
                currentPage={safePage}
                totalItems={results.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="saved trips"
              />
            </>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete this trip?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed from your account. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete trip"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}