import { useEffect, useState, useCallback } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { notifyError } from "../../../services/dialogService.js";
import {
  buildCatalogCrumbs,
  countActiveCategories,
  countTotalLines,
  getCatalogLevel,
  groupByBaseName,
  refreshSelectionPointers,
  sortByDisplayOrder,
} from "../utils/catalogUtils.js";
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

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showInactiveLines, setShowInactiveLines] = useState(false);

  const level = getCatalogLevel(selectedCategory, selectedLine, selectedType);

  const loadCatalog = useCallback(async () => {
    const cats = await fetchCatalog();
    if (!cats) return;
    const refreshed = refreshSelectionPointers(cats, selectedCategory, selectedLine, selectedType);
    setSelectedCategory(refreshed.selectedCategory);
    setSelectedLine(refreshed.selectedLine);
    setSelectedType(refreshed.selectedType);
  }, [fetchCatalog, selectedCategory, selectedLine, selectedType]);

  // Fetch-on-mount; setState happens inside loadCatalog's async handlers,
  // not synchronously in the effect body.
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
      if (selectedCategory?.id === modal.data.id) {
        setSelectedCategory(null);
        setSelectedLine(null);
        setSelectedType(null);
      }
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
      if (selectedLine?.id === modal.data.id) {
        setSelectedLine(null);
        setSelectedType(null);
      }
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

  const crumbs = buildCatalogCrumbs(selectedCategory, selectedLine, selectedType);

  const handleCrumbNav = (idx) => {
    if (idx === 0) {
      setSelectedCategory(null);
      setSelectedLine(null);
      setSelectedType(null);
    } else if (idx === 1) {
      setSelectedLine(null);
      setSelectedType(null);
    } else if (idx === 2) {
      setSelectedType(null);
    }
  };

  const handleBack = () => {
    if (level === 3) setSelectedType(null);
    else if (level === 2) setSelectedLine(null);
    else {
      setSelectedCategory(null);
      setSelectedLine(null);
    }
  };

  const activeCategories = countActiveCategories(categories);
  const totalLines = countTotalLines(activeCategories);
  const sortedCategories = sortByDisplayOrder(categories);

  const openCreateServiceModal = (prefillName = "") => ({
    type: "create-service",
    categoryId: selectedCategory.id,
    lineId: selectedLine.id,
    lineName: selectedLine.name,
    prefillName,
  });

  return {
    categories,
    sortedCategories,
    loading,
    error,
    level,
    selectedCategory,
    selectedLine,
    selectedType,
    modal,
    deleting,
    restoringId,
    showInactive,
    showInactiveLines,
    crumbs,
    activeCategories,
    totalLines,
    setSelectedCategory,
    setSelectedLine,
    setSelectedType,
    setModal,
    setShowInactive,
    setShowInactiveLines,
    closeModal,
    refresh,
    loadCatalog,
    handleDeleteCat,
    handleDeleteLine,
    handleDeleteService,
    handleRestoreCategory,
    handleRestoreLine,
    handleRestoreService,
    handleCrumbNav,
    handleBack,
    openCreateServiceModal,
    groupByBaseName,
  };
}
