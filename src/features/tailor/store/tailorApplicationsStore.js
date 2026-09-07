import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError, notifySuccess } from "../../../services/dialogService.js";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/tailorConstants.js";
import { buildApplicationListParams } from "../utils/tailorUtils.js";
import {
  approveApplication,
  getApplicationById,
  getApplications,
  rejectApplication,
} from "../services/tailorService.js";

export const useTailorApplicationsStore = create((set, get) => ({
  applications: [],
  loading: true,
  error: "",
  search: "",
  status: "",
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  total: 0,
  hasNext: false,
  showFilter: false,
  actionLoading: null,
  rejectTarget: null,
  rejectReason: "",
  rejectLoading: false,
  detailApp: null,
  detailLoading: false,

  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status, page: DEFAULT_PAGE }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),
  setShowFilter: (showFilter) => set({ showFilter }),
  setRejectTarget: (rejectTarget) => set({ rejectTarget, rejectReason: "" }),
  setRejectReason: (rejectReason) => set({ rejectReason }),
  setDetailApp: (detailApp) => set({ detailApp }),

  fetchApplications: async () => {
    const { page, limit, search, status } = get();
    set({ loading: true, error: "" });
    try {
      const data = await getApplications(buildApplicationListParams({ page, limit, search, status }));
      set({
        applications: data.items || [],
        total: data.total || 0,
        hasNext: data.has_next || false,
        loading: false,
      });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load applications."),
        loading: false,
      });
    }
  },

  handleSearch: () => {
    set({ page: DEFAULT_PAGE });
    get().fetchApplications();
  },

  handleApprove: async (applicationId, { overridePan = false } = {}) => {
    if (
      !(await confirmDialog({
        title: overridePan ? "Approve without a PAN card on file?" : "Approve this tailor application?",
        confirmLabel: "Yes, Approve",
        tone: "neutral",
      }))
    ) {
      return;
    }
    set({ actionLoading: applicationId });
    try {
      const res = await approveApplication(applicationId, overridePan);
      notifySuccess(res.message || "Application approved.");
      get().fetchApplications();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to approve application."));
    } finally {
      set({ actionLoading: null });
    }
  },

  handleRejectConfirm: async () => {
    const { rejectReason, rejectTarget } = get();
    if (!rejectReason.trim()) {
      notifyError("Please enter a rejection reason.");
      return;
    }
    set({ rejectLoading: true });
    try {
      const res = await rejectApplication(rejectTarget.id, rejectReason.trim());
      notifySuccess(res.message || "Application rejected.");
      set({ rejectTarget: null });
      get().fetchApplications();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to reject application."));
    } finally {
      set({ rejectLoading: false });
    }
  },

  openDetail: async (app) => {
    set({ detailApp: { ...app, _loading: true }, detailLoading: true });
    try {
      const data = await getApplicationById(app.id);
      set({ detailApp: data });
    } catch (err) {
      set({
        detailApp: {
          ...app,
          _error: extractErrorMessage(err, "Failed to load details."),
        },
      });
    } finally {
      set({ detailLoading: false });
    }
  },
}));
