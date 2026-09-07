const inp =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none " +
  "focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors placeholder:text-gray-400";

const errInp =
  "w-full border-2 border-red-400 rounded-xl px-3 py-2 text-sm outline-none " +
  "focus:border-red-500 bg-red-50/30 focus:bg-white transition-colors placeholder:text-gray-400";

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

/**
 * AddressForm - structured address input used in tailor/staff registration.
 *
 * Props:
 *   value    {{ city, location, sector, pincode, latitude, longitude }}
 *   onChange fn(newValue)
 *   errors   {{ city?, location?, sector?, pincode?, latitude?, longitude? }}
 */
export default function AddressForm({ value = {}, onChange, errors = {} }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="City" required error={errors.city}>
        <input
          className={errors.city ? errInp : inp}
          placeholder="e.g. Delhi"
          value={value.city || ""}
          onChange={(e) => set("city", e.target.value)}
        />
      </Field>

      <Field label="Location / Area" required error={errors.location}>
        <input
          className={errors.location ? errInp : inp}
          placeholder="e.g. Connaught Place"
          value={value.location || ""}
          onChange={(e) => set("location", e.target.value)}
        />
      </Field>

      <Field label="Sector / Colony" error={errors.sector}>
        <input
          className={errors.sector ? errInp : inp}
          placeholder="e.g. Sector 15, Model Town"
          value={value.sector || ""}
          onChange={(e) => set("sector", e.target.value)}
        />
      </Field>

      <Field label="Pincode" required error={errors.pincode}>
        <input
          className={errors.pincode ? errInp : inp}
          placeholder="6-digit pincode"
          maxLength={6}
          inputMode="numeric"
          value={value.pincode || ""}
          onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
        />
      </Field>

      <Field label="Latitude" error={errors.latitude}>
        <input
          className={errors.latitude ? errInp : inp}
          placeholder="e.g. 28.6139"
          type="number"
          step="any"
          value={value.latitude || ""}
          onChange={(e) => set("latitude", e.target.value)}
        />
      </Field>

      <Field label="Longitude" error={errors.longitude}>
        <input
          className={errors.longitude ? errInp : inp}
          placeholder="e.g. 77.2090"
          type="number"
          step="any"
          value={value.longitude || ""}
          onChange={(e) => set("longitude", e.target.value)}
        />
      </Field>
    </div>
  );
}
