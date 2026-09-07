import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import CatalogBreadcrumb from "../components/CatalogBreadcrumb.jsx";
import CatalogModals from "../components/CatalogModals.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import ServiceLineGrid from "../components/ServiceLineGrid.jsx";
import StitchTypeList from "../components/StitchTypeList.jsx";
import ServiceDetailView from "../components/ServiceDetailView.jsx";
import useCatalog from "../hooks/useCatalog.js";

export default function CatalogPage() {
  const {
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
  } = useCatalog();

  const openServiceModal = (prefillName) => setModal(openCreateServiceModal(prefillName));

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
            <>
              {level > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              )}
              <button onClick={loadCatalog} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                <RefreshCw size={13} /> Refresh
              </button>
            </>
          }
        />

        {level > 0 && (
          <div className="bg-white rounded-xl px-4 py-3 mb-4 shadow-sm border border-gray-100">
            <CatalogBreadcrumb crumbs={crumbs} onNavigate={handleCrumbNav} />
          </div>
        )}

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
          <>
            {level === 0 && (
              <CategoryGrid
                categories={sortedCategories}
                onSelect={(cat) => setSelectedCategory(cat)}
                onEdit={(cat) => setModal({ type: "edit-category", data: cat })}
                onDelete={(cat) => setModal({ type: "delete-category", data: cat })}
                onAdd={() => setModal({ type: "create-category" })}
                showInactive={showInactive}
                onToggleShowInactive={setShowInactive}
                onRestore={handleRestoreCategory}
                restoringId={restoringId}
                onReordered={() => loadCatalog()}
              />
            )}

            {level === 1 && selectedCategory && (
              <ServiceLineGrid
                category={selectedCategory}
                onSelect={(line) => setSelectedLine(line)}
                onEdit={(line) => setModal({ type: "edit-line", data: line, catName: selectedCategory.name })}
                onDelete={(line) => setModal({ type: "delete-line", data: line })}
                onDeleteService={(svc) => setModal({ type: "delete-service", data: svc })}
                onAdd={() => setModal({ type: "create-line", categoryId: selectedCategory.id, catName: selectedCategory.name })}
                onRestoreLine={handleRestoreLine}
                onRestoreService={handleRestoreService}
                restoringId={restoringId}
                showInactive={showInactiveLines}
                onToggleShowInactive={setShowInactiveLines}
                onReordered={() => loadCatalog()}
              />
            )}

            {level === 2 && selectedLine && selectedCategory && (
              <StitchTypeList
                line={selectedLine}
                onEditItem={(svc) => setModal({ type: "edit-service", data: svc, lineName: selectedLine.name })}
                onDeleteItem={(svc) => setModal({ type: "delete-service", data: svc })}
                onAddType={() => setModal({ type: "add-type", categoryId: selectedCategory.id, lineId: selectedLine.id, lineName: selectedLine.name })}
                onAddSingleItem={(prefillName) => openServiceModal(prefillName ?? "")}
                onSelectType={(g) => setSelectedType(g)}
              />
            )}

            {level === 3 && selectedType && selectedLine && selectedCategory && (
              <ServiceDetailView
                group={selectedType}
                line={selectedLine}
                category={selectedCategory}
                onEditItem={(svc) => setModal({ type: "edit-service", data: svc, lineName: selectedLine.name })}
                onDeleteItem={(svc) => setModal({ type: "delete-service", data: svc })}
                onAddSingleItem={(prefillName) => openServiceModal(prefillName ?? "")}
              />
            )}
          </>
        )}

        {level === 0 && !loading && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Click a category card to manage its sub-categories and items
          </p>
        )}
      </div>
    </>
  );
}
