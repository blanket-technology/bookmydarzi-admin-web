import {
  IndianRupee, ShoppingCart, TrendingUp, Users,
  Clock, Truck, AlertTriangle, CheckCircle2,
  XCircle, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";

export function StatCard({ icon: Icon, label, value, sub, accent = "teal" }) {
  const styles = {
    teal: { wrap: "border-teal-100", icon: "bg-teal-50 text-teal-600" },
    blue: { wrap: "border-blue-100", icon: "bg-blue-50 text-blue-600" },
    amber: { wrap: "border-amber-100", icon: "bg-amber-50 text-amber-600" },
    emerald: { wrap: "border-emerald-100", icon: "bg-emerald-50 text-emerald-600" },
    rose: { wrap: "border-rose-100", icon: "bg-rose-50 text-rose-600" },
    purple: { wrap: "border-purple-100", icon: "bg-purple-50 text-purple-600" },
    indigo: { wrap: "border-indigo-100", icon: "bg-indigo-50 text-indigo-600" },
    orange: { wrap: "border-orange-100", icon: "bg-orange-50 text-orange-600" },
  };
  const s = styles[accent] || styles.teal;
  return (
    <div className={`bg-white rounded-xl border ${s.wrap} p-4 shadow-sm flex items-start gap-3`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${s.icon}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5 leading-tight">{value ?? "-"}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function MiniCard({ label, value, accent = "gray" }) {
  const styles = {
    gray: "bg-gray-50 border-gray-100 text-gray-600",
    teal: "bg-teal-50 border-teal-100 text-teal-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${styles[accent] || styles.gray}`}>
      <p className="text-lg font-bold">{value ?? 0}</p>
      <p className="text-xs font-semibold mt-0.5 capitalize">{label.replace(/_/g, " ")}</p>
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</h2>
  );
}

export function ReportingContent({
  loading,
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
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="animate-spin text-teal-600" size={32} />
        <p className="text-gray-400 text-sm">Loading live statistics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Revenue</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={IndianRupee} label="Total Revenue" value={fmtRs(revenue.total)} sub="All time" accent="teal" />
          <StatCard icon={TrendingUp} label="This Month" value={fmtRs(revenue.this_month)} sub="Last 30 days" accent="blue" />
          <StatCard icon={TrendingUp} label="This Week" value={fmtRs(revenue.this_week)} sub="Last 7 days" accent="purple" />
          <StatCard icon={IndianRupee} label="Today" value={fmtRs(revenue.today)} sub="Today's intake" accent="emerald" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <SectionTitle>Revenue Split</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MiniCard label="Online Payments" value={fmtRs(revenue.online)} accent="blue" />
          <MiniCard label="Cash on Delivery" value={fmtRs(revenue.cod)} accent="orange" />
        </div>
      </div>

      <div>
        <SectionTitle>Orders</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={ShoppingCart} label="Total Orders" value={fmt(orders.total)} sub={`Today: ${orders.today ?? 0}`} accent="teal" />
          <StatCard icon={Clock} label="Pending" value={fmt(orders.pending)} sub="Active in pipeline" accent="amber" />
          <StatCard icon={AlertTriangle} label="Unassigned" value={fmt(orders.pending_assignment)} sub="Need tailor" accent="orange" />
          <StatCard icon={Truck} label="Pickup Pending" value={fmt(orders.pending_pickup)} sub="Awaiting pickup" accent="indigo" />
          <StatCard icon={CheckCircle2} label="Delivered" value={fmt(orders.delivered)} sub="Completed" accent="emerald" />
          <StatCard icon={XCircle} label="Cancelled" value={fmt(orders.cancelled)} sub="Lost orders" accent="rose" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionTitle>Live Operations</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniCard label="Out for Delivery" value={orders.out_for_delivery ?? 0} accent="blue" />
            <MiniCard label="Pickup Pending" value={orders.pending_pickup ?? 0} accent="amber" />
            <MiniCard label="Unassigned" value={orders.pending_assignment ?? 0} accent="rose" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionTitle>Tailors</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniCard label="Active" value={tailors.active ?? 0} accent="teal" />
            <MiniCard label="Available" value={tailors.available ?? 0} accent="emerald" />
            <MiniCard label="Busy" value={tailors.busy ?? 0} accent="purple" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <SectionTitle>Users</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Total Users" value={fmt(users.total)} accent="blue" />
          <StatCard icon={Users} label="Active Users" value={fmt(users.active)} sub={`${activeUserPercent}% active`} accent="emerald" />
        </div>
      </div>

      {Object.keys(byStatus).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionTitle>Orders by Status</SectionTitle>
          <div className="space-y-2.5">
            {Object.entries(byStatus)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const pct = Math.round((count / totalForBar) * 100);
                const barColor = statusColors[status] || "bg-gray-300";
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-36 sm:w-48 text-xs font-semibold text-gray-600 capitalize shrink-0 truncate">
                      {status.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-gray-700 shrink-0">{count}</span>
                    <span className="w-9 text-right text-xs text-gray-400 shrink-0">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportingErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
      <AlertCircle size={16} /> {error}
    </div>
  );
}

export { RefreshCw };
