import { useEffect, useState, useCallback } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import { countActiveCategories, countTotalLines, sortByDisplayOrder } from "../utils/catalogUtils.js";
import { useCatalogStore } from "../store/catalogStore.js";

export default function useCatalog() {
  const categories = useCatalogStore((s) => s.categories);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const fetchCatalog = useCatalogStore((s) => s.fetchCatalog);
  const deleteCategory = useCatalogStore((s) => s.deleteCategory);
  const deleteServiceLine = useCatalogStore((s) => s.deleteServiceLine);
  const deleteService = useCatalogStore((s) => s.deleteService);
  const restoreCategory = useCatalogStore((s) => s.restoreCategory);
  const restoreServiceLine = useCatalogStore((s) => s.restoreServiceLine);
  const restoreService = useCatalogStore((s) => s.restoreService);

  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadCatalog = useCallback(async () => {
    await fetchCatalog();
  }, [fetchCatalog]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    loadCatalog();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  const closeModal = () => setModal(null);
  const refresh = () => loadCatalog();

  const handleDeleteCat = async () => {
    setDeleting(true);
    try {
      await deleteCategory(modal.data.id);
      await refresh();
      closeModal();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteLine = async () => {
    setDeleting(true);
    try {
      await deleteServiceLine(modal.data.id);
      await refresh();
      closeModal();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteService = async () => {
    setDeleting(true);
    try {
      await deleteService(modal.data.service_id);
      await refresh();
      closeModal();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreCategory = async (cat) => {
    setRestoringId(`cat-${cat.id}`);
    try {
      await restoreCategory(cat.id);
      await refresh();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Restore failed."));
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreLine = async (line) => {
    setRestoringId(`line-${line.id}`);
    try {
      await restoreServiceLine(line.id);
      await refresh();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Restore failed."));
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreService = async (svc) => {
    setRestoringId(`svc-${svc.service_id}`);
    try {
      await restoreService(svc.service_id);
      await refresh();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Restore failed."));
    } finally {
      setRestoringId(null);
    }
  };

  const activeCategories = countActiveCategories(categories);
  const totalLines = countTotalLines(activeCategories);
  const sortedCategories = sortByDisplayOrder(categories);

  return {
    categories,
    sortedCategories,
    loading,
    error,
    modal,
    deleting,
    restoringId,
    showInactive,
    activeCategories,
    totalLines,
    setModal,
    setShowInactive,
    closeModal,
    refresh,
    loadCatalog,
    handleDeleteCat,
    handleDeleteLine,
    handleDeleteService,
    handleRestoreCategory,
    handleRestoreLine,
    handleRestoreService,
  };
}
