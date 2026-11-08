import { FiCompass } from "react-icons/fi";
import EmptyState from "../components/common/EmptyState";

/**
 * 404 page. Rendered inside MainLayout for any unknown URL.
 */
export default function NotFound() {
  return (
    <div className="container section">
      <EmptyState
        icon={<FiCompass />}
        title="Page not found"
        message="The page you are looking for doesn't exist or may have been moved. Check the address or head back to the home page."
        actionLabel="Back to home"
        actionTo="/"
      />
    </div>
  );
}