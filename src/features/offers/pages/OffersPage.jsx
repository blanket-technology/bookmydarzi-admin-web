import { Plus, Loader2, AlertCircle, Tag, RefreshCw, Filter } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import OfferCard from "../components/OfferCard.jsx";
import OfferFormModal from "../components/OfferFormModal.jsx";
import useOffers from "../hooks/useOffers.js";

export default function OffersPage() {
  const {
    offers,
    visibleOffers,
    loading,
    error,
    expiryFilter,
    showModal,
    editingId,
    form,
    saving,
    saveMsg,
    setExpiryFilter,
    setShowModal,
    updateForm,
    fetchOffers,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    handleToggle,
  } = useOffers();

  return (
    <>
      {showModal && (
        <OfferFormModal
          editingId={editingId}
          form={form}
          saving={saving}
          saveMsg={saveMsg}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          onFormChange={updateForm}
        />
      )}

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Offers & Coupons"
          subtitle={`${visibleOffers.length} of ${offers.length} offer${offers.length !== 1 ? "s" : ""}`}
          actions={
            <>
              <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1.5 rounded-lg">
                <Filter size={12} className="text-white/70" />
                <select
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold outline-none"
                >
                  <option value="" className="text-gray-800">All</option>
                  <option value="active" className="text-gray-800">Active only</option>
                  <option value="expired" className="text-gray-800">Expired / Disabled</option>
                </select>
              </div>
              <button
                onClick={fetchOffers}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                <RefreshCw size={13} /> Refresh
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-50"
              >
                <Plus size={13} /> Add Offer
              </button>
            </>
          }
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-teal-600" size={28} />
            <p className="text-gray-400 text-xs">Loading offers…</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Tag size={24} className="text-teal-400" />
            </div>
            <p className="text-gray-600 font-semibold text-sm">No offers yet</p>
            <p className="text-gray-400 text-xs">Create your first offer to display on the customer app</p>
            <button
              onClick={openCreate}
              className="mt-1 flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus size={13} /> Add First Offer
            </button>
          </div>
        ) : visibleOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-gray-400 text-sm">No offers match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleOffers.map((offer) => (
              <OfferCard
                key={offer.Id}
                offer={offer}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
            <button
              onClick={openCreate}
              className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/40 transition-colors min-h-[200px]"
            >
              <Plus size={20} />
              <span className="text-xs font-semibold">Add Offer</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
