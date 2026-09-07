import { useEffect, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import {
  countActive,
  countInactive,
  getVisibleAreas,
} from "../utils/serviceAreaUtils.js";
import { useServiceAreaStore } from "../store/serviceAreaStore.js";

export default function useServiceAreas() {
  const areas = useServiceAreaStore((s) => s.areas);
  const loading = useServiceAreaStore((s) => s.loading);
  const error = useServiceAreaStore((s) => s.error);
  const fetchAreas = useServiceAreaStore((s) => s.fetchAreas);
  const saveArea = useServiceAreaStore((s) => s.saveArea);
  const toggleActive = useServiceAreaStore((s) => s.toggleActive);
  const removeArea = useServiceAreaStore((s) => s.removeArea);

  const [modalArea, setModalArea] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const openCreate = () => {
    setModalArea(null);
    setShowModal(true);
  };

  const openEdit = (area) => {
    setModalArea(area);
    setShowModal(true);
  };

  const handleSaved = async (payload, id) => {
    await saveArea(payload, id);
  };

  const handleToggleActive = async (area) => {
    try {
      await toggleActive(area);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Status update failed."));
    }
  };

  const handleDelete = async (area) => {
    if (!(await confirmDialog({
      title: "Delete this service area?",
      description: `Permanently delete "${area.name}"? This cannot be undone.`,
      confirmLabel: "Yes, Delete",
      tone: "danger",
    }))) return;
    setDeletingId(area.id);
    try {
      await removeArea(area.id);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    } finally {
      setDeletingId(null);
    }
  };

  return {
    areas,
    loading,
    error,
    modalArea,
    showModal,
    showInactive,
    deletingId,
    visibleAreas: getVisibleAreas(areas, showInactive),
    inactiveCount: countInactive(areas),
    activeCount: countActive(areas),
    setShowModal,
    setShowInactive,
    openCreate,
    openEdit,
    handleSaved,
    handleToggleActive,
    handleDelete,
    fetchAreas,
  };
}
