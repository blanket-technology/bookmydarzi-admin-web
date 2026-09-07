import { useEffect, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { sortFaqs } from "../utils/supportUtils.js";
import { useFaqStore } from "../store/faqStore.js";

export default function useFaqs() {
  const faqs = useFaqStore((s) => s.faqs);
  const loading = useFaqStore((s) => s.loading);
  const error = useFaqStore((s) => s.error);
  const catFilter = useFaqStore((s) => s.catFilter);
  const setCatFilter = useFaqStore((s) => s.setCatFilter);
  const fetchFaqs = useFaqStore((s) => s.fetchFaqs);
  const saveFaq = useFaqStore((s) => s.saveFaq);
  const removeFaq = useFaqStore((s) => s.removeFaq);

  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaq, setDeletingFaq] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, [catFilter, fetchFaqs]);

  const sortedFaqs = sortFaqs(faqs);

  const handleSaved = () => {
    setEditingFaq(null);
  };

  const handleSaveFaq = async (payload, id) => {
    const saved = await saveFaq(payload, id);
    handleSaved(saved);
    return saved;
  };

  const handleDeleteFaq = async (faq) => {
    try {
      await removeFaq(faq.id);
      setDeletingFaq(null);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    }
  };

  return {
    faqs: sortedFaqs,
    loading,
    error,
    catFilter,
    editingFaq,
    deletingFaq,
    setCatFilter,
    setEditingFaq,
    setDeletingFaq,
    fetchFaqs,
    handleSaveFaq,
    handleDeleteFaq,
  };
}
