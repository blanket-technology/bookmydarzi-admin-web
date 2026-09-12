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
  panWaiverTarget: null,
  panWaiverReason: "",

  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status, page: DEFAULT_PAGE }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: DEFAULT_PAGE }),
  setShowFilter: (showFilter) => set({ showFilter }),
  setRejectTarget: (rejectTarget) => set({ rejectTarget, rejectReason: "" }),
  setRejectReason: (rejectReason) => set({ rejectReason }),
  setDetailApp: (detailApp) => set({ detailApp }),
  setPanWaiverTarget: (panWaiverTarget) => set({ panWaiverTarget, panWaiverReason: "" }),
  setPanWaiverReason: (panWaiverReason) => set({ panWaiverReason }),

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

  // Plain approve (has a PAN on file) still goes through a simple confirm
  // dialog - only the PAN-waiver path needs a typed reason, collected via
  // panWaiverTarget/handlePanWaiverConfirm below, since the backend now
  // requires one (see approve_tailor_application) and it's a Superadmin-only
  // action worth deliberately typing out, not just confirming.
  handleApprove: async (applicationId, { overridePan = false, panWaiverReason = "" } = {}) => {
    if (!overridePan) {
      if (
        !(await confirmDialog({
          title: "Approve this tailor application?",
          confirmLabel: "Yes, Approve",
          tone: "neutral",
        }))
      ) {
        return;
      }
    }
    set({ actionLoading: applicationId });
    try {
      const res = await approveApplication(applicationId, overridePan, panWaiverReason);
      notifySuccess(res.message || "Application approved.");
      get().fetchApplications();
      return true;
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to approve application."));
      return false;
    } finally {
      set({ actionLoading: null });
    }
  },

  handlePanWaiverConfirm: async () => {
    const { panWaiverTarget, panWaiverReason } = get();
    if (!panWaiverTarget) return;
    if (panWaiverReason.trim().length < 5) {
      notifyError("Please enter a reason (at least 5 characters) for waiving the PAN requirement.");
      return;
    }
    const ok = await get().handleApprove(panWaiverTarget.id, {
      overridePan: true,
      panWaiverReason: panWaiverReason.trim(),
    });
    if (ok) set({ panWaiverTarget: null, panWaiverReason: "" });
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
