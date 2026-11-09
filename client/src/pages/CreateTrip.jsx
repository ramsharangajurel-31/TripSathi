import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import TripForm from "../components/trip/TripForm";
import usePageTitle from "../hooks/usePageTitle";
import { DASHBOARD_PATHS } from "../data/dashboardData";

/**
 * Trip creation page. Reads two optional URL parameters once:
 *   ?q=<text>             from the home-page search box
 *   ?destination=<id>     from a destination card
 * then removes them from the address bar, so a refresh restores the draft
 * instead of starting over from the original link.
 */
export default function CreateTrip() {
  usePageTitle("Create trip");

  const [searchParams, setSearchParams] = useSearchParams();

  const [initialParams] = useState(() => ({
    q: searchParams.get("q") || "",
    destination: searchParams.get("destination") || "",
  }));

  useEffect(() => {
    if (searchParams.has("q") || searchParams.has("destination")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <PageHeader
        title="Create a trip"
        subtitle="Answer a few questions and get a day-by-day itinerary with a cost estimate."
        breadcrumbs={[
          { label: "Dashboard", to: DASHBOARD_PATHS.home },
          { label: "Create trip" },
        ]}
      />

      <TripForm initialParams={initialParams} />
    </>
  );
}