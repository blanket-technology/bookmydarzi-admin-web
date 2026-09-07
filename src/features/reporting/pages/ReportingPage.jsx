import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader.jsx";
import useReporting from "../hooks/useReporting.js";
import { downloadAnalyticsCsv } from "../services/reportingService.js";
import {
  ReportingContent,
  ReportingErrorBanner,
  RefreshCw,
} from "../components/ReportingComponents.jsx";

export default function ReportingPage() {
  const {
    loading,
    error,
    lastFetched,
    fetchData,
    orders,
    revenue,
    users,
    tailors,
    byStatus,
    totalForBar,
    statusColors,
    fmt,
    fmtRs,
    activeUserPercent,
  } = useReporting();

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadAnalyticsCsv();
    } catch {
      setDownloadError("Couldn't generate the export. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader
        title="Reporting & Analytics"
        subtitle={lastFetched ? `Last updated: ${lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Live backend statistics"}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              title="Download analytics as CSV (Excel / data-science ready)"
              className="flex items-center gap-1.5 bg-white text-teal-800 hover:bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {downloading ? "Preparing…" : "Download CSV"}
            </button>
            <button onClick={fetchData} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        }
      />

      {downloadError && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-xs">{downloadError}</div>
      )}

      <ReportingErrorBanner error={error} />

      <ReportingContent
        loading={loading}
        orders={orders}
        revenue={revenue}
        users={users}
        tailors={tailors}
        byStatus={byStatus}
        totalForBar={totalForBar}
        statusColors={statusColors}
        fmt={fmt}
        fmtRs={fmtRs}
        activeUserPercent={activeUserPercent}
      />
    </div>
  );
}
