import { INIT_FILTERS } from "../constants/tailorConstants.js";

export const validators = {
  full_name: (v) => (v.trim().length < 3 ? "Name must be at least 3 characters" : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address"),
  phone: (v) => (/^[6-9]\d{9}$/.test(v) ? "" : "Enter a valid 10-digit phone number"),
  mobile: (v) => (/^[6-9]\d{9}$/.test(v) ? "" : "Enter valid 10-digit mobile"),
  specialization: (v) => (v.trim().length < 2 ? "Specialization is required" : ""),
  address: (v) => (!v || v.trim().length < 5 ? "City and Location are required" : ""),
  aadhar: (v) => (/^\d{12}$/.test(v.replace(/\s/g, "")) ? "" : "Aadhar must be 12 digits"),
  pan: (v) => (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase()) ? "" : "Valid PAN e.g. ABCDE1234F"),
  other: (v) => (v.trim().length < 3 ? "Document ID required" : ""),
  password: (v) => {
    if (!v) return "";
    if (v.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(v)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(v)) return "Password must contain at least one number";
    return "";
  },
};

export function formFromData(d) {
  return {
    full_name: d.full_name || "",
    email: d.email || "",
    mobile: d.mobile || "",
    address: d.address || "",
    specialization: d.specialization || "",
    role: d.role || "",
    status: d.is_active ? "Active" : "Inactive",
    verify: d.is_approved ? "Verified" : "Pending",
    aadhar: d.aadhar || "",
    pan: d.pan || "",
    other: d.other || "",
    is_online: !!d.is_online,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    experience: d.experience ?? "",
    rating: d.rating ?? null,
  };
}

export function filterTailors(tailors, { search, filters }) {
  const q = search.trim().toLowerCase();
  return tailors.filter((tailor) => {
    const searchMatch =
      !q ||
      tailor.full_name?.toLowerCase().includes(q) ||
      tailor.email?.toLowerCase().includes(q) ||
      tailor.mobile?.includes(q) ||
      String(tailor.tailor_id) === q;

    const statusMatch =
      filters.status.length === 0 ||
      filters.status.includes(tailor.is_active ? "Active" : "Inactive");

    const verifyMatch =
      filters.verify.length === 0 ||
      filters.verify.includes(tailor.is_approved ? "Verified" : "Pending");

    const availabilityMatch =
      filters.role.length === 0 ||
      filters.role.includes(tailor.is_available ? "Available" : "Busy");

    return searchMatch && statusMatch && verifyMatch && availabilityMatch;
  });
}

export function toggleFilter(filters, type, value) {
  return {
    ...filters,
    [type]: filters[type].includes(value)
      ? filters[type].filter((item) => item !== value)
      : [...filters[type], value],
  };
}

export function resetFilters() {
  return { ...INIT_FILTERS };
}

export function computeProductionCounts(orders) {
  const now = Date.now();
  let pendingStitching = 0;
  let readyForQc = 0;
  let readyForDispatch = 0;
  let delayed = 0;

  const PENDING = new Set([
    "tailor_assigned", "pickup_scheduled", "pickup_pending", "picked_up", "cloth_received_by_tailor",
  ]);
  const NON_TERMINAL = new Set([
    "tailor_assigned", "pickup_scheduled", "pickup_pending", "picked_up", "cloth_received_by_tailor",
    "stitching_started", "in_progress", "final_check", "ready_for_dispatch", "out_for_delivery",
  ]);

  orders.forEach((o) => {
    const status = (o.Status || "").toLowerCase();
    if (PENDING.has(status)) pendingStitching += 1;
    if (status === "final_check") readyForQc += 1;
    if (status === "ready_for_dispatch") readyForDispatch += 1;
    if (NON_TERMINAL.has(status) && o.ExpectedDeliveryDate && new Date(o.ExpectedDeliveryDate).getTime() < now) {
      delayed += 1;
    }
  });

  return { pendingStitching, readyForQc, readyForDispatch, delayed };
}

export function buildTailorSavePayload(form) {
  return {
    full_name: form.full_name.trim() || undefined,
    email: form.email.trim() || undefined,
    mobile: form.mobile.trim() || undefined,
    specialization: form.specialization.trim() || undefined,
    is_active: form.status === "Active",
    is_available: form.status === "Active",
  };
}

export function buildApplicationListParams({ page, limit, search, status }) {
  return {
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
  };
}
