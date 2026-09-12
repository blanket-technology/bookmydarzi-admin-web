import { create } from "zustand";

// Only the expiry filter is actually read from here - list fetching and
// create/update/delete/toggle mutations migrated to React Query in
// useOffers.js (which handles loading/error state and cache invalidation
// per-call there instead). The old fetchOffers/deleteOffer/toggleOffer/
// saveOffer actions that used to live here were dead code with no try/catch
// or error handling at all - kept only the field useOffers.js still reads.
export const useOfferStore = create((set) => ({
  expiryFilter: "",
  setExpiryFilter: (expiryFilter) => set({ expiryFilter }),
}));
