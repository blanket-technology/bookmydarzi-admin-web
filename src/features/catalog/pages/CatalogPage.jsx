import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import CatalogModals from "../components/CatalogModals.jsx";
import CatalogTree from "../components/CatalogTree.jsx";
import useCatalog from "../hooks/useCatalog.js";

export default function CatalogPage() {
  const {
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
  } = useCatalog();

  return (
    <>
      <CatalogModals
        modal={modal}
        deleting={deleting}
        closeModal={closeModal}
        refresh={refresh}
        handleDeleteCat={handleDeleteCat}
        handleDeleteLine={handleDeleteLine}
        handleDeleteService={handleDeleteService}
      />

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Service Catalog"
          subtitle={`${activeCategories.length} categories · ${totalLines} sub-categories`}
          actions={
            <button onClick={loadCatalog} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <RefreshCw size={13} /> Refresh
            </button>
          }
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-teal-600" size={32} />
            <p className="text-gray-500 text-sm">Loading catalog…</p>
          </div>
        ) : (
          <CatalogTree
            categories={sortedCategories}
            onAddCategory={() => setModal({ type: "create-category" })}
            onEditCategory={(cat) => setModal({ type: "edit-category", data: cat })}
            onDeleteCategory={(cat) => setModal({ type: "delete-category", data: cat })}
            onRestoreCategory={handleRestoreCategory}
            onAddLine={(cat) => setModal({ type: "create-line", categoryId: cat.id, catName: cat.name })}
            onEditLine={(line, cat) => setModal({ type: "edit-line", data: line, catName: cat.name })}
            onDeleteLine={(line) => setModal({ type: "delete-line", data: line })}
            onRestoreLine={handleRestoreLine}
            onAddService={(cat, line) => setModal({
              type: "create-service",
              categoryId: cat.id,
              lineId: line?.id ?? null,
              lineName: line?.name ?? null,
            })}
            onEditService={(svc, parent) => setModal({ type: "edit-service", data: svc, lineName: parent.lineName })}
            onDeleteService={(svc) => setModal({ type: "delete-service", data: svc })}
            onRestoreService={handleRestoreService}
            onManageAddons={(svc) => setModal({ type: "service-addons", data: svc })}
            restoringId={restoringId}
            showInactive={showInactive}
            onToggleShowInactive={setShowInactive}
            onReordered={() => loadCatalog()}
          />
        )}
      </div>
    </>
  );
}
