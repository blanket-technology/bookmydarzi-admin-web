// Format-only GSTIN check - mirrors app/core/gstin.py's regex exactly.
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]$/;

export function normalizeGstin(value) {
  return String(value || "").trim().toUpperCase();
}

export function isValidGstin(value) {
  return GSTIN_RE.test(normalizeGstin(value));
}
