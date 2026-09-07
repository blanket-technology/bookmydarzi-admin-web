import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// Shared inline-edit form controls, extracted from Tailor/TailorFullDetails.jsx
// so any entity detail page's in-page edit form (Tailor, Bridge/employee)
// renders with the exact same validation/visual language.

export function InputField({ icon: Icon, name, label, placeholder, value, type = "text",
  onChange, onBlur, error, touched, disabled = false, required = true }) {
  const ok  = touched && !error && value?.trim() !== "";
  const err = touched && !!error;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
        {label}
        {!disabled && required && <span className="text-red-400 font-bold">*</span>}
      </label>
      <div className="relative">
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
          ${disabled ? "text-gray-300" : err ? "text-red-400" : ok ? "text-teal-500" : "text-gray-400"}`}>
          <Icon size={17} />
        </span>
        <input
          type={type} name={name} placeholder={placeholder} value={value ?? ""}
          onChange={onChange} onBlur={onBlur} disabled={disabled} autoComplete="off"
          className={`w-full h-11 pl-11 pr-10 text-sm rounded-xl border-2 outline-none transition-all
            placeholder:text-gray-300
            ${type === "date" ? "[color-scheme:light]" : ""}
            ${disabled
              ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
              : err
              ? "bg-red-50/20 border-red-300 focus:border-red-400"
              : ok
              ? "bg-white border-teal-400 focus:border-teal-500"
              : "bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-400"}`}
        />
        {!disabled && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {err && <XCircle size={16} className="text-red-400" />}
            {ok  && <CheckCircle2 size={16} className="text-teal-500" />}
          </span>
        )}
      </div>
      {err && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({ icon: Icon, name, label, value, onChange, options, disabled = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="relative">
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none
          ${disabled ? "text-gray-300" : "text-gray-400"}`}>
          <Icon size={17} />
        </span>
        <select
          name={name} value={value} onChange={onChange} disabled={disabled}
          className={`w-full h-11 pl-11 pr-4 text-sm rounded-xl border-2 outline-none transition-all appearance-none
            ${disabled
              ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-50 border-gray-200 focus:bg-white focus:border-teal-400"}`}>
          {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
      </div>
    </div>
  );
}
