import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import Loading from "../components/common/Loading";
import ProtectedRoute, { GuestRoute } from "../components/common/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

// Everything below is loaded only when a visitor first opens it, so the
// landing page stays small. The home page, its layout and the not-found
// page stay in the main file because nearly every visit needs them.
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));

const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const CreateTrip = lazy(() => import("../pages/CreateTrip"));
const TripDetails = lazy(() => import("../pages/TripDetails"));
const SavedTrips = lazy(() => import("../pages/SavedTrips"));
const CompareTrips = lazy(() => import("../pages/CompareTrips"));
const Notifications = lazy(() => import("../pages/Notifications"));
const Profile = lazy(() => import("../pages/Profile"));

const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const ManageDestinations = lazy(() => import("../pages/admin/ManageDestinations"));
const ManageAttractions = lazy(() => import("../pages/admin/ManageAttractions"));
const ManageActivities = lazy(() => import("../pages/admin/ManageActivities"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));

/**
 * Central route table.
 *   Public site            /, /login, /register
 *   Traveler dashboard     /dashboard/*  (signed-in travelers only)
 *   Admin panel            /admin/*      (administrators only)
 *
 * Loading screens: the outer Suspense covers the first load of a whole
 * layout (full screen). Each layout has its own Suspense around its page
 * area, so moving between pages keeps the sidebar and top bar in place and
 * shows the loader only where the page will appear. If a file fails to
 * download, the error boundary in App.jsx shows its "try again" screen.
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading variant="fullscreen" message="Loading TripSathi..." />}>
      <Routes>
        {/* Public site */}
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />

          {/* Only for signed-out visitors; signed-in users are redirected */}
          <Route element={<GuestRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Traveler dashboard: signed-in travelers only */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="create-trip" element={<CreateTrip />} />
            <Route path="trips/:tripId" element={<TripDetails />} />
            <Route path="saved-trips" element={<SavedTrips />} />
            <Route path="compare" element={<CompareTrips />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* Admin panel: administrators only. Other users are sent to their own
            dashboard, signed-out visitors to the login page. */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="destinations" element={<ManageDestinations />} />
            <Route path="attractions" element={<ManageAttractions />} />
            <Route path="activities" element={<ManageActivities />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}