import ConfirmDelete from "./ConfirmDelete.jsx";
import CategoryModal from "./CategoryModal.jsx";
import ServiceLineModal from "./ServiceLineModal.jsx";
import StitchTypeModal from "./StitchTypeModal.jsx";
import TypeGroupModal from "./TypeGroupModal.jsx";

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
      {modal.type === "create-category" && <CategoryModal onClose={closeModal} onSaved={refresh} />}
      {modal.type === "edit-category" && <CategoryModal initial={modal.data} onClose={closeModal} onSaved={refresh} />}
      {modal.type === "delete-category" && (
        <ConfirmDelete message={`Delete "${modal.data.name}"? All its sub-categories and items will also be deactivated.`} onConfirm={handleDeleteCat} onClose={closeModal} loading={deleting} />
      )}

      {modal.type === "create-line" && (
        <ServiceLineModal categoryId={modal.categoryId} categoryName={modal.catName} onClose={closeModal} onSaved={refresh} />
      )}
      {modal.type === "edit-line" && (
        <ServiceLineModal initial={modal.data} categoryId={modal.data.category_id} categoryName={modal.catName} onClose={closeModal} onSaved={refresh} />
      )}
      {modal.type === "delete-line" && (
        <ConfirmDelete message={`Delete sub-category "${modal.data.name}"? All its items will also be deactivated.`} onConfirm={handleDeleteLine} onClose={closeModal} loading={deleting} />
      )}

      {modal.type === "create-service" && (
        <StitchTypeModal
          categoryId={modal.categoryId} serviceLineId={modal.lineId} serviceLineName={modal.lineName}
          initial={modal.prefillName ? { name: modal.prefillName, base_price: 0, is_active: true, is_premium: false, display_order: 0, estimated_delivery_days: 7 } : undefined}
          onClose={closeModal} onSaved={refresh}
        />
      )}
      {modal.type === "edit-service" && (
        <StitchTypeModal initial={modal.data} categoryId={modal.data.category_id} serviceLineId={modal.data.service_line_id} serviceLineName={modal.lineName} onClose={closeModal} onSaved={refresh} />
      )}
      {modal.type === "delete-service" && (
        <ConfirmDelete message={`Delete item "${modal.data.name}"?`} onConfirm={handleDeleteService} onClose={closeModal} loading={deleting} />
      )}

      {modal.type === "add-type" && (
        <TypeGroupModal
          lineName={modal.lineName}
          categoryId={modal.categoryId}
          serviceLineId={modal.lineId}
          onClose={closeModal}
          onSaved={refresh}
        />
      )}
    </>
  );
}
