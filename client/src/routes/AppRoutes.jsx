import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute, { GuestRoute } from "../components/common/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import CreateTrip from "../pages/CreateTrip";
import TripDetails from "../pages/TripDetails";
import SavedTrips from "../pages/SavedTrips";
import CompareTrips from "../pages/CompareTrips";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageDestinations from "../pages/admin/ManageDestinations";
import NotFound from "../pages/NotFound";

/**
 * Central route table.
 *   Public site            /, /login, /register
 *   Traveler dashboard     /dashboard/*  (signed-in travelers only)
 *   Admin panel            /admin/*      (administrators only; pages are
 *                                         added step by step in Phase 7)
 */
export default function AppRoutes() {
  return (
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
          {/* The admin pages are added next. Until then, every admin URL
              shows the not-found message inside the admin shell. */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}