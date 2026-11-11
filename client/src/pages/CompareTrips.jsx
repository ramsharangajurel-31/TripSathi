import { useSearchParams } from "react-router-dom";
import { FiColumns, FiRepeat } from "react-icons/fi";

import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import ItineraryComparison from "../components/trip/ItineraryComparison";
import usePageTitle from "../hooks/usePageTitle";
import useTrips from "../hooks/useTrips";
import { DASHBOARD_PATHS } from "../data/dashboardData";
import { formatDateRange } from "../utils/formatDate";

/**
 * Compare two of the user's trips side by side.
 *
 * The two selected trips are kept in the address (?a=<id>&b=<id>) and
 * derived on every render: an unknown or missing id falls back to a sensible
 * default (newest trip, then the next one), so a deleted trip never leaves
 * the page broken.
 */
export default function CompareTrips() {
  usePageTitle("Compare trips");

  const { trips } = useTrips();
  const [searchParams, setSearchParams] = useSearchParams();

  const header = (
    <PageHeader
      title="Compare trips"
      subtitle="Put two itineraries side by side to compare cost, length and pace."
      breadcrumbs={[
        { label: "Dashboard", to: DASHBOARD_PATHS.home },
        { label: "Compare trips" },
      ]}
    />
  );

  if (trips.length < 2) {
    return (
      <>
        {header}
        <EmptyState
          icon={<FiColumns />}
          title="You need two trips to compare"
          message={
            trips.length === 0
              ? "Create at least two itineraries and they can be compared here."
              : "You have one trip so far. Create another, or run the What-if simulator on this one and save the result as a new trip."
          }
          actionLabel="Create a trip"
          actionTo={DASHBOARD_PATHS.createTrip}
        />
      </>
    );
  }

  const tripA = trips.find((trip) => trip.id === searchParams.get("a")) || trips[0];
  const tripB =
    trips.find((trip) => trip.id === searchParams.get("b") && trip.id !== tripA.id) ||
    trips.find((trip) => trip.id !== tripA.id);

  const options = trips.map((trip) => ({
    value: trip.id,
    label: `${trip.title} · ${formatDateRange(trip.departureDate, trip.returnDate)}`,
  }));

  const apply = (a, b) => setSearchParams({ a, b }, { replace: true });

  // Choosing the trip that is already on the other side swaps the two.
  const handleSelect = (side) => (event) => {
    const chosen = event.target.value;
    let a = tripA.id;
    let b = tripB.id;

    if (side === "a") {
      if (chosen === b) b = a;
      a = chosen;
    } else {
      if (chosen === a) a = b;
      b = chosen;
    }
    apply(a, b);
  };

  return (
    <>
      {header}

      <div className="compare-toolbar no-print">
        <Select
          label="First trip"
          name="compareA"
          options={options}
          value={tripA.id}
          onChange={handleSelect("a")}
        />
        <Button
          variant="secondary"
          iconOnly
          onClick={() => apply(tripB.id, tripA.id)}
          aria-label="Swap the two trips"
        >
          <FiRepeat aria-hidden="true" />
        </Button>
        <Select
          label="Second trip"
          name="compareB"
          options={options}
          value={tripB.id}
          onChange={handleSelect("b")}
        />
      </div>

      <p className="wizard__note" style={{ marginTop: 0, marginBottom: "1.5rem" }}>
        Choosing the trip shown on the other side swaps the two.
      </p>

      <ItineraryComparison tripA={tripA} tripB={tripB} />
    </>
  );
}