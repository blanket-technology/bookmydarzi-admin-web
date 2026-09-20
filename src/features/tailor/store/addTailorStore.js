import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { INIT_ADD_FORM, INIT_KYC } from "../constants/tailorConstants.js";
import { validators } from "../utils/tailorUtils.js";
import { createTailorApplication } from "../services/tailorService.js";

export const useAddTailorStore = create((set, get) => ({
  form: { ...INIT_ADD_FORM },
  errors: {},
  showErrors: false,
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
  setStatus: (status) => set({ status }),

  validate: () => {
    const { form } = get();
    const errors = {};
    ["full_name", "email", "phone"].forEach((key) => {
      const err = validators[key]?.(form[key]) || "";
      if (err) errors[key] = err;
    });
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
      const fd = new FormData();
      fd.append("full_name", form.full_name.trim());
      fd.append("email", form.email.trim());
      fd.append("phone", form.phone.trim());
      if (form.address.trim()) fd.append("address", form.address.trim());
      if (form.city.trim()) fd.append("city", form.city.trim());
      if (form.state.trim()) fd.append("state", form.state.trim());
      if (form.pincode.trim()) fd.append("pincode", form.pincode.trim());
      if (form.specialization.trim()) fd.append("specialization", form.specialization.trim());
      if (form.experience !== "") fd.append("experience_years", String(Number(form.experience)));
      if (kyc.aadhaar_front) fd.append("aadhaar_front", kyc.aadhaar_front);
      if (kyc.aadhaar_back) fd.append("aadhaar_back", kyc.aadhaar_back);
      if (kyc.pan_card) fd.append("pan_card", kyc.pan_card);

      const res = await createTailorApplication(fd);

      set({
        status: "success",
        msg:
          `Application submitted (${res.application_id ? `#${res.application_id}` : ""}).` +
          " Review and approve it from the Tailor Applications tab to create the live account -" +
          " the tailor will get a password-setup email once approved.",
      });
      reset();
    } catch (error) {
      set({
        status: "error",
        msg: extractErrorMessage(error, "Failed to submit tailor application. Please try again."),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
