import PanelLayout from "./PanelLayout";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminNavbar from "../components/admin/AdminNavbar";

/** Layout for the admin panel (every /admin route). */
export default function AdminLayout() {
  return <PanelLayout Sidebar={AdminSidebar} Topbar={AdminNavbar} variant="admin" />;
}