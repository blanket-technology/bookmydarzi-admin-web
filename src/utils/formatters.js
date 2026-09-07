// ─── Entity ID Formatters ──────────────────────────────────────────────────────

const PREFIX = {
  tailor: "T",
  employee: "E",
  admin: "A",
  superadmin: "A",
  customer: "C",
  user: "C",
};

/**
 * Returns a standardised display ID.
 * Priority: existing backend code > formatted numeric ID.
 * Format: {Prefix}-{LocationCode}{Sequence}
 */
export function formatEntityId(type, id, code, city) {
  if (code) return code;
  const prefix = PREFIX[type?.toLowerCase()] ?? "X";
  const loc = city ? city.trim().slice(0, 3).toUpperCase() : "";
  const seq = String(id ?? 0).padStart(loc ? 4 : 5, "0");
  return `${prefix}-${loc}${seq}`;
}

// Convenience wrappers
export const formatTailorId = (id, code, city) =>
  formatEntityId("tailor", id, code, city);
export const formatEmployeeId = (id, code, city) =>
  formatEntityId("employee", id, code, city);
export const formatAdminId = (id, code, city) =>
  formatEntityId("admin", id, code, city);
export const formatCustomerId = (id, code, city) =>
  formatEntityId("customer", id, code, city);

// ─── Date Formatters ───────────────────────────────────────────────────────────

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Currency ──────────────────────────────────────────────────────────────────

/** decimals: 0 (default) for whole-rupee summary displays (dashboards,
 * lists); pass 2 for exact financial amounts (payments, refunds) where
 * rounding to the nearest rupee would misrepresent the real figure. */
export function formatCurrency(amount, decimals = 0) {
  if (amount == null) return "-";
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// ─── Address ───────────────────────────────────────────────────────────────────

/** Compose a structured address object into a single readable string. */
export function composeAddress(addr = {}) {
  return [addr.location, addr.sector, addr.city, addr.pincode]
    .filter(Boolean)
    .join(", ");
}

// ─── API error messages ─────────────────────────────────────────────────────────

/**
 * FastAPI's `detail` field is a plain string for most errors, but for a 422
 * pydantic validation failure it's a LIST of objects, e.g.:
 *   [{ type: "value_error", loc: ["body", "password"], msg: "Value error, ..." }]
 * Rendering that array directly in JSX (or interpolating it into a template
 * string) produces mangled output instead of a readable message. This always
 * returns a single, human-readable string regardless of which shape the
 * backend sent.
 */
export function extractErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err?.response?.data?.detail ?? err?.response?.data?.message;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        // Strip pydantic's "Value error, " prefix - the frontend context
        // already makes clear this is a validation error.
        return String(item?.msg ?? "").replace(/^Value error,\s*/, "");
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }

  if (err?.message === "Network Error") return "Could not reach the server. Please check your connection.";

  return fallback;
}
