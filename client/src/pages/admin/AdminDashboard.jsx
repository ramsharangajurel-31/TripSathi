import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiActivity, FiFlag, FiInfo, FiMap, FiMapPin, FiRotateCcw, FiUsers } from "react-icons/fi";

import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Button from "../../components/ui/Button";
import AdminChart from "../../components/admin/AdminChart";
import AdminStats from "../../components/admin/AdminStats";
import RecentActivity from "../../components/admin/RecentActivity";
import RecentUsers from "../../components/admin/RecentUsers";
import useAdminData from "../../hooks/useAdminData";
import useAdminUsers from "../../hooks/useAdminUsers";
import usePageTitle from "../../hooks/usePageTitle";
import { ADMIN_DATA_NOTICE } from "../../data/adminData";
import { ADMIN_PATHS } from "../../data/adminNavigation";
import { ROLES } from "../../data/demoUsers";
import {
  getActivitiesByType,
  getBudgetLevelCounts,
  getMostPlannedDestinations,
  getRecentActivity,
  getRecentUsers,
  getTripsPerMonth,
} from "../../utils/adminStats";

/** Admin overview: counts, charts, recent users and recent activity. */
export default function AdminDashboard() {
  usePageTitle("Admin overview");

  const { users, allTrips } = useAdminUsers();
  const { destinations, attractions, activities, getDestinationName, resetData } = useAdminData();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const travelers = users.filter((user) => user.role === ROLES.user).length;
  const administrators = users.length - travelers;
  const savedTrips = allTrips.filter((trip) => trip.saved).length;

  const stats = [
    {
      id: "users",
      label: "Registered users",
      value: users.length,
      hint: `${travelers} ${travelers === 1 ? "traveler" : "travelers"}, ${administrators} ${
        administrators === 1 ? "administrator" : "administrators"
      }`,
      icon: <FiUsers />,
      to: ADMIN_PATHS.users,
    },
    {
      id: "destinations",
      label: "Destinations",
      value: destinations.length,
      icon: <FiMapPin />,
      to: ADMIN_PATHS.destinations,
    },
    {
      id: "attractions",
      label: "Attractions",
      value: attractions.length,
      icon: <FiFlag />,
      to: ADMIN_PATHS.attractions,
    },
    {
      id: "activities",
      label: "Activities",
      value: activities.length,
      icon: <FiActivity />,
      to: ADMIN_PATHS.activities,
    },
    {
      id: "itineraries",
      label: "Itineraries created",
      value: allTrips.length,
      hint: `${savedTrips} saved`,
      icon: <FiMap />,
    },
  ];

  const tripsPerMonth = useMemo(() => getTripsPerMonth(allTrips), [allTrips]);
  const budgetLevels = useMemo(() => getBudgetLevelCounts(allTrips), [allTrips]);
  const activityTypes = useMemo(() => getActivitiesByType(activities), [activities]);
  const mostPlanned = useMemo(
    () => getMostPlannedDestinations(allTrips, getDestinationName),
    [allTrips, getDestinationName]
  );
  const recentUsers = useMemo(() => getRecentUsers(users), [users]);
  const recentActivity = useMemo(() => getRecentActivity(users, allTrips), [users, allTrips]);

  const handleRestore = () => {
    resetData();
    setConfirmOpen(false);
    toast.success("Demonstration catalog restored.");
  };

  return (
    <>
      <PageHeader
        title="Administration overview"
        subtitle="System statistics, charts and recent activity."
        actions={
          <Button
            variant="secondary"
            leftIcon={<FiRotateCcw />}
            onClick={() => setConfirmOpen(true)}
          >
            Restore demonstration catalog
          </Button>
        }
      />

      <div className="alert alert--info admin-notice" role="note">
        <FiInfo className="alert__icon" size={18} aria-hidden="true" />
        <span>{ADMIN_DATA_NOTICE}</span>
      </div>

      <AdminStats stats={stats} />

      <div className="admin-grid">
        <AdminChart
          title="Itineraries created"
          description="Per month, over the last six months."
          type="bar"
          data={tripsPerMonth}
          valueLabel="Itineraries"
          emptyMessage="No itineraries have been created in the last six months."
        />
        <AdminChart
          title="Trips by budget level"
          description="How travelers set their budgets."
          type="donut"
          data={budgetLevels}
          valueLabel="Trips"
          emptyMessage="No trips yet."
        />
        <AdminChart
          title="Most planned destinations"
          description="The places that appear in the most itineraries."
          type="horizontal-bar"
          data={mostPlanned}
          valueLabel="Itineraries"
          emptyMessage="No itineraries have been created yet."
        />
        <AdminChart
          title="Activities by type"
          description="The activity catalog, grouped by type."
          type="horizontal-bar"
          data={activityTypes}
          valueLabel="Activities"
          emptyMessage="The activity catalog is empty."
        />
      </div>

      <div className="admin-grid">
        <RecentUsers users={recentUsers} />
        <RecentActivity events={recentActivity} />
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        variant="warning"
        icon={<FiRotateCcw />}
        title="Restore the demonstration catalog?"
        message="Destinations, attractions and activities return to the original demonstration lists, and your changes to them are lost. Users, trips and notifications are not affected."
        confirmLabel="Restore"
        onConfirm={handleRestore}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}