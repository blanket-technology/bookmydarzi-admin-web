import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ShoppingCart, CreditCard, DollarSign, Loader2, AlertCircle,
  Headphones, Scissors, Download,
} from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore.js";
import { useLiveDashboardRefresh } from "../hooks/useLiveDashboardRefresh.js";
import { downloadAnalyticsCsv } from "../../reporting/services/reportingService.js";
import { getStoredUser } from "../../auth/store/authStore.js";
import { ROLES } from "../../../constants/permissions.js";
import { DashboardHeader, MiniStat, RecentOrdersTable, StatCard } from "./DashboardComponents.jsx";

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const isSuperadmin = String(getStoredUser()?.Role || "").toLowerCase() === ROLES.SUPERADMIN;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadAnalyticsCsv();
    } catch {
      setDownloadError("Couldn't generate the financial export. Please try again.");
    } finally {
      setDownloading(false);
    }
  };
  const data = useDashboardStore((s) => s.data);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const error = useDashboardStore((s) => s.error);
  const recentOrders = useDashboardStore((s) => s.recentOrders);
  const ordersLoading = useDashboardStore((s) => s.ordersLoading);
  const fetchAdminDashboard = useDashboardStore((s) => s.fetchAdminDashboard);
  const fetchRecentOrders = useDashboardStore((s) => s.fetchRecentOrders);

  useEffect(() => {
    fetchAdminDashboard();
    fetchRecentOrders();
  }, [fetchAdminDashboard, fetchRecentOrders]);

  useLiveDashboardRefresh(fetchAdminDashboard, fetchRecentOrders);

  const stats = [
    {
      title: "Total Orders",
      value: data?.orders?.total ?? 0,
      subtext: `Pending: ${data?.orders?.pending ?? 0}`,
      icon: ShoppingCart,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      onClick: () => navigate("/ordersdetails"),
    },
    {
      title: "Revenue",
      value: data?.revenue?.total ? `₹${data.revenue.total.toLocaleString()}` : "₹0",
      subtext: `This Month: ₹${data?.revenue?.this_month ?? 0}`,
      icon: DollarSign,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      onClick: () => navigate("/reporting"),
    },
    {
      title: "Active Users",
      value: data?.users?.active ?? 0,
      subtext: `Total: ${data?.users?.total ?? 0}`,
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate("/users"),
    },
    {
      title: "Employees",
      value: data?.employees?.total ?? "-",
      subtext: "Active staff accounts",
      icon: Headphones,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      onClick: () => navigate("/bridgedetail"),
    },
    {
      title: "Tailors",
      value: data?.tailors?.active ?? 0,
      subtext: `Available: ${data?.tailors?.available ?? 0}`,
      icon: Scissors,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50",
      onClick: () => navigate("/tailordetails"),
    },
    {
      title: "Successful Payments",
      value: data?.payments?.successful ?? 0,
      subtext: "Real-time gateway sync",
      icon: CreditCard,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate("/payments"),
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-slate-50 font-sans antialiased text-slate-600">
      <DashboardHeader label="Superadmin" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center gap-3 mb-6">
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Business Overview</h1>
          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-slate-400 font-medium">
                <Loader2 size={16} className="animate-spin text-teal-500" />
                <span>Syncing live data...</span>
              </div>
            )}
            {isSuperadmin && (
              <button
                onClick={handleDownload}
                disabled={downloading || isLoading}
                title="Download financial analytics as CSV (Excel / data-science ready)"
                className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60 shrink-0"
              >
                {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {downloading ? "Preparing…" : "Download Report"}
              </button>
            )}
          </div>
        </div>

        {downloadError && (
          <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" /> {downloadError}
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-sm">
            <AlertCircle size={20} className="shrink-0" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} isLoading={isLoading} />
          ))}
        </div>

        {!isLoading && data && (
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Order Dispatch &amp; Workflow Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat
                label="Pending" value={data.orders?.pending ?? 0}
                colorClass="bg-amber-50/50" borderClass="border-amber-100/50" textClass="text-amber-600"
                onClick={() => navigate("/ordersdetails")}
              />
              <MiniStat
                label="Unassigned" value={data.orders?.pending_assignment ?? 0}
                colorClass="bg-orange-50/50" borderClass="border-orange-100/50" textClass="text-orange-600"
                onClick={() => navigate("/ordersdetails?status=order_placed")}
              />
              <MiniStat
                label="Delivered" value={data.orders?.delivered ?? 0}
                colorClass="bg-emerald-50/50" borderClass="border-emerald-100/50" textClass="text-emerald-600"
                onClick={() => navigate("/ordersdetails?status=delivered")}
              />
              <MiniStat
                label="Cancelled" value={data.orders?.cancelled ?? 0}
                colorClass="bg-rose-50/50" borderClass="border-rose-100/50" textClass="text-rose-600"
                onClick={() => navigate("/ordersdetails?status=cancelled")}
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          <RecentOrdersTable orders={recentOrders} isLoading={ordersLoading} showAmount />
        </div>
      </main>
    </div>
  );
}
