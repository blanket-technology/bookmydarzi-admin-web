import { Loader2, X } from "lucide-react";

// Shared field/input styling - the exact classes duplicated across
// OffersPage, CatalogPage, SettingsPage (Banner/Category sections), etc.
// Centralized here so every Add/Edit form gets identical spacing, borders,
// and focus states without hand-rolling it per page.
export const FORM_INPUT_CLASS =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors";

export function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * FormModal - shared Add/Edit modal chrome used across every module (Offers,
 * Banners, Categories, ...). Standardizes width, header, close button,
 * inline error/success banner, and the Cancel/Submit footer row so every
 * "Add {Thing}" screen in the admin panel has identical spacing and buttons.
 *
 * Props:
 *   title       {string}   modal heading, e.g. "Edit Offer"
 *   onClose     {function}
 *   onSubmit    {function}  form submit handler (receives the event)
 *   submitLabel {string}   defaults to "Save"
 *   submitting  {boolean}  disables buttons + shows spinner on submit
 *   message     {{ type: "success"|"error", text: string }} optional inline banner
 *   maxWidth    {string}   tailwind max-w-* class, defaults to "max-w-md"
 *   children    form fields
 */
export default function FormModal({
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel = "Save",
  submitting = false,
  message,
  maxWidth = "max-w-md",
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 shrink-0">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-3 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                : "bg-red-50 text-red-800 border border-red-100"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          {children}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              {submitting ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
