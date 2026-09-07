import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import * as offerService from "../services/offerService.js";

export const useOfferStore = create((set, get) => ({
  offers: [],
  loading: true,
  error: "",
  expiryFilter: "",

  setExpiryFilter: (expiryFilter) => set({ expiryFilter }),

  fetchOffers: async () => {
    set({ loading: true, error: "" });
    try {
      const offers = await offerService.getOffers();
      set({ offers, loading: false });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load offers."),
        loading: false,
      });
    }
  },

  deleteOffer: async (offer) => {
    await offerService.deleteOffer(offer.Id);
    await get().fetchOffers();
  },

  toggleOffer: async (offer) => {
    const nextActive = !offer.IsActive;
    await offerService.toggleOfferActive(offer.Id, nextActive);
    await get().fetchOffers();
  },

  saveOffer: async (editingId, payload) => {
    if (editingId) {
      await offerService.updateOffer(editingId, payload);
    } else {
      await offerService.createOffer(payload);
    }
    await get().fetchOffers();
  },
}));
