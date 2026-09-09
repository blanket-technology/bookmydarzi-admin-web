import { create } from "zustand";

// Filter/pagination UI state only - the actual cancellations data comes
// from react-query in useCancellations.js. This store previously also held
// items/total/loading/error + a fetchCancellations() that duplicated that
// same fetch through a second, never-invalidated cache; nothing consumed
// it (verified: no call site anywhere calls fetchCancellations or reads
// items/total/loading/error from this store), so it was a dead, disconnected
// path that a future page could wire into by mistake and silently show
// stale data forever. Removed - keep this store to exactly what's used.
export const useCancellationStore = create((set) => ({
  page: 0,
  statusFilter: "",
  paymentFilter: "",

  setPage: (page) => set({ page }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 0 }),
  setPaymentFilter: (paymentFilter) => set({ paymentFilter, page: 0 }),
}));
