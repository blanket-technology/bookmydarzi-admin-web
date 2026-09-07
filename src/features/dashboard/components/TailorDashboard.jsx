import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Loader2, AlertCircle, PackageCheck, Scissors, Tag,
} from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore.js";
import { useLiveDashboardRefresh } from "../hooks/useLiveDashboardRefresh.js";
import { computeTailorStats } from "../utils/dashboardUtils.js";
import { DashboardHeader, StatCard } from "./DashboardComponents.jsx";

export default function TailorDashboard() {
  const navigate = useNavigate();
  const roleOrders = useDashboardStore((s) => s.roleOrders);
  const isLoading = useDashboardStore((s) => s.roleOrdersLoading);
  const error = useDashboardStore((s) => s.roleOrdersError);
  const fetchRoleOrders = useDashboardStore((s) => s.fetchRoleOrders);

  useEffect(() => {
    fetchRoleOrders("tailor");
  }, [fetchRoleOrders]);

  useLiveDashboardRefresh(() => fetchRoleOrders("tailor"));

  const stats = useMemo(() => computeTailorStats(roleOrders), [roleOrders]);

  const cards = [
    { title: "Assigned Orders", value: stats.assigned, icon: ShoppingCart, iconColor: "text-amber-600", bgColor: "bg-amber-50", onClick: () => navigate("/ordersdetails?status=cloth_received_by_tailor") },
    { title: "Stitching Queue", value: stats.stitchingQueue, icon: Scissors, iconColor: "text-purple-600", bgColor: "bg-purple-50", onClick: () => navigate("/ordersdetails") },
    { title: "Ready for Dispatch", value: stats.readyForDispatch, icon: PackageCheck, iconColor: "text-sky-600", bgColor: "bg-sky-50", onClick: () => navigate("/ordersdetails?status=ready_for_dispatch") },
    { title: "Completed Today", value: stats.completedToday, icon: Tag, iconColor: "text-emerald-600", bgColor: "bg-emerald-50", onClick: () => navigate("/ordersdetails?status=completed") },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-slate-50 font-sans antialiased text-slate-600">
      <DashboardHeader label="Tailor" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-base font-bold text-slate-800 tracking-tight">My Workbench</h1>
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-slate-400 font-medium">
              <Loader2 size={16} className="animate-spin text-teal-500" />
              <span>Syncing live data...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 shadow-sm">
            <AlertCircle size={20} className="shrink-0" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c) => (
            <StatCard key={c.title} {...c} isLoading={isLoading} />
          ))}
        </div>

        {!isLoading && (
          <p className="text-xs text-slate-400 mt-6">
            Based on your {roleOrders.length} most recent orders.{" "}
            <button onClick={() => navigate("/ordersdetails")} className="text-teal-600 hover:text-teal-800 font-semibold underline">
              Open Order Management for the full list.
            </button>
          </p>
        )}
      </main>
    </div>
  );
}
