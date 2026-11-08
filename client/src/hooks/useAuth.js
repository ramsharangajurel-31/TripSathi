import { createContext, useContext } from "react";

// The context object lives here (not in AuthContext.jsx) so the provider
// file exports only a component, which keeps hot reload working correctly.
export const AuthContext = createContext(null);

/**
 * Access authentication state and actions from any component:
 *
 *   const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
 *
 * Provided values
 *  user              current user WITHOUT the password, or null
 *  isAuthenticated   boolean
 *  isAdmin           boolean
 *  login(email, password, remember)      -> Promise<{ ok, error?, user? }>
 *  register({ fullName, email, phone, password }) -> Promise<{ ok, error?, user? }>
 *  logout()
 *  updateProfile({ fullName, email, phone, location }) -> Promise<{ ok, error?, user? }>
 *  changePassword(currentPassword, newPassword)        -> Promise<{ ok, error? }>
 *
 * The actions are async on purpose: when the backend exists they become
 * Axios calls with the same names and return shape, and no page changes.
 */
export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}