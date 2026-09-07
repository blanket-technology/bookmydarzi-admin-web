import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import {
  buildTailorSavePayload,
  computeProductionCounts,
  formFromData,
} from "../utils/tailorUtils.js";
import {
  deleteTailor,
  deleteTailorKyc,
  getTailorById,
  getTailorOrders,
  getTailorWorkload,
  updateTailor,
  uploadTailorKyc,
  uploadUserPhoto,
} from "../services/tailorService.js";

export const useTailorDetailStore = create((set, get) => ({
  liveData: {},
  form: formFromData({}),
  profileFetchError: "",
  orders: [],
  ordersTotal: 0,
  ordersLoading: true,
  ordersPage: 1,
  ordersLimit: 10,
  ordersStatus: "",
  workload: null,
  workloadLoading: true,
  kycUrls: { aadhar: null, pan_card: null, other: null },
  saving: false,
  verifying: false,

  setLiveData: (liveData) => set({ liveData }),
  setForm: (form) => set({ form }),
  setProfileFetchError: (profileFetchError) => set({ profileFetchError }),
  setOrdersPage: (ordersPage) => set({ ordersPage }),
  setOrdersLimit: (ordersLimit) => set({ ordersLimit, ordersPage: 1 }),
  setOrdersStatus: (ordersStatus) => set({ ordersStatus, ordersPage: 1 }),
  setKycUrls: (kycUrls) => set({ kycUrls }),

  fetchProfile: async (tailorId, seedData = {}) => {
    if (!tailorId) return;
    set({ profileFetchError: "" });
    try {
      const fresh = await getTailorById(tailorId);
      set({
        liveData: fresh,
        form: formFromData(fresh),
        kycUrls: {
          aadhar: fresh.aadhar_url || null,
          pan_card: fresh.pan_card_url || null,
          other: fresh.other_doc_url || null,
        },
      });
    } catch (err) {
      if (Object.keys(seedData).length) {
        set({ liveData: seedData, form: formFromData(seedData) });
      }
      set({ profileFetchError: extractErrorMessage(err, "Failed to load latest tailor details.") });
    }
  },

  fetchOrders: async (tailorId) => {
    if (!tailorId) return;
    const { ordersPage, ordersLimit, ordersStatus } = get();
    set({ ordersLoading: true });
    try {
      const data = await getTailorOrders({
        tailorId,
        page: ordersPage,
        limit: ordersLimit,
        status: ordersStatus,
      });
      set({ orders: data.orders, ordersTotal: data.total, ordersLoading: false });
    } catch {
      set({ orders: [], ordersLoading: false });
    }
  },

  fetchWorkload: async (tailorId) => {
    set({ workloadLoading: true });
    try {
      const rows = await getTailorWorkload();
      const row = rows.find((w) => String(w.tailor_id) === String(tailorId));
      set({ workload: row ?? null, workloadLoading: false });
    } catch {
      set({ workload: null, workloadLoading: false });
    }
  },

  saveProfile: async ({ tailorId, form, kycFiles, photo, liveData }) => {
    set({ saving: true });
    try {
      const payload = buildTailorSavePayload(form);
      await updateTailor(tailorId, payload);
      await get().uploadPendingKyc(tailorId, kycFiles);
      if (photo) {
        const res = await uploadUserPhoto(liveData.user_id, photo);
        set((s) => ({
          liveData: {
            ...s.liveData,
            profile_image_url: res.profile_image_url ?? s.liveData.profile_image_url,
          },
        }));
      }
      set((s) => ({
        liveData: {
          ...s.liveData,
          full_name: payload.full_name ?? s.liveData.full_name,
          email: payload.email ?? s.liveData.email,
          mobile: payload.mobile ?? s.liveData.mobile,
          specialization: payload.specialization ?? s.liveData.specialization,
          is_active: payload.is_active,
          is_available: payload.is_available,
        },
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractErrorMessage(err, "Failed to save.") };
    } finally {
      set({ saving: false });
    }
  },

  toggleVerification: async (tailorId, currentApproved) => {
    set({ verifying: true });
    try {
      const res = await updateTailor(tailorId, { is_approved: !currentApproved });
      const approved = res.is_approved ?? !currentApproved;
      set((s) => ({
        liveData: { ...s.liveData, is_approved: approved },
        form: { ...s.form, verify: approved ? "Verified" : "Pending" },
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractErrorMessage(err, "Failed to update verification status.") };
    } finally {
      set({ verifying: false });
    }
  },

  deleteTailorProfile: async (tailorId) => {
    try {
      if (tailorId) await deleteTailor(tailorId);
      return { ok: true };
    } catch {
      return { ok: true };
    }
  },

  deleteKycDoc: async (tailorId, key) => {
    await deleteTailorKyc(tailorId, key);
    set((s) => ({ kycUrls: { ...s.kycUrls, [key]: null } }));
  },

  uploadPendingKyc: async (tailorId, kycFiles) => {
    const docMap = { aadhar: "aadhar", pan_card: "pan_card", other: "other" };
    for (const [key, docType] of Object.entries(docMap)) {
      const file = kycFiles[key];
      if (!file) continue;
      const res = await uploadTailorKyc(tailorId, docType, file);
      set((s) => ({ kycUrls: { ...s.kycUrls, [key]: res.url } }));
    }
  },

  getProductionCounts: () => computeProductionCounts(get().orders),
}));
