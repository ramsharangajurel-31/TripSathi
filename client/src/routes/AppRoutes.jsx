import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute, { GuestRoute } from "../components/common/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";

/**
 * Central route table. Each phase adds its routes here:
 *   Phase 2: /login, /register
 *   Phase 3: /dashboard/* (protected), profile, notifications
 *   Phase 4-6: trip creation, results, saved trips
 *   Phase 7: /admin/* (admin only)
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
          {/* The dashboard pages are added in the next steps. Until then,
              every dashboard URL shows the not-found message inside the shell. */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}