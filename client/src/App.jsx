import { useLocation } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";

/**
 * Application root. Wraps all routes in an error boundary that resets when
 * the user navigates, so a crash on one page never blocks the others.
 * Providers (AuthContext in Phase 3) are added in main.jsx.
 */
export default function App() {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary resetKey={pathname}>
      <AppRoutes />
    </ErrorBoundary>
  );
}