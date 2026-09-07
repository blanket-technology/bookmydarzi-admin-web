import { useNavigate } from "react-router-dom";
import { User, Bell, ChevronDown } from "lucide-react";
import { getStoredUser } from "../../auth/store/authStore.js";
import { RECENT_ORDER_STATUS_COLOR } from "../constants/dashboardConstants.js";
import { formatRecentOrderDate } from "../utils/dashboardUtils.js";

export function StatCard({ title, value, subtext, icon: Icon, iconColor, bgColor, isLoading, onClick }) {
  const clickable = typeof onClick === "function" && !isLoading;
  const Wrapper = clickable ? "button" : "div";
  return (
    <Wrapper
      onClick={clickable ? onClick : undefined}
      className={`bg-white p-5 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 flex flex-col justify-between text-left w-full ${
        clickable ? "hover:shadow-md hover:border-teal-200 cursor-pointer" : "hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
          )}
        </div>
        <div className={`p-2.5 ${bgColor} ${iconColor} rounded-xl`}>
          <Icon size={22} />
        </div>
      </div>
      {isLoading ? (
        <div className="h-4 w-32 bg-slate-50 animate-pulse rounded" />
      ) : (
        subtext && (
          <div className="text-xs font-medium text-slate-400 border-t border-slate-50 pt-3">{subtext}</div>
        )
      )}
    </Wrapper>
  );
}

export function MiniStat({ label, value, colorClass, borderClass, textClass, onClick }) {
  const clickable = typeof onClick === "function";
  const Wrapper = clickable ? "button" : "div";
  return (
    <Wrapper
      onClick={clickable ? onClick : undefined}
      className={`p-4 ${colorClass} rounded-xl border ${borderClass} text-center sm:text-left w-full transition-colors ${
        clickable ? "hover:brightness-95 cursor-pointer" : ""
      }`}
    >
      <span className={`block text-xs font-semibold ${textClass} uppercase tracking-wider mb-1`}>{label}</span>
      <span className="text-xl font-bold text-slate-800">{value}</span>
    </Wrapper>
  );
}

export function RecentOrdersTable({ orders, isLoading, showAmount = true }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Orders</h2>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">No orders yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Status</th>
                {showAmount && <th className="px-6 py-3 text-right">Amount</th>}
                <th className="px-6 py-3 text-right">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.Id}
                  onClick={() => navigate(`/orders/${o.Id}`, { state: { order: o } })}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition cursor-pointer"
                >
                  <td className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">{o.OrderCode || `#${o.Id}`}</td>
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{o.ServiceName || o.ServiceTitle || "-"}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        RECENT_ORDER_STATUS_COLOR[o.Status] || "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {o.StatusLabel || o.Status}
                    </span>
                  </td>
                  {showAmount && (
                    <td className="px-6 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                      {o.AmountDisplay || "-"}
                    </td>
                  )}
                  <td className="px-6 py-3 text-right text-slate-400 whitespace-nowrap">
                    {formatRecentOrderDate(o.CreatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function DashboardHeader({ label }) {
  const user = getStoredUser();
  return (
    <header className="hidden md:flex items-center justify-between h-14 px-6 bg-white border-b sticky top-0 z-10">
      <div className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
          <User size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-800">{user?.FullName || label}</p>
        <ChevronDown size={13} className="text-slate-400" />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-slate-50 rounded-full transition">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
