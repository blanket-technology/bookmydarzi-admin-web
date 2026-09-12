import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { AUDIT_PAGE_LIMIT } from "../constants/settingsConstants.js";
import {
  clearHomepageCache,
  fetchAuditLogs,
  fetchAuditFilterOptions,
  fetchBillingSettings,
  updateBillingSettings,
} from "../services/settingsService.js";

export const useSettingsStore = create((set, get) => ({
  billingData: null,
  billingLoading: true,
  billingError: "",
  billingEditing: false,
  billingForm: { platform_fee: "", gst_percent: "" },
  billingSaving: false,
  billingSaveMsg: null,
  cacheClearing: false,
  cacheMsg: null,

  auditItems: [],
  auditTotal: 0,
  auditPage: 1,
  auditLoading: true,
  auditError: "",
  auditFilters: { performed_by: "", action: "", date_from: "", date_to: "" },
  auditActors: [],
  auditActions: [],

  loadBilling: async () => {
    set({ billingLoading: true, billingError: "" });
    try {
      const data = await fetchBillingSettings();
      set({
        billingData: data,
        billingForm: {
          platform_fee: String(data.platform_fee),
          gst_percent: String(data.gst_percent),
        },
        billingLoading: false,
      });
    } catch (err) {
      set({
        billingError: extractErrorMessage(err, "Failed to load billing settings."),
        billingLoading: false,
      });
    }
  },

  setBillingEditing: (billingEditing) => set({ billingEditing }),
  setBillingForm: (updater) =>
    set((s) => ({
      billingForm: typeof updater === "function" ? updater(s.billingForm) : updater,
    })),
  setBillingSaveMsg: (billingSaveMsg) => set({ billingSaveMsg }),

  saveBilling: async (e) => {
    e?.preventDefault?.();
    const { billingForm } = get();
    set({ billingSaving: true, billingSaveMsg: null });
    try {
      const data = await updateBillingSettings({
        platform_fee: Number(billingForm.platform_fee),
        gst_percent: Number(billingForm.gst_percent),
      });
      set({ billingData: data, billingSaveMsg: { type: "success", text: "Billing settings updated." } });
      setTimeout(() => {
        set({ billingEditing: false, billingSaveMsg: null });
      }, 1200);
    } catch (err) {
      set({
        billingSaveMsg: {
          type: "error",
          text: extractErrorMessage(err, "Save failed."),
        },
      });
    } finally {
      set({ billingSaving: false });
    }
  },

  setCacheMsg: (cacheMsg) => set({ cacheMsg }),

  clearCache: async () => {
    set({ cacheClearing: true, cacheMsg: null });
    try {
      await clearHomepageCache();
      set({ cacheMsg: { type: "success", text: "Homepage cache cleared successfully." } });
    } catch (err) {
      set({
        cacheMsg: {
          type: "error",
          text: extractErrorMessage(err, "Failed to clear cache."),
        },
      });
    } finally {
      set({ cacheClearing: false });
    }
  },

  loadAudit: async (page = 1) => {
    const { auditFilters } = get();
    set({ auditLoading: true, auditError: "" });
    try {
      const data = await fetchAuditLogs(page, AUDIT_PAGE_LIMIT, auditFilters);
      set({
        auditItems: data.items || [],
        auditTotal: data.total || 0,
        auditPage: page,
        auditLoading: false,
      });
    } catch (err) {
      set({
        auditError: extractErrorMessage(err, "Failed to load audit logs."),
        auditLoading: false,
      });
    }
  },

  loadAuditFilterOptions: async () => {
    try {
      const data = await fetchAuditFilterOptions();
      set({ auditActors: data.actors || [], auditActions: data.actions || [] });
    } catch {
      // non-fatal - filters just won't populate; the log still loads.
    }
  },

  setAuditFilter: (key, value) => {
    set((s) => ({ auditFilters: { ...s.auditFilters, [key]: value } }));
    get().loadAudit(1); // re-query from page 1 whenever a filter changes
  },

  clearAuditFilters: () => {
    set({ auditFilters: { performed_by: "", action: "", date_from: "", date_to: "" } });
    get().loadAudit(1);
  },
}));

export const useAdminAccessStore = create((set, get) => ({
  admins: [],
  adminsLoading: true,
  adminsError: "",
  selectedAdmin: null,
  screens: [],
  permissions: [],
  effective: null,
  lockout: null,
  editorLoading: true,
  editorError: "",
  busyKey: null,
  unlocking: false,

  loadAdmins: async () => {
    set({ adminsLoading: true, adminsError: "" });
    try {
      const { fetchAdminStaff } = await import("../services/settingsService.js");
      const admins = await fetchAdminStaff();
      set({ admins, adminsLoading: false });
    } catch (err) {
      set({
        adminsError: extractErrorMessage(err, "Failed to load admin accounts."),
        adminsLoading: false,
      });
    }
  },

  selectAdmin: (selectedAdmin) => set({ selectedAdmin }),
  clearSelectedAdmin: () => set({ selectedAdmin: null }),

  loadEditor: async (adminId) => {
    set({ editorLoading: true, editorError: "" });
    try {
      const {
        fetchRbacScreens,
        fetchRbacPermissions,
        fetchEffectivePermissions,
        fetchLockoutStatus,
      } = await import("../services/settingsService.js");
      const [screensRes, permsRes, effectiveRes, lockoutRes] = await Promise.all([
        fetchRbacScreens(),
        fetchRbacPermissions(),
        fetchEffectivePermissions(adminId),
        fetchLockoutStatus(adminId),
      ]);
      set({
        screens: (screensRes || []).filter((s) => s.is_active && s.app === "admin_panel"),
        permissions: permsRes || [],
        effective: effectiveRes,
        lockout: lockoutRes,
        editorLoading: false,
      });
    } catch (err) {
      set({
        editorError: extractErrorMessage(err, "Failed to load permissions."),
        editorLoading: false,
      });
    }
  },

  unlockAccount: async (admin) => {
    set({ unlocking: true });
    try {
      const { unlockAdminAccount, fetchLockoutStatus } = await import("../services/settingsService.js");
      await unlockAdminAccount(admin.id);
      const lockout = await fetchLockoutStatus(admin.id);
      set({ lockout, unlocking: false });
    } catch (err) {
      set({ unlocking: false });
      throw err;
    }
  },

  grantCell: async (admin, screen, perm) => {
    const key = `${screen.id}-${perm.id}`;
    set({ busyKey: key });
    try {
      const { grantPermission } = await import("../services/settingsService.js");
      await grantPermission({
        user_id: admin.id,
        screen_id: screen.id,
        permission_id: perm.id,
      });
      await get().loadEditor(admin.id);
    } finally {
      set({ busyKey: null });
    }
  },

  revokeCell: async (admin, screen, perm) => {
    const key = `${screen.id}-${perm.id}`;
    set({ busyKey: key });
    try {
      const { revokePermission } = await import("../services/settingsService.js");
      await revokePermission({
        user_id: admin.id,
        screen_id: screen.id,
        permission_id: perm.id,
      });
      await get().loadEditor(admin.id);
    } finally {
      set({ busyKey: null });
    }
  },

  resetCell: async (admin, screen, perm) => {
    const { effective } = get();
    const key = `${screen.id}-${perm.id}`;
    const revokedRow = effective?.explicit_revokes.find(
      (r) => r.screen_name === screen.screen_name && r.permission_name === perm.permission_name
    );
    const overrideScreen = effective?.account_overrides.find((s) => s.screen_name === screen.screen_name);
    const grantedRow = overrideScreen?.permission_entries?.find(
      (e) => e.permission_name === perm.permission_name
    );
    const mappingId = revokedRow?.id ?? grantedRow?.id;
    if (!mappingId) return;

    set({ busyKey: key });
    try {
      const { deletePermissionMapping } = await import("../services/settingsService.js");
      await deletePermissionMapping(mappingId);
      await get().loadEditor(admin.id);
    } finally {
      set({ busyKey: null });
    }
  },
}));
