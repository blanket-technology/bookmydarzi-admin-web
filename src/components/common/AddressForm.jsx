import { useState } from "react";

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
// India Post's official pincode lookup - free, no API key, no rate-limit
// documented for reasonable use. Used only to auto-fill City/Location once
// a full 6-digit pincode is entered - the admin can still freely edit
// whatever it fills in, this just removes the manual lookup step for the
// common case.
async function lookupPincode(pincode) {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!res.ok) return null;
  const data = await res.json();
  const record = data?.[0];
  if (record?.Status !== "Success" || !record.PostOffice?.length) return null;
  const po = record.PostOffice[0];
  return { city: po.District, location: po.Name };
}

export default function AddressForm({ value = {}, onChange, errors = {} }) {
  const [pincodeLookup, setPincodeLookup] = useState({ status: "idle", pincode: null });
  const set = (k, v) => onChange({ ...value, [k]: v });

  const handlePincodeChange = (raw) => {
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 6);
    set("pincode", digitsOnly);
    setPincodeLookup({ status: "idle", pincode: null });

    if (digitsOnly.length !== 6) return;

    setPincodeLookup({ status: "loading", pincode: digitsOnly });
    lookupPincode(digitsOnly)
      .then((result) => {
        setPincodeLookup({ status: result ? "success" : "not_found", pincode: digitsOnly });
        if (result) {
          // Never overwrite a City/Location the admin has already typed -
          // this only fills genuinely empty fields, so a manual correction
          // (e.g. a more specific locality than the pincode's default post
          // office name) is never silently clobbered by a later re-lookup.
          onChange({
            ...value,
            pincode: digitsOnly,
            city: value.city || result.city,
            location: value.location || result.location,
          });
        }
      })
      .catch(() => setPincodeLookup({ status: "not_found", pincode: digitsOnly }));
  };

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
          onChange={(e) => handlePincodeChange(e.target.value)}
        />
        {pincodeLookup.pincode === value.pincode && (
          <p className={`text-xs mt-1 ${pincodeLookup.status === "not_found" ? "text-amber-600" : "text-gray-400"}`}>
            {pincodeLookup.status === "loading" && "Looking up area…"}
            {pincodeLookup.status === "success" && "City/Location auto-filled from pincode"}
            {pincodeLookup.status === "not_found" && "Pincode not found - enter City/Location manually"}
          </p>
        )}
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
