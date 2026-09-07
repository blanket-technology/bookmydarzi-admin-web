// Shared card wrapper + form field helpers, lifted out of SettingsPage.jsx
// so the CMS sections (Categories, Banners) can be reused on their own
// page (see pages/CMS/CMSPage.jsx) without duplicating this boilerplate.

export function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-gray-100">
          {title && <h2 className="text-base font-bold text-gray-800">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export const INPUT = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400";
