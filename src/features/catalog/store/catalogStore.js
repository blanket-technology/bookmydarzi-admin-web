import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { parseCatalogTree } from "../utils/catalogUtils.js";
import * as catalogService from "../services/catalogService.js";

export const useCatalogStore = create((set) => ({
  categories: [],
  loading: true,
  error: "",

  fetchCatalog: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await catalogService.getCatalogTree();
      const categories = parseCatalogTree(data);
      set({ categories, loading: false });
      return categories;
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load catalog."),
        loading: false,
      });
      return null;
    }
  },

  deleteCategory: async (id) => {
    await catalogService.deleteCategory(id);
  },

  deleteServiceLine: async (id) => {
    await catalogService.deleteServiceLine(id);
  },

  deleteService: async (serviceId) => {
    await catalogService.deleteService(serviceId);
  },

  restoreCategory: async (id) => {
    await catalogService.updateCategory(id, { is_active: true });
  },

  restoreServiceLine: async (id) => {
    await catalogService.updateServiceLine(id, { is_active: true });
  },

  restoreService: async (serviceId) => {
    await catalogService.updateService(serviceId, { is_active: true });
  },

  reorderItems: async (reorderPath, items, getId) => {
    await catalogService.reorderCatalogItems(reorderPath, items, getId);
  },
}));
