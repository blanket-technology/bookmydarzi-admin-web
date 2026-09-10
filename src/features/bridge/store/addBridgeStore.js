import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INIT_FORM, INIT_KYC, INIT_PROFILE } from "../constants/bridgeConstants.js";
import { buildProfilePayload } from "../utils/bridgeUtils.js";
import {
  buildCreateEmployeePayload,
  createBridgeEmployee,
  updateBridgeProfile,
  uploadStaffKyc,
} from "../services/bridgeService.js";
import { validators } from "../utils/bridgeUtils.js";

export const useAddBridgeStore = create((set, get) => ({
  form: { ...INIT_FORM },
  profile: { ...INIT_PROFILE },
  kyc: { ...INIT_KYC },
  viewing: null,
  errors: {},
  showErrors: false,
  showPassword: false,
  loading: false,
  status: null,
  msg: "",

  setForm: (form) => set({ form }),
  setProfile: (profile) => set({ profile }),
  setKyc: (kycOrFn) =>
    set((state) => ({
      kyc: typeof kycOrFn === "function" ? kycOrFn(state.kyc) : kycOrFn,
    })),
  setViewing: (viewing) => set({ viewing }),
  setShowPassword: (showPassword) => set({ showPassword }),
  setStatus: (status) => set({ status }),

  onChange: (e) => {
    const { name, value } = e.target;
    set((s) => ({
      form: { ...s.form, [name]: value },
      errors: { ...s.errors, [name]: validators[name]?.(value) || "" },
    }));
  },

  setProfileField: (name, value) =>
    set((s) => ({ profile: { ...s.profile, [name]: value } })),

  validate: () => {
    const { form } = get();
    const localErrors = {};
    ["name", "email", "mobile"].forEach((key) => {
      const err = validators[key]?.(form[key]) || "";
      if (err) localErrors[key] = err;
    });
    if (form.password) {
      const err = validators.password(form.password);
      if (err) localErrors.password = err;
    }
    set({ errors: localErrors, showErrors: true });
    return Object.keys(localErrors).length === 0;
  },

  reset: () =>
    set({
      form: { ...INIT_FORM },
      profile: { ...INIT_PROFILE },
      kyc: { ...INIT_KYC },
      viewing: null,
      errors: {},
      showErrors: false,
    }),

  submit: async (e) => {
    e.preventDefault();
    const { form, profile, kyc, validate, reset } = get();
    if (!validate()) return;

    set({ loading: true, status: null });
    try {
      const res = await createBridgeEmployee(buildCreateEmployeePayload(form));
      const newStaffId = res?.id;
      const bridgeId = res?.user_code || "";
      const hasProfileData = Object.values(profile).some((v) => v !== "");
      const kycEntries = Object.entries(kyc).filter(([, file]) => !!file);
      const failures = [];

      if (newStaffId && hasProfileData) {
        try {
          await updateBridgeProfile(newStaffId, buildProfilePayload(profile));
        } catch (profileErr) {
          failures.push(`professional details: ${extractErrorMessage(profileErr, "unknown error")}`);
        }
      }

      let uploadedCount = 0;
      if (newStaffId && kycEntries.length > 0) {
        for (const [docKey, file] of kycEntries) {
          try {
            await uploadStaffKyc(newStaffId, docKey, file);
            uploadedCount += 1;
          } catch (kycErr) {
            failures.push(`${docKey}: ${extractErrorMessage(kycErr, "upload failed")}`);
          }
        }
      }

      if (failures.length > 0) {
        set({
          status: "success",
          msg: `Employee account created!${bridgeId ? ` Bridge ID: ${bridgeId}.` : ""} However, some details failed to save (${failures.join("; ")}). This employee is Pending Verification - add the missing documents from their profile page.`,
        });
        reset();
        set({ loading: false });
        return;
      }

      // Mirrors addTailorStore.js's same note - a new Bridge employee is
      // always created Pending Verification, never auto-approved, regardless
      // of how many KYC docs were attached here.
      const verificationNote =
        uploadedCount === 3
          ? "All 3 KYC documents are attached - verify this employee from their profile page when ready."
          : `This employee is Pending Verification (${uploadedCount}/3 KYC documents attached) - add the rest from their profile page before verifying.`;

      set({
        status: "success",
        msg: `Employee account created!${bridgeId ? ` Bridge ID: ${bridgeId}.` : ""} They can log in with ${form.email} and the password you set (or Bridge@123 if left blank). ${verificationNote}`,
      });
      reset();
    } catch (err) {
      set({
        status: "error",
        msg: extractErrorMessage(err, "Failed to register. Please try again."),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
