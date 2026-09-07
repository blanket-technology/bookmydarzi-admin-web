import api from "../../../services/api.js";
import { REPORTING_ENDPOINT } from "../constants/reportingConstants.js";

export async function fetchReportingData() {
  const response = await api.get(REPORTING_ENDPOINT);
  return response.data;
}

/**
 * Download the dashboard analytics as a CSV file (Excel/pandas-compatible).
 * Backend streams it (respecting the same revenue-RBAC as the dashboard view);
 * we turn the blob into a browser download. Filename comes from the server's
 * Content-Disposition when present, with a sensible fallback.
 */
export async function downloadAnalyticsCsv() {
  const response = await api.get(`${REPORTING_ENDPOINT}/export`, {
    responseType: "blob",
  });

  const disposition = response.headers?.["content-disposition"] || "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] || `bmd_analytics_${new Date().toISOString().slice(0, 10)}.csv`;

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
