import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { DEFAULT_TAILOR_PASSWORD, INIT_ADD_FORM, INIT_KYC } from "../constants/tailorConstants.js";
import { validators } from "../utils/tailorUtils.js";
import { createTailorStaff, uploadTailorKyc } from "../services/tailorService.js";

export const useAddTailorStore = create((set, get) => ({
  form: { ...INIT_ADD_FORM },
  errors: {},
  showErrors: false,
  showPassword: false,
  kyc: { ...INIT_KYC },

  viewing: null,
  status: null,
  msg: "",
  loading: false,

  onChange: (e) => {
    const { name, value } = e.target;
    set((state) => ({
      form: { ...state.form, [name]: value },
    }));
  },

  setKyc: (kycOrFn) =>
    set((state) => ({
      kyc: typeof kycOrFn === "function" ? kycOrFn(state.kyc) : kycOrFn,
    })),

  setViewing: (viewing) => set({ viewing }),
  setShowPassword: (showPassword) => set({ showPassword }),
  setStatus: (status) => set({ status }),

  validate: () => {
    const { form } = get();
    const errors = {};
    ["full_name", "email", "phone", "specialization"].forEach((key) => {
      const err = validators[key]?.(form[key]) || "";
      if (err) errors[key] = err;
    });
    if (form.password) {
      const err = validators.password(form.password);
      if (err) errors.password = err;
    }
    set({ errors, showErrors: true });
    return Object.keys(errors).length === 0;
  },

  reset: () =>
    set({
      form: { ...INIT_ADD_FORM },
      errors: {},
      showErrors: false,
      kyc: { ...INIT_KYC },
      viewing: null,
    }),

  submit: async (e) => {
    e?.preventDefault();
    const { loading, validate, form, kyc, reset } = get();
    if (loading) return;
    if (!validate()) return;

    set({ loading: true, status: null, msg: "" });

    try {
      const nameParts = form.full_name.trim().split(" ");
      const payload = {
        first_name: nameParts[0] || form.full_name,
        last_name: nameParts.slice(1).join(" ") || ".",
        email: form.email.trim(),
        mobile: form.phone.trim(),
        password: form.password.trim() || DEFAULT_TAILOR_PASSWORD,
        role: "tailor",
        is_active: true,
        // The account must change this password on its first login - see
        // MustChangePassword on the backend User model. Only true when the
        // admin left the field blank and got the shared default password.
        is_default_password: !form.password.trim(),
        specialization: form.specialization.trim() || undefined,
        experience: form.experience !== "" ? Number(form.experience) : undefined,
        location: form.location.trim() || undefined,
        bio: form.bio.trim() || undefined,
      };

      const res = await createTailorStaff(payload);
      const tailorId = res?.tailor_id;
      const userCode = res?.user_code || "";

      const kycEntries = Object.entries(kyc).filter(([, file]) => !!file);
      if (tailorId && kycEntries.length > 0) {
        const failures = [];
        for (const [docKey, file] of kycEntries) {
          try {
            await uploadTailorKyc(tailorId, docKey, file);
          } catch (kycErr) {
            failures.push(`${docKey}: ${extractErrorMessage(kycErr, "upload failed")}`);
          }
        }
        if (failures.length > 0) {
          set({
            status: "success",
            msg: `Tailor account created!${userCode ? ` ID: ${userCode}.` : ""} However, some KYC documents failed to upload (${failures.join("; ")}). Add them from the tailor's profile page.`,
          });
          reset();
          set({ loading: false });
          return;
        }
      }

      set({
        status: "success",
        msg: `Tailor account created!${userCode ? ` ID: ${userCode}.` : ""} They can log in with ${form.email} and the password you set (or ${DEFAULT_TAILOR_PASSWORD} if left blank).`,
      });
      reset();
    } catch (error) {
      set({
        status: "error",
        msg: extractErrorMessage(error, "Failed to create tailor account. Please try again."),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
