import { create } from "zustand";
import { resolvePermissions } from "../../../constants/permissions";

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set) => ({
  isAuthenticated: Boolean(sessionStorage.getItem("access_token")),
  user: readStoredUser(),

  login: ({ accessToken, refreshToken, user, permissions }) => {
    sessionStorage.setItem("access_token", accessToken);
    if (refreshToken) sessionStorage.setItem("refresh_token", refreshToken);
    if (user) sessionStorage.setItem("user", JSON.stringify(user));
    if (permissions) sessionStorage.setItem("permissions", JSON.stringify(permissions));
    set({ isAuthenticated: true, user: user || readStoredUser() });
  },

  logout: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("permissions");
    set({ isAuthenticated: false, user: null });
    window.location.replace("/");
  },

  getToken: () => sessionStorage.getItem("access_token"),
}));

export function getStoredUser() {
  return readStoredUser();
}

export function getStoredPermissions() {
  const role = getStoredUser()?.Role;
  const roleDefault = resolvePermissions(role);

  // The cached blob is only ever meaningfully DIFFERENT from the plain role
  // default for an admin account with per-screen revokes applied (see
  // mergeEffectivePermissions) - every other role's login always caches
  // exactly resolvePermissions(role). If GET /users/profile failed
  // transiently during login (resolveLoginSession swallows that error),
  // `user` was null at cache-write time and this holds NO_PERMISSIONS
  // (every module false) forever - permanently locking a real, valid staff
  // account out of every route, since nothing else in the app ever
  // rewrites this key. Once `user` resolves (e.g. after ProtectedRoute
  // renders and something re-fetches the profile), prefer the fresh
  // role-based permissions over a stale all-false cache.
  try {
    const raw = sessionStorage.getItem("permissions");
    if (raw) {
      const cached = JSON.parse(raw);
      const cachedGrantsNothing = Object.values(cached).every((v) => v === false);
      const roleGrantsSomething = Object.values(roleDefault).some((v) => v === true);
      if (!(cachedGrantsNothing && roleGrantsSomething)) return cached;
    }
  } catch {
    // fall through
  }
  return roleDefault;
}
