import { create } from "zustand";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { upsertFaq } from "../utils/supportUtils.js";
import { createFaq, deleteFaq, getFaqs, updateFaq } from "../services/supportService.js";

export const useFaqStore = create((set, get) => ({
  faqs: [],
  loading: true,
  error: "",
  catFilter: "",

  setCatFilter: (catFilter) => set({ catFilter }),

  fetchFaqs: async () => {
    const { catFilter } = get();
    set({ loading: true, error: "" });
    try {
      const params = catFilter ? { category: catFilter } : {};
      const data = await getFaqs(params);
      set({ faqs: data?.faqs ?? [], loading: false });
    } catch (err) {
      set({
        error: extractErrorMessage(err, "Failed to load FAQs."),
        loading: false,
      });
    }
  },

  saveFaq: async (payload, id) => {
    const data = id ? await updateFaq(id, payload) : await createFaq(payload);
    set({ faqs: upsertFaq(get().faqs, data) });
    return data;
  },

  removeFaq: async (id) => {
    await deleteFaq(id);
    set({ faqs: get().faqs.filter((f) => f.id !== id) });
  },
}));
