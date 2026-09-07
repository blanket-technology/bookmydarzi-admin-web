import { useEffect, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import { LOOKBOOK_ITEM_INIT } from "../constants/cmsConstants.js";
import { buildLookbookPayload, lookbookItemToForm } from "../utils/cmsUtils.js";
import { useLookbookStore } from "../store/cmsStore.js";

export default function useLookbook() {
  const items = useLookbookStore((s) => s.items);
  const loading = useLookbookStore((s) => s.loading);
  const error = useLookbookStore((s) => s.error);
  const filterCat = useLookbookStore((s) => s.filterCat);
  const setFilterCat = useLookbookStore((s) => s.setFilterCat);
  const fetchItems = useLookbookStore((s) => s.fetchItems);
  const saveItem = useLookbookStore((s) => s.saveItem);
  const deleteItem = useLookbookStore((s) => s.deleteItem);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(LOOKBOOK_ITEM_INIT);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [filterCat, fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(LOOKBOOK_ITEM_INIT);
    setSaveMsg(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm(lookbookItemToForm(item));
    setSaveMsg(null);
    setShowModal(true);
  };

  const updateForm = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url.trim()) {
      setSaveMsg({ type: "error", text: "Image is required." });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = buildLookbookPayload(form, editingId);
      await saveItem(editingId, payload);
      setSaveMsg({ type: "success", text: editingId ? "Item updated." : "Item created." });
      setTimeout(() => setShowModal(false), 800);
    } catch (err) {
      setSaveMsg({ type: "error", text: extractErrorMessage(err, "Save failed.") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmDialog({
      title: "Deactivate this lookbook item?",
      description: "It will no longer be shown in the lookbook.",
      confirmLabel: "Yes, Deactivate",
      tone: "danger",
    }))) return;
    setDeletingId(id);
    try {
      await deleteItem(id);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to deactivate item."));
    } finally {
      setDeletingId(null);
    }
  };

  return {
    items,
    loading,
    error,
    filterCat,
    showModal,
    editingId,
    form,
    saving,
    saveMsg,
    deletingId,
    setFilterCat,
    setShowModal,
    updateForm,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
}
