import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import * as cmsService from "../services/cmsService.js";

export const useBannerStore = create((set, get) => ({
  banners: [],
  loading: true,
  error: "",

  fetchBanners: async () => {
    set({ loading: true, error: "" });
    try {
      const banners = await cmsService.getHomeBanners();
      set({ banners, loading: false });
    } catch (err) {
      set({ error: extractErrorMessage(err, "Failed to load banners."), loading: false });
    }
  },

  saveBanner: async (editingId, payload) => {
    if (editingId) {
      await cmsService.updateBanner(editingId, payload);
    } else {
      await cmsService.createBanner(payload);
    }
    await get().fetchBanners();
  },

  deleteBanner: async (id) => {
    await cmsService.deleteBanner(id);
    await get().fetchBanners();
  },
}));

export const useLookbookStore = create((set, get) => ({
  items: [],
  loading: true,
  error: "",
  filterCat: "all",

  setFilterCat: (filterCat) => set({ filterCat }),

  fetchItems: async () => {
    const { filterCat } = get();
    set({ loading: true, error: "" });
    try {
      const params = { limit: 100 };
      if (filterCat && filterCat !== "all") params.category = filterCat;
      const items = await cmsService.getLookbookItems(params);
      set({ items, loading: false });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load lookbook items."),
        loading: false,
      });
    }
  },

  saveItem: async (editingId, payload) => {
    if (editingId) {
      await cmsService.updateLookbookItem(editingId, payload);
    } else {
      await cmsService.createLookbookItem(payload);
    }
    await get().fetchItems();
  },

  deleteItem: async (id) => {
    await cmsService.deleteLookbookItem(id);
    await get().fetchItems();
  },
}));
