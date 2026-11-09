import { useMemo } from "react";
import { FiCalendar, FiClock } from "react-icons/fi";

import PageHeader from "../components/common/PageHeader";
import Button from "../components/ui/Button";
import DashboardStats from "../components/dashboard/DashboardStats";
import QuickActions from "../components/dashboard/QuickActions";
import TripListCard from "../components/dashboard/TripListCard";
import ProfileSummary from "../components/dashboard/ProfileSummary";
import RecommendedDestinations from "../components/dashboard/RecommendedDestinations";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";
import usePageTitle from "../hooks/usePageTitle";
import useTrips from "../hooks/useTrips";
import { DASHBOARD_PATHS } from "../data/dashboardData";
import { getRecommendedDestinations } from "../utils/recommendations";
import { TRIP_STATUS, getTripStatus } from "../utils/tripUtils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Traveler dashboard overview.
 * "Upcoming trips" = every trip that has not finished (including one in
 * progress), soonest first. "Past trips" = completed trips.
 */
export default function Dashboard() {
  usePageTitle("Dashboard");

  const { user } = useAuth();
  const { trips, savedTrips } = useTrips();
  const { unreadCount } = useNotifications();

  const firstName = user.fullName.trim().split(/\s+/)[0];

  const upcomingTrips = useMemo(
    () =>
      trips
        .filter((trip) => getTripStatus(trip) !== TRIP_STATUS.completed)
        .sort((a, b) => a.departureDate.localeCompare(b.departureDate)),
    [trips]
  );

  const pastTrips = useMemo(
    () =>
      trips
        .filter((trip) => getTripStatus(trip) === TRIP_STATUS.completed)
        .sort((a, b) => b.returnDate.localeCompare(a.returnDate))
        .slice(0, 3),
    [trips]
  );

  const recommendations = useMemo(
    () => getRecommendedDestinations(trips, 3),
    [trips]
  );

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        subtitle="Here is an overview of your trips and plans."
      />

      <DashboardStats
        totalTrips={trips.length}
        savedTrips={savedTrips.length}
        upcomingTrips={upcomingTrips.length}
        unreadNotifications={unreadCount}
      />

      <QuickActions />

      <div className="dashboard-grid">
        <div className="dashboard-grid__main">
          <TripListCard
            title="Upcoming trips"
            trips={upcomingTrips}
            showCountdown
            actions={
              <Button
                to={DASHBOARD_PATHS.savedTrips}
                variant="ghost"
                size="sm"
              >
                View saved trips
              </Button>
            }
            empty={{
              icon: <FiCalendar />,
              title: "No upcoming trips",
              message:
                "Create an itinerary to see your plans, costs and countdown here.",
              actionLabel: "Create a trip",
              actionTo: DASHBOARD_PATHS.createTrip,
            }}
          />

          {pastTrips.length > 0 && (
            <TripListCard
              title="Past trips"
              trips={pastTrips}
              empty={{
                icon: <FiClock />,
                title: "No past trips",
                message: "Trips you have completed will appear here.",
              }}
            />
          )}
        </div>

        <aside
          className="dashboard-grid__aside"
          aria-label="Profile and recommendations"
        >
          <ProfileSummary user={user} />
          <RecommendedDestinations recommendations={recommendations} />
        </aside>
      </div>
    </>
  );
}