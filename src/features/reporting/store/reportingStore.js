import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { fetchReportingData } from "../services/reportingService.js";

export const useReportingStore = create((set) => ({
  data: null,
  loading: true,
  error: "",
  lastFetched: null,

  fetchData: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await fetchReportingData();
      set({ data, loading: false, lastFetched: new Date() });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load reporting data."),
        loading: false,
      });
    }
  },
}));
