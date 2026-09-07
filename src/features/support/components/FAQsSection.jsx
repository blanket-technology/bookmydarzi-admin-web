import { Plus, Loader2, AlertCircle, HelpCircle, RefreshCw } from "lucide-react";
import FAQModal, { FAQDeleteConfirm } from "./FAQModal.jsx";
import FAQRow from "./FAQRow.jsx";
import useFaqs from "../hooks/useFaqs.js";
import { FAQ_CATEGORIES } from "../constants/supportConstants.js";

export function FAQsSectionBody() {
  const {
    faqs,
    loading,
    error,
    catFilter,
    editingFaq,
    deletingFaq,
    setCatFilter,
    setEditingFaq,
    setDeletingFaq,
    fetchFaqs,
    handleSaveFaq,
    handleDeleteFaq,
  } = useFaqs();

  return (
    <>
      {editingFaq === false && (
        <FAQModal onClose={() => setEditingFaq(null)} onSave={handleSaveFaq} />
      )}
      {editingFaq && editingFaq !== false && (
        <FAQModal initial={editingFaq} onClose={() => setEditingFaq(null)} onSave={handleSaveFaq} />
      )}
      {deletingFaq && (
        <FAQDeleteConfirm faq={deletingFaq} onClose={() => setDeletingFaq(null)} onDelete={handleDeleteFaq} />
      )}

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-xs text-gray-500">{faqs.length} FAQ{faqs.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2 ml-auto">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-2.5 py-1.5 rounded-lg text-gray-700 text-xs outline-none bg-gray-50 border border-gray-200 font-semibold">
            <option value="">All Categories</option>
            {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={fetchFaqs} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setEditingFaq(false)} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Plus size={13} /> New FAQ
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-teal-600" size={32} />
          <p className="text-gray-500 text-sm">Loading FAQs…</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <HelpCircle size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold">No FAQs yet.</p>
          <button onClick={() => setEditingFaq(false)} className="mt-3 inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-800">
            <Plus size={14} /> Create First FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq) => (
            <FAQRow key={faq.id} faq={faq} onEdit={setEditingFaq} onDelete={setDeletingFaq} />
          ))}
        </div>
      )}
    </>
  );
}
