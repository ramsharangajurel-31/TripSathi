import PanelLayout from "./PanelLayout";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";

/** Layout for the signed-in traveler area (every /dashboard route). */
export default function DashboardLayout() {
  return <PanelLayout Sidebar={DashboardSidebar} Topbar={DashboardNavbar} />;
}