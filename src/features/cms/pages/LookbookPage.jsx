import { Image as ImageIcon, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import FormModal from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import { SectionCard, Field, INPUT } from "../../../components/common/SectionCard.jsx";
import { LOOKBOOK_CATEGORIES, LOOKBOOK_IMAGE_UPLOAD_PATH } from "../constants/cmsConstants.js";
import useLookbook from "../hooks/useLookbook.js";

function LookbookFormModal({
  editingId,
  form,
  saving,
  saveMsg,
  onClose,
  onSubmit,
  onFormChange,
}) {
  return (
    <FormModal
      title={editingId ? "Edit Lookbook Item" : "Add Lookbook Item"}
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={editingId ? "Update" : "Create"}
      submitting={saving}
      message={saveMsg}
      maxWidth="max-w-lg"
    >
      <Field label="Image" required>
        <ImageUploadField
          value={form.image_url}
          onChange={(v) => onFormChange({ image_url: v })}
          uploadPath={LOOKBOOK_IMAGE_UPLOAD_PATH}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title"><input value={form.title} onChange={(e) => onFormChange({ title: e.target.value })} className={INPUT} placeholder="e.g. Summer kurta" /></Field>
        <Field label="Category">
          <select value={form.category_tag} onChange={(e) => onFormChange({ category_tag: e.target.value })} className={INPUT}>
            {LOOKBOOK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Caption"><input value={form.caption} onChange={(e) => onFormChange({ caption: e.target.value })} className={INPUT} placeholder="Short caption shown to users" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Order"><input type="number" min="0" value={form.display_order} onChange={(e) => onFormChange({ display_order: e.target.value })} className={INPUT} /></Field>
        <Field label="Service ID" hint="Optional - link to a service"><input type="number" value={form.service_id} onChange={(e) => onFormChange({ service_id: e.target.value })} className={INPUT} placeholder="Optional" /></Field>
      </div>
      {editingId && (
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input type="checkbox" checked={form.is_active} onChange={(e) => onFormChange({ is_active: e.target.checked })} className="accent-teal-600 w-4 h-4" />
          <span className="text-sm font-semibold text-gray-700">Active (visible to users)</span>
        </label>
      )}
    </FormModal>
  );
}

export default function LookbookPage() {
  const {
    items,
    loading,
    error,
    filterCat,
    showModal,
    editingId,
    form,
    saving,
    saveMsg,
    deletingId,
    setFilterCat,
    setShowModal,
    updateForm,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = useLookbook();

  return (
    <>
      {showModal && (
        <LookbookFormModal
          editingId={editingId}
          form={form}
          saving={saving}
          saveMsg={saveMsg}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          onFormChange={updateForm}
        />
      )}

      <SectionCard title="Lookbook" subtitle="Inspiration images shown to customers">
        <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-gray-700 text-xs outline-none bg-gray-50 border border-gray-200 font-semibold"
          >
            <option value="all">All Categories</option>
            {LOOKBOOK_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <button onClick={openCreate} className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-semibold text-sm ml-auto">
            <Plus size={15} /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Preview</th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Order</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-teal-600" size={22} /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No lookbook items yet. Click "Add Item" to create one.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {item.image_url
                      ? <img src={item.image_url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-100" />
                      : <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon size={13} className="text-gray-400" /></div>
                    }
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 max-w-[160px] truncate">{item.title || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{item.category_tag || "general"}</td>
                  <td className="px-4 py-3 text-gray-500">{item.display_order}</td>
                  <td className="px-4 py-3">
                    {item.is_active === false
                      ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                      : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100"><Pencil size={13} /></button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                      >
                        {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
