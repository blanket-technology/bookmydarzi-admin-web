import { useEffect } from "react";
import { useSettingsStore } from "../store/settingsStore.js";
import { AUDIT_PAGE_LIMIT } from "../constants/settingsConstants.js";

export default function useAudit() {
  const auditItems = useSettingsStore((s) => s.auditItems);
  const auditTotal = useSettingsStore((s) => s.auditTotal);
  const auditPage = useSettingsStore((s) => s.auditPage);
  const auditLoading = useSettingsStore((s) => s.auditLoading);
  const auditError = useSettingsStore((s) => s.auditError);
  const loadAudit = useSettingsStore((s) => s.loadAudit);
  const auditFilters = useSettingsStore((s) => s.auditFilters);
  const auditActors = useSettingsStore((s) => s.auditActors);
  const auditActions = useSettingsStore((s) => s.auditActions);
  const setAuditFilter = useSettingsStore((s) => s.setAuditFilter);
  const clearAuditFilters = useSettingsStore((s) => s.clearAuditFilters);
  const loadAuditFilterOptions = useSettingsStore((s) => s.loadAuditFilterOptions);

  useEffect(() => {
    loadAudit(1);
    loadAuditFilterOptions();
  }, [loadAudit, loadAuditFilterOptions]);

  const totalPages = Math.ceil(auditTotal / AUDIT_PAGE_LIMIT);
  const hasFilters = Object.values(auditFilters).some(Boolean);

  return {
    auditItems,
    auditTotal,
    auditPage,
    auditLoading,
    auditError,
    totalPages,
    loadAudit,
    auditFilters,
    auditActors,
    auditActions,
    setAuditFilter,
    clearAuditFilters,
    hasFilters,
  };
}
