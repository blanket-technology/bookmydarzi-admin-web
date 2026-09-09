import axios from "axios";
import { API_BASE_URL, BACKEND_ORIGIN } from "../config/env.js";

const BASE_URL = API_BASE_URL;

// Re-exported for existing importers of this module.
export { BACKEND_ORIGIN };

/**
 * Turn a backend-returned image URL into something the browser can load.
 * The backend may return host-relative paths ("/static/services/foo.png") when
 * PUBLIC_BASE_URL is not configured. Those paths must be prefixed with the
 * backend origin or the browser will try to load them from the admin panel's
 * own origin (wrong server).
 */
export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${BACKEND_ORIGIN}${url}`;
  return url;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

let refreshPromise = null;

export async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("refresh_token");
  if (!refreshToken) {
    _logout();
    return null;
  }

  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post(
      `${BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 30000 }
    )
    .then((res) => {
      const accessToken = res.data?.access_token;
      if (accessToken) sessionStorage.setItem("access_token", accessToken);
      if (res.data?.refresh_token) {
        sessionStorage.setItem("refresh_token", res.data.refresh_token);
      }
      return accessToken || null;
    })
    .catch((error) => {
      _logout();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// A 401 from one of these means "wrong credentials / invalid OTP" - an
// expected, user-facing form error the calling screen already handles in
// its own try/catch. It must never trigger the refresh-token dance or the
// hard _logout() redirect below, which was firing on a bad login attempt
// (there's no refresh token yet since the user was never authenticated)
// and looked like the page silently reloading instead of showing an error.
const AUTH_ROUTES = [
  "/auth/email/login",
  "/auth/email/login/verify-otp",
  "/auth/email/login/resend-otp",
  "/auth/refresh",
  "/auth/forgot-password/request",
  "/auth/forgot-password/verify",
  "/auth/forgot-password/reset",
];

function isAuthRoute(url) {
  if (!url) return false;
  return AUTH_ROUTES.some((route) => url.includes(route));
}

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && isAuthRoute(original?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          return Promise.reject(error);
        }

        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api(original);
      } catch (refreshError) {
        return Promise.reject(refreshError || error);
      }
    }

    return Promise.reject(error);
  }
);

function _logout() {
  // Best-effort server-side revocation before clearing local state - without
  // this, a still-unexpired access token (or a refresh token the backend
  // hasn't yet detected as stale) keeps working even after this "logout",
  // e.g. if it was captured by an XSS payload or a shared-machine snoop
  // before the user signed out. Never block the local logout on it: a
  // network failure here must not prevent clearing this browser's session.
  const refreshToken = sessionStorage.getItem("refresh_token");
  const accessToken = sessionStorage.getItem("access_token");
  if (refreshToken) {
    axios
      .post(`${BASE_URL}/auth/logout`, { refresh_token: refreshToken, access_token: accessToken }, { timeout: 5000 })
      .catch(() => {});
  }
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");
  window.location.replace("/");
}

export default api;
