import PageHeader from "../components/common/PageHeader";
import AccountSummary from "../components/dashboard/AccountSummary";
import ChangePasswordForm from "../components/dashboard/ChangePasswordForm";
import ProfileForm from "../components/dashboard/ProfileForm";
import useAuth from "../hooks/useAuth";
import usePageTitle from "../hooks/usePageTitle";
import { DASHBOARD_PATHS } from "../data/dashboardData";

/** Profile page: account summary, personal information and password. */
export default function Profile() {
  usePageTitle("Profile");

  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Manage your personal details and password."
        breadcrumbs={[
          { label: "Dashboard", to: DASHBOARD_PATHS.home },
          { label: "Profile" },
        ]}
      />

      <div className="profile-layout">
        <AccountSummary user={user} />

        <div className="profile-layout__main">
          <ProfileForm user={user} />
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}