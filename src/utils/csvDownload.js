/**
 * Turn an axios blob response (backend CSV export, e.g. GET /admin/orders/export)
 * into a browser file download. Filename comes from the server's
 * Content-Disposition header when present, with a sensible fallback.
 * Shared by every row-level export button (Orders/Payments/Users) - same
 * pattern reportingService.js's downloadAnalyticsCsv already used for the
 * dashboard-analytics export, factored out so it isn't copy-pasted per feature.
 */
export function triggerCsvDownload(response, fallbackFilename) {
  const disposition = response.headers?.["content-disposition"] || "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] || fallbackFilename;

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
