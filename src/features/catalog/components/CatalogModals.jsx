import ConfirmDelete from "./ConfirmDelete.jsx";
import CatalogItemModal from "./CatalogItemModal.jsx";
import ServiceAddonsModal from "./ServiceAddonsModal.jsx";

export default function CatalogModals({
  modal,
  deleting,
  closeModal,
  refresh,
  handleDeleteCat,
  handleDeleteLine,
  handleDeleteService,
}) {
  if (!modal) return null;

  return (
    <>
      {modal.type === "create-category" && (
        <CatalogItemModal level="category" onClose={closeModal} onSaved={refresh} />
      )}
      {modal.type === "edit-category" && (
        <CatalogItemModal level="category" initial={modal.data} onClose={closeModal} onSaved={refresh} />
      )}
      {modal.type === "delete-category" && (
        <ConfirmDelete message={`Delete "${modal.data.name}"? All its sub-categories and items will also be deactivated.`} onConfirm={handleDeleteCat} onClose={closeModal} loading={deleting} />
      )}

      {modal.type === "create-line" && (
        <CatalogItemModal
          level="line"
          parent={{ categoryId: modal.categoryId, categoryName: modal.catName }}
          onClose={closeModal}
          onSaved={refresh}
        />
      )}
      {modal.type === "edit-line" && (
        <CatalogItemModal
          level="line"
          initial={modal.data}
          parent={{ categoryId: modal.data.category_id, categoryName: modal.catName }}
          onClose={closeModal}
          onSaved={refresh}
        />
      )}
      {modal.type === "delete-line" && (
        <ConfirmDelete message={`Delete sub-category "${modal.data.name}"? All its items will also be deactivated.`} onConfirm={handleDeleteLine} onClose={closeModal} loading={deleting} />
      )}

      {modal.type === "create-service" && (
        <CatalogItemModal
          level="service"
          initial={modal.prefillName ? { name: modal.prefillName, base_price: 0, is_active: true, is_premium: false, display_order: 0, estimated_delivery_days: 7 } : undefined}
          parent={{ categoryId: modal.categoryId, lineId: modal.lineId, lineName: modal.lineName }}
          onClose={closeModal}
          onSaved={refresh}
        />
      )}
      {modal.type === "edit-service" && (
        <CatalogItemModal
          level="service"
          initial={modal.data}
          parent={{ categoryId: modal.data.category_id, lineId: modal.data.service_line_id, lineName: modal.lineName }}
          onClose={closeModal}
          onSaved={refresh}
        />
      )}
      {modal.type === "delete-service" && (
        <ConfirmDelete message={`Delete item "${modal.data.name}"?`} onConfirm={handleDeleteService} onClose={closeModal} loading={deleting} />
      )}

      {modal.type === "service-addons" && (
        <ServiceAddonsModal service={modal.data} onClose={closeModal} />
      )}
    </>
  );
}
