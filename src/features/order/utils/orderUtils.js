import { STATUS_LABELS } from "../../../utils/orderActions.js";

export function buildOrdersListParams({
  page,
  limit,
  isTailor,
  filterStatus,
  debouncedSearch,
  filterPayment,
  filterTailor,
  dateFrom,
  dateTo,
  needsManualAssignment,
}) {
  const params = { page, limit: isTailor ? Math.min(limit, 50) : limit };
  if (filterStatus) params.status = filterStatus;
  if (!isTailor) {
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterPayment) params.payment_status = filterPayment;
    if (filterTailor) params.tailor_id = filterTailor;
    if (dateFrom) params.date_from = new Date(dateFrom).toISOString();
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      params.date_to = end.toISOString();
    }
    if (needsManualAssignment) params.needs_manual_assignment = true;
  }
  return params;
}

export function countActiveFilters({ filterPayment, filterTailor, dateFrom, dateTo, needsManualAssignment }) {
  return (
    (filterPayment ? 1 : 0) +
    (filterTailor ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (needsManualAssignment ? 1 : 0)
  );
}

export function themeFor(status, STATUS_THEME, DEFAULT_THEME) {
  return STATUS_THEME[status] || DEFAULT_THEME;
}

export function getStatusFilterOptions() {
  return Object.entries(STATUS_LABELS);
}

export function filterEligibleTailors(tailors) {
  return (tailors || []).filter((t) => t.is_approved !== false && t.is_active !== false);
}
