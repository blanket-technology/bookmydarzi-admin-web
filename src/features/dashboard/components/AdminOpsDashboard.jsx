import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Loader2, AlertCircle, Truck, PackageCheck, Headphones, Scissors,
} from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore.js";
import { useLiveDashboardRefresh } from "../hooks/useLiveDashboardRefresh.js";
import { DashboardHeader, MiniStat, RecentOrdersTable, StatCard } from "./DashboardComponents.jsx";

export default function AdminOpsDashboard() {
  const navigate = useNavigate();
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
      title: "Pending Orders",
      value: data?.orders?.pending ?? 0,
      subtext: `Total: ${data?.orders?.total ?? 0}`,
      icon: ShoppingCart,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      onClick: () => navigate("/ordersdetails"),
    },
    {
      title: "Tailor Assignment Queue",
      value: data?.orders?.pending_assignment ?? 0,
      subtext: "Orders awaiting a tailor",
      icon: Scissors,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50",
      onClick: () => navigate("/ordersdetails?status=order_placed"),
    },
    {
      title: "Pickups Pending",
      value: data?.orders?.pending_pickup ?? "-",
      subtext: "Cloth not yet collected",
      icon: PackageCheck,
      iconColor: "text-sky-600",
      bgColor: "bg-sky-50",
      onClick: () => navigate("/ordersdetails"),
    },
    {
      title: "Out for Delivery",
      value: data?.orders?.out_for_delivery ?? "-",
      subtext: "Currently with delivery",
      icon: Truck,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => navigate("/ordersdetails?status=out_for_delivery"),
    },
    {
      title: "Active Employees",
      value: data?.employees?.total ?? "-",
      subtext: "Operations staff",
      icon: Headphones,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      onClick: () => navigate("/bridgedetail"),
    },
    {
      title: "Active Tailors",
      value: data?.tailors?.active ?? 0,
      subtext: `Available: ${data?.tailors?.available ?? 0}`,
      icon: Scissors,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => navigate("/tailordetails"),
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-slate-50 font-sans antialiased text-slate-600">
      <DashboardHeader label="Admin" />
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Operations Overview</h1>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} isLoading={isLoading} />
          ))}
        </div>

        {!isLoading && data && (
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MiniStat
                label="Delivered" value={data.orders?.delivered ?? 0}
                colorClass="bg-emerald-50/50" borderClass="border-emerald-100/50" textClass="text-emerald-600"
                onClick={() => navigate("/ordersdetails?status=delivered")}
              />
              <MiniStat
                label="Cancelled" value={data.orders?.cancelled ?? 0}
                colorClass="bg-slate-50" borderClass="border-slate-100" textClass="text-slate-500"
                onClick={() => navigate("/ordersdetails?status=cancelled")}
              />
              <MiniStat
                label="Created Today" value={data.orders?.today ?? 0}
                colorClass="bg-amber-50/50" borderClass="border-amber-100/50" textClass="text-amber-600"
                onClick={() => navigate("/ordersdetails")}
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          <RecentOrdersTable orders={recentOrders} isLoading={ordersLoading} showAmount={false} />
        </div>
      </main>
    </div>
  );
}
