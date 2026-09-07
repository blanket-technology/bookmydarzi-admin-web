import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { DEFAULT_RESEND_COOLDOWN } from "../constants/authConstants.js";
import { ROLES } from "../../../constants/permissions.js";

const STAFF_ROLES = new Set(Object.values(ROLES));
import {
  loginWithEmail,
  resendLoginOtp,
  resolveLoginSession,
  verifyLoginOtp,
} from "../services/authService.js";
import { useAuthStore } from "./authStore.js";

export const useLoginStore = create((set, get) => ({
  email: "",
  password: "",
  showPassword: false,
  rememberMe: false,
  showForgotPassword: false,
  generatedCaptcha: "",
  captchaInput: "",
  captchaKey: 0,
  loading: false,
  error: "",
  otpStage: false,
  otp: "",
  otpVerifying: false,
  resendCooldown: 0,

  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setShowPassword: (showPassword) => set({ showPassword }),
  setRememberMe: (rememberMe) => set({ rememberMe }),
  setShowForgotPassword: (showForgotPassword) => set({ showForgotPassword }),
  setGeneratedCaptcha: (generatedCaptcha) => set({ generatedCaptcha }),
  setCaptchaInput: (captchaInput) => set({ captchaInput }),
  setOtp: (otp) => set({ otp }),
  setError: (error) => set({ error }),
  resetCaptcha: () => set({ captchaInput: "", captchaKey: get().captchaKey + 1 }),
  tickResendCooldown: () =>
    set((s) => ({ resendCooldown: Math.max(0, s.resendCooldown - 1) })),

  backToPassword: () => set({ otpStage: false, otp: "", error: "" }),

  completeSession: async (data) => {
    // Tokens must be in sessionStorage before profile/permissions API calls -
    // the axios interceptor reads from there (same order as original AdminLogin).
    if (data.access_token) {
      sessionStorage.setItem("access_token", data.access_token);
    }
    if (data.refresh_token) {
      sessionStorage.setItem("refresh_token", data.refresh_token);
    }

    const session = await resolveLoginSession(data);
    useAuthStore.getState().login({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      permissions: session.permissions,
    });
    return session;
  },

  submitLogin: async () => {
    const { email, password } = get();
    set({ loading: true, error: "" });
    try {
      const response = await loginWithEmail(email, password);

      if (response.data?.otp_required) {
        set({
          otpStage: true,
          resendCooldown: response.data.cooldown_seconds ?? DEFAULT_RESEND_COOLDOWN,
          loading: false,
        });
        return { otpRequired: true };
      }

      if (response.status === 200 && response.data?.access_token) {
        const role = String(response.data.role ?? "").toLowerCase();
        // /auth/email/login is shared with the customer apps and silently
        // JIT-registers any unrecognized email as a brand-new customer
        // account (role "user") instead of rejecting it - correct there,
        // but on the admin panel that means a typo'd email/wrong password
        // shows no error at all, it just logs into a freshly-created
        // customer account. Staff accounts are never self-registered, so
        // any non-staff role here means the credentials didn't match a
        // real admin/employee account.
        if (!STAFF_ROLES.has(role)) {
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          set({ error: "Invalid email or password.", loading: false });
          get().resetCaptcha();
          return { success: false };
        }
        await get().completeSession(response.data);
        set({ loading: false });
        return { success: true };
      }

      set({ error: "Login failed. Please try again.", loading: false });
      get().resetCaptcha();
      return { success: false };
    } catch (err) {
      set({ error: extractErrorMessage(err), loading: false });
      get().resetCaptcha();
      return { success: false };
    }
  },

  submitOtp: async () => {
    const { email, otp } = get();
    set({ otpVerifying: true, error: "" });
    try {
      const response = await verifyLoginOtp(email, otp);
      if (response.data?.access_token) {
        await get().completeSession(response.data);
        set({ otpVerifying: false });
        return { success: true };
      }
      set({ error: "Verification failed. Please try again.", otpVerifying: false });
      return { success: false };
    } catch (err) {
      set({ error: extractErrorMessage(err), otpVerifying: false });
      return { success: false };
    }
  },

  resendOtp: async () => {
    const { email, resendCooldown } = get();
    if (resendCooldown > 0) return;
    set({ error: "" });
    try {
      const response = await resendLoginOtp(email);
      set({ resendCooldown: response.data?.cooldown_seconds ?? DEFAULT_RESEND_COOLDOWN });
    } catch (err) {
      set({ error: extractErrorMessage(err) });
    }
  },
}));
