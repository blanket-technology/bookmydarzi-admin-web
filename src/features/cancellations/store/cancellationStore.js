import { create } from "zustand";

// Filter/pagination UI state only - the actual cancellations data comes
// from react-query in useCancellations.js. This store previously also held
// items/total/loading/error + a fetchCancellations() that duplicated that
// same fetch through a second, never-invalidated cache; nothing consumed
// it (verified: no call site anywhere calls fetchCancellations or reads
// items/total/loading/error from this store), so it was a dead, disconnected
// path that a future page could wire into by mistake and silently show
// stale data forever. Removed - keep this store to exactly what's used.
// 1-based `page`, matching every other list screen's convention
// (Users/Tailors/Bridge/Orders/Payments all use 1-based page/limit) - this
// used to be the one screen with its own 0-based scheme (page 0 = first
// page, displayed as "Page {page+1}"), a real inconsistency risk: a future
// dev reusing the shared Pagination component here (which is 1-based) or
// copying this screen's convention elsewhere would introduce an off-by-one.
// The backend's cancellations list endpoint is still skip/limit
// (offset-based, unlike the page-based admin endpoints) - that conversion
// now happens only at the API-param boundary (buildCancellationParams),
// not in this store's own state.
export const useCancellationStore = create((set) => ({
  page: 1,
  statusFilter: "",
  paymentFilter: "",

  setPage: (page) => set({ page }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setPaymentFilter: (paymentFilter) => set({ paymentFilter, page: 1 }),
}));
