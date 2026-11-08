import { useCallback } from "react";
import { toast } from "react-toastify";

import useAuth from "./useAuth";

/**
 * Returns a function that logs the user out and shows a confirmation toast.
 * Shared by the public Navbar and the dashboard top bar.
 * (AuthContext takes care of leaving the current page first.)
 */
export default function useLogout() {
  const { logout } = useAuth();

  return useCallback(() => {
    logout();
    toast.success("You have been logged out.");
  }, [logout]);
}