import { Percent, IndianRupee, Calendar } from "lucide-react";
import FormModal, { Field, FORM_INPUT_CLASS as inp } from "../../../components/common/FormModal.jsx";
import ImageUploadField from "../../../components/common/ImageUploadField.jsx";
import { OFFER_IMAGE_UPLOAD_PATH } from "../constants/offerConstants.js";

export default function OfferFormModal({
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
      title={editingId ? "Edit Offer" : "New Offer"}
      onClose={onClose}
      onSubmit={onSubmit}
      submitLabel={editingId ? "Update" : "Create"}
      submitting={saving}
      message={saveMsg}
    >
      <Field label="Title" required>
        <input
          required
          value={form.title}
          onChange={(e) => onFormChange({ title: e.target.value })}
          className={inp}
          placeholder="e.g. Summer Sale"
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          className={inp + " resize-none"}
          placeholder="Short description shown to customers"
        />
      </Field>

      <Field label="Coupon Code" hint="Customers enter this code to apply the offer. Leave blank for automatic offers.">
        <input
          value={form.coupon_code}
          onChange={(e) => onFormChange({ coupon_code: e.target.value.toUpperCase().replace(/\s/g, "") })}
          className={inp + " uppercase tracking-widest font-mono"}
          placeholder="e.g. SAVE20"
          maxLength={30}
        />
      </Field>

      <Field label="Discount Type">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onFormChange({ discount_type: "percentage" })}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold border-2 transition-all ${
              form.discount_type === "percentage"
                ? "bg-teal-700 border-teal-700 text-white"
                : "bg-white border-gray-200 text-gray-500 hover:border-teal-300"
            }`}
          >
            <Percent size={13} /> Percentage
          </button>
          <button
            type="button"
            onClick={() => onFormChange({ discount_type: "flat" })}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold border-2 transition-all ${
              form.discount_type === "flat"
                ? "bg-teal-700 border-teal-700 text-white"
                : "bg-white border-gray-200 text-gray-500 hover:border-teal-300"
            }`}
          >
            <IndianRupee size={13} /> Flat Amount
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        {form.discount_type === "flat" ? (
          <Field label="Discount Amount (₹)">
            <input
              type="number"
              min="1"
              step="1"
              value={form.discount_amount}
              onChange={(e) => onFormChange({ discount_amount: e.target.value })}
              className={inp}
              placeholder="100"
            />
          </Field>
        ) : (
          <Field label="Discount (%)">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={form.discount_percent}
              onChange={(e) => onFormChange({ discount_percent: e.target.value })}
              className={inp}
              placeholder="20"
            />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Valid From" hint="Leave blank to start immediately">
          <div className="relative">
            <input
              type="date"
              value={form.valid_from}
              onChange={(e) => onFormChange({ valid_from: e.target.value })}
              className={inp + " pr-9 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0"}
            />
            <Calendar
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </Field>
        <Field label="Valid Until">
          <div className="relative">
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) => onFormChange({ valid_until: e.target.value })}
              className={inp + " pr-9 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0"}
            />
            <Calendar
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </Field>
      </div>

      <Field label="Image">
        <ImageUploadField
          value={form.image_url}
          onChange={(v) => onFormChange({ image_url: v })}
          uploadPath={OFFER_IMAGE_UPLOAD_PATH}
        />
      </Field>
    </FormModal>
  );
}
