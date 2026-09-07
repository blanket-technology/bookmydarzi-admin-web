import {
  MapPin, Plus, Pencil, Loader2, RefreshCw, CheckCircle2, XCircle, Trash2,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import AreaModal from "../components/AreaModal.jsx";
import useServiceAreas from "../hooks/useServiceAreas.js";

export default function ServiceAreasPage() {
  const {
    areas,
    loading,
    error,
    modalArea,
    showModal,
    showInactive,
    deletingId,
    visibleAreas,
    inactiveCount,
    activeCount,
    setShowModal,
    setShowInactive,
    openCreate,
    openEdit,
    handleSaved,
    handleToggleActive,
    handleDelete,
    fetchAreas,
  } = useServiceAreas();

  return (
    <>
      {showModal && (
        <AreaModal area={modalArea} onClose={() => setShowModal(false)} onSave={handleSaved} />
      )}

      <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
        <PageHeader
          title="Service Areas"
          subtitle={`${activeCount} active area${activeCount !== 1 ? "s" : ""} - customers outside these can't place orders`}
          actions={
            <>
              {inactiveCount > 0 && (
                <label className="flex items-center gap-1.5 text-white text-xs font-semibold cursor-pointer select-none">
                  <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded accent-white" />
                  Show inactive ({inactiveCount})
                </label>
              )}
              <button onClick={fetchAreas} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                <RefreshCw size={13} /> Refresh
              </button>
              <button onClick={openCreate} className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-50">
                <Plus size={13} /> Add Area
              </button>
            </>
          }
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-brand text-white">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Coordinates</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Radius</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-teal-600" size={28} /></td></tr>
                ) : visibleAreas.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-500 font-medium">
                    {areas.length === 0
                      ? "No service areas configured yet - customers can't place any orders until at least one is added."
                      : "No active service areas. Enable “Show inactive” to see deactivated ones."}
                  </td></tr>
                ) : (
                  visibleAreas.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors text-gray-700">
                      <td className="px-4 py-2.5 font-semibold flex items-center gap-1.5">
                        <MapPin size={12} className="text-teal-500 shrink-0" /> {a.name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono">{a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{a.radius_km} km</td>
                      <td className="px-4 py-2.5 text-center">
                        {a.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            <CheckCircle2 size={11} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            <XCircle size={11} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(a)} className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100" title="Edit"><Pencil size={12} /></button>
                          <button
                            onClick={() => handleToggleActive(a)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border ${a.is_active ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                          >
                            {a.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            disabled={deletingId === a.id}
                            className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                            title="Delete permanently"
                          >
                            {deletingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
