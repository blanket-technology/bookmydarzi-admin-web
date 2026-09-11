import { useEffect, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import { BANNER_INIT } from "../constants/cmsConstants.js";
import { bannerToForm, buildBannerPayload, getBannerId } from "../utils/cmsUtils.js";
import { useBannerStore } from "../store/cmsStore.js";

export default function useBanners() {
  const banners = useBannerStore((s) => s.banners);
  const loading = useBannerStore((s) => s.loading);
  const error = useBannerStore((s) => s.error);
  const fetchBanners = useBannerStore((s) => s.fetchBanners);
  const saveBanner = useBannerStore((s) => s.saveBanner);
  const deleteBanner = useBannerStore((s) => s.deleteBanner);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BANNER_INIT);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditingId(null);
    setForm(BANNER_INIT);
    setSaveMsg(null);
    setShowModal(true);
  };

  const openEdit = (banner) => {
    setEditingId(getBannerId(banner));
    setForm(bannerToForm(banner));
    setSaveMsg(null);
    setShowModal(true);
  };

  const updateForm = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = buildBannerPayload(form);
      await saveBanner(editingId, payload);
      setSaveMsg({ type: "success", text: editingId ? "Banner updated." : "Banner created." });
      setTimeout(() => setShowModal(false), 800);
    } catch (err) {
      setSaveMsg({ type: "error", text: extractErrorMessage(err, "Save failed.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmDialog({
      title: "Delete this banner?",
      description: "This permanently removes the banner. This cannot be undone.",
      confirmLabel: "Yes, Delete",
      tone: "danger",
    }))) return;
    setDeletingId(id);
    try {
      await deleteBanner(id);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    } finally {
      setDeletingId(null);
    }
  };

  return {
    banners,
    loading,
    error,
    showModal,
    editingId,
    form,
    saving,
    saveMsg,
    deletingId,
    setShowModal,
    updateForm,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
}
