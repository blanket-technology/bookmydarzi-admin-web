import { Image as ImageIcon, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import FormModal from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import { SectionCard, Field, INPUT } from "../../../components/common/SectionCard.jsx";
import { BANNER_IMAGE_UPLOAD_PATH } from "../constants/cmsConstants.js";
import useBanners from "../hooks/useBanners.js";

function BannerFormModal({
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
      title={editingId ? "Edit Banner" : "Add Banner"}
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={editingId ? "Update" : "Create"}
      submitting={saving}
      message={saveMsg}
      maxWidth="max-w-lg"
    >
      <Field label="Title" required><input required value={form.title} onChange={(e) => onFormChange({ title: e.target.value })} className={INPUT} placeholder="Summer Collection" /></Field>
      <Field label="Subtitle"><input value={form.subtitle} onChange={(e) => onFormChange({ subtitle: e.target.value })} className={INPUT} placeholder="Short tagline" /></Field>
      <Field label="Image">
        <ImageUploadField
          value={form.image_url}
          onChange={(v) => onFormChange({ image_url: v })}
          uploadPath={BANNER_IMAGE_UPLOAD_PATH}
        />
      </Field>
      <Field label="Redirect URL"><input type="url" value={form.redirect_url} onChange={(e) => onFormChange({ redirect_url: e.target.value })} className={INPUT} placeholder="https://…" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display Order"><input type="number" value={form.display_order} onChange={(e) => onFormChange({ display_order: e.target.value })} className={INPUT} /></Field>
        <Field label="Valid Until"><input type="date" value={form.valid_until} onChange={(e) => onFormChange({ valid_until: e.target.value })} className={INPUT + " [color-scheme:light]"} /></Field>
      </div>
    </FormModal>
  );
}

export default function BannersSection() {
  const {
    banners,
    loading,
    error,
    showModal,
    editingId,
    form,
    saving,
    saveMsg,
    deletingId,
    setShowModal,
    updateForm,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = useBanners();

  return (
    <>
      {showModal && (
        <BannerFormModal
          editingId={editingId}
          form={form}
          saving={saving}
          saveMsg={saveMsg}
          onClose={() => setShowModal(false)}
          onSubmit={handleSave}
          onFormChange={updateForm}
        />
      )}

      <SectionCard title="Homepage Banners" subtitle="Manage banners shown on the customer home screen">
        <div className="flex justify-between items-center mb-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="ml-auto">
            <button onClick={openCreate} className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-semibold text-sm">
              <Plus size={15} /> Add Banner
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Preview</th>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Subtitle</th>
                <th className="px-4 py-3 text-left font-semibold">Order</th>
                <th className="px-4 py-3 text-left font-semibold">Valid Until</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-teal-600" size={22} /></td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No banners yet. Click "Add Banner" to create one.</td></tr>
              ) : banners.map((b) => {
                const id = b.Id ?? b.id;
                const imgUrl = b.ImageUrl ?? b.image_url;
                const title = b.Title ?? b.title;
                const subtitle = b.Subtitle ?? b.subtitle;
                const order = b.DisplayOrder ?? b.display_order ?? 0;
                const validUntil = b.ValidUntil ?? b.valid_until;
                return (
                  <tr key={id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {imgUrl
                        ? <img src={imgUrl} alt="" className="w-14 h-9 object-cover rounded-lg border border-gray-100" />
                        : <div className="w-14 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon size={13} className="text-gray-400" /></div>
                      }
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 max-w-[140px] truncate">{title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{subtitle || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{order}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {validUntil ? new Date(validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(b)} disabled={deletingId === id} className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 disabled:opacity-50"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(id)} disabled={deletingId === id} className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-50">
                          {deletingId === id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
