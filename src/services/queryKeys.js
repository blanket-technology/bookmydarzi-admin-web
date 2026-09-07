export const usersListQueryKey = ({ page, limit, debouncedSearch, roleFilter, statusFilter }) => [
  "users",
  { page, limit, debouncedSearch, roleFilter, statusFilter },
];

export const orderListQueryKey = ({ endpoint, page, limit, filterStatus, filterPayment, filterTailor, dateFrom, dateTo, needsManualAssignment, debouncedSearch }) => [
  "orders",
  { endpoint, page, limit, filterStatus, filterPayment, filterTailor, dateFrom, dateTo, needsManualAssignment, debouncedSearch },
];

export const profileQueryKey = () => ["profile"];

export const supportTicketsQueryKey = ({ page, limit, statusFilter, debouncedSearch }) => [
  "supportTickets",
  { page, limit, statusFilter, debouncedSearch },
];

export const cancellationsQueryKey = ({ page, statusFilter, paymentFilter }) => [
  "cancellations",
  { page, statusFilter, paymentFilter },
];

export const offersQueryKey = () => ["offers"];

export const leaveRequestsQueryKey = ({ page, statusFilter, roleFilter }) => [
  "leave-requests",
  { page, statusFilter, roleFilter },
];
