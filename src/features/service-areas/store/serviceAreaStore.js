import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { upsertArea } from "../utils/serviceAreaUtils.js";
import {
  createServiceArea,
  deleteServiceArea,
  getServiceAreas,
  updateServiceArea,
} from "../services/serviceAreaService.js";

export const useServiceAreaStore = create((set, get) => ({
  areas: [],
  loading: true,
  error: "",

  fetchAreas: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await getServiceAreas();
      set({ areas: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load service areas."),
        loading: false,
      });
    }
  },

  saveArea: async (payload, id) => {
    const data = id
      ? await updateServiceArea(id, payload)
      : await createServiceArea(payload);
    set({ areas: upsertArea(get().areas, data) });
    return data;
  },

  toggleActive: async (area) => {
    const data = await updateServiceArea(area.id, { is_active: !area.is_active });
    set({ areas: upsertArea(get().areas, data) });
    return data;
  },

  removeArea: async (id) => {
    await deleteServiceArea(id);
    set({ areas: get().areas.filter((a) => a.id !== id) });
  },
}));
