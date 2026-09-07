
export const validators = {
  name: (v) => (v.trim().length < 3 ? "Name must be at least 3 characters" : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address"),
  mobile: (v) => (/^[6-9]\d{9}$/.test(v) ? "" : "Enter a valid 10-digit mobile number"),
  password: (v) => {
    if (!v) return "";
    if (v.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(v)) return "Password must contain at least one number";
    return "";
  },
};

export const accountValidators = {
  full_name: (v) => (v.trim().length < 3 ? "Name must be at least 3 characters" : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email"),
  mobile: (v) => (/^[6-9]\d{9}$/.test(v) ? "" : "Enter valid 10-digit mobile"),
};

export function filterBridgeStaff(staff, { search, filterActive }) {
  const q = search.trim().toLowerCase();
  return staff.filter((s) => {
    const matchSearch =
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.mobile || "").includes(q) ||
      String(s.id) === q;
    const matchActive =
      filterActive === "" || (filterActive === "true" ? s.is_active : !s.is_active);
    return matchSearch && matchActive;
  });
}

export function buildProfilePayload(profile) {
  return {
    experience_years: profile.experience_years === "" ? null : Number(profile.experience_years),
    bridge_type: profile.bridge_type || null,
    assigned_area: profile.assigned_area || null,
    vehicle_type: profile.vehicle_type || null,
    working_shift: profile.working_shift || null,
    joining_date: profile.joining_date ? new Date(profile.joining_date).toISOString() : null,
  };
}

export function buildEditFormFromStaff(staff) {
  const p = staff?.bridge_professional_details ?? {};
  const e = staff?.bridge_earnings ?? {};
  const w = staff?.bridge_workload ?? {};
  return {
    full_name: staff?.full_name || "",
    email: staff?.email || "",
    mobile: staff?.mobile || "",
    status: staff?.is_active ? "Active" : "Inactive",
    experience_years: p.experience_years ?? "",
    bridge_type: p.bridge_type ?? "",
    assigned_area: p.assigned_area ?? "",
    vehicle_type: p.vehicle_type ?? "",
    working_shift: p.working_shift ?? "",
    joining_date: p.joining_date ? p.joining_date.slice(0, 10) : "",
    max_orders_per_day: w.max_orders_per_day ?? "",
    total_earnings: e.total_earnings ?? "",
    incentives_earned: e.incentives_earned ?? "",
  };
}

export function buildMeasurementPayload(measureForm) {
  const payload = {};
  Object.entries(measureForm).forEach(([k, v]) => {
    if (v !== "" && v !== null) {
      payload[k] =
        typeof v === "string" &&
        !isNaN(v) &&
        k !== "profile_name" &&
        k !== "gender" &&
        k !== "fit_preference" &&
        k !== "notes"
          ? Number(v)
          : v;
    }
  });
  return payload;
}
