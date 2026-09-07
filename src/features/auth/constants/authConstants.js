export const DEFAULT_RESEND_COOLDOWN = 30;

export const OTP_LENGTH = 6;

export const FAVICON_PATH = "/Logo.jpg";

export const AUTH_ENDPOINTS = {
  LOGIN: "/auth/email/login",
  VERIFY_OTP: "/auth/email/login/verify-otp",
  RESEND_OTP: "/auth/email/login/resend-otp",
  PROFILE: "/users/profile",
  EFFECTIVE_PERMISSIONS: "/rbac/user-permissions/me/effective",
};
