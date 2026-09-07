import api from "../../../services/api.js";
import { mergeEffectivePermissions, resolvePermissions, ROLES } from "../../../constants/permissions.js";
import { AUTH_ENDPOINTS } from "../constants/authConstants.js";

export async function loginWithEmail(email, password) {
  const response = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password });
  return response;
}

export async function verifyLoginOtp(email, otp) {
  const response = await api.post(AUTH_ENDPOINTS.VERIFY_OTP, { email, otp });
  return response;
}

export async function resendLoginOtp(email) {
  const response = await api.post(AUTH_ENDPOINTS.RESEND_OTP, { email });
  return response;
}

export async function fetchUserProfile() {
  const response = await api.get(AUTH_ENDPOINTS.PROFILE);
  return response.data;
}

/**
 * Update the signed-in user's own profile. Backend: PATCH /users/profile,
 * JSON body. Only name fields are edited here - email/mobile changes require
 * their own OTP-verified flows (/users/change-email/*, /users/change-mobile/*)
 * so we deliberately don't send them from this simple edit form.
 */
export async function updateUserProfile({ first_name, last_name }) {
  const response = await api.patch(AUTH_ENDPOINTS.PROFILE, {
    first_name,
    last_name,
  });
  return response.data;
}

/**
 * Upload a new profile photo. Backend: POST /users/profile/photo (multipart,
 * field name "file"; JPEG/PNG/WebP/AVIF/HEIC, max 5 MB). Returns
 * { profile_image_url, storage }.
 */
export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/users/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // { profile_image_url, storage }
}

// ─── OTP-verified email change ────────────────────────────────────────────────
// Backend: app/api/v1/endpoints/account_change.py
//   1) POST /users/change-email/request { new_email, password? } → OTP to new email
//   2) POST /users/change-email/verify  { new_email, otp }        → email updated
export async function requestEmailChange(newEmail, password) {
  const body = { new_email: newEmail };
  if (password) body.password = password;
  const response = await api.post("/users/change-email/request", body);
  return response.data;
}

export async function verifyEmailChange(newEmail, otp) {
  const response = await api.post("/users/change-email/verify", { new_email: newEmail, otp });
  return response.data;
}

// ─── OTP-verified mobile change (4 steps: verify current, then new) ───────────
// Backend: app/api/v1/endpoints/account_change.py
//   1) POST /users/change-mobile/verify-current/request { password? } → OTP to current mobile
//   2) POST /users/change-mobile/verify-current         { otp }        → current verified
//   3) POST /users/change-mobile/request                { new_mobile, password? } → OTP to new mobile
//   4) POST /users/change-mobile/verify                 { new_mobile, otp }        → mobile updated
export async function requestCurrentMobileOtp(password) {
  const body = {};
  if (password) body.password = password;
  const response = await api.post("/users/change-mobile/verify-current/request", body);
  return response.data;
}

export async function verifyCurrentMobileOtp(otp) {
  const response = await api.post("/users/change-mobile/verify-current", { otp });
  return response.data;
}

export async function requestNewMobileOtp(newMobile, password) {
  const body = { new_mobile: newMobile };
  if (password) body.password = password;
  const response = await api.post("/users/change-mobile/request", body);
  return response.data;
}

export async function verifyNewMobile(newMobile, otp) {
  const response = await api.post("/users/change-mobile/verify", { new_mobile: newMobile, otp });
  return response.data;
}

export async function fetchEffectivePermissions() {
  const response = await api.get(AUTH_ENDPOINTS.EFFECTIVE_PERMISSIONS);
  return response.data;
}

export async function resolveLoginSession(data) {
  let user = data.user ?? null;
  if (!user) {
    try {
      user = await fetchUserProfile();
    } catch {
      // Token is valid but profile fetch failed transiently - proceed anyway.
    }
  }

  let permissions = resolvePermissions(user?.Role);
  if (user && String(user.Role).toLowerCase() === ROLES.ADMIN) {
    try {
      const effectiveData = await fetchEffectivePermissions();
      permissions = mergeEffectivePermissions(user.Role, effectiveData);
    } catch {
      // Fall back to role default rather than blocking login.
    }
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user,
    permissions,
  };
}
