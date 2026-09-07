import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, Truck, PackageCheck } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import StatCard from "../../bridge/components/StatCard.jsx";
import api from "../../../services/api";
import { extractErrorMessage, formatCurrency, formatDateTime } from "../../../utils/formatters";

// Shared shell for the two fleet-wide admin views mobile had and web
// didn't: "Deliveries" (out_for_delivery, keyed on DeliveryEmployeeId) and
// "Pickups" (order_accepted/pickup_scheduled/pickup_pending, keyed on
// AssignedEmployeeId). Backed by the same GET /admin/orders endpoint every
// other order list uses (multi-status + delivery_employee_id support added
// alongside this page) rather than a new endpoint - this is a fleet-wide
// oversight view, distinct from the mobile app's per-employee "jobs offered
// to me" broadcast screens (bmdadmin's Deliveries/Pickups), which have no
// admin equivalent because that's an individual employee's own job queue,
// not something an admin browses.
export default function FleetOrdersPage({ title, statuses, employeeField, icon: Icon, emptyLabel }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/orders", {
        params: {
          status: statuses.join(","),
          page,
          limit,
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load orders."));
    } finally {
      setLoading(false);
    }
  }, [statuses, page, limit, search]);

  // Fetch-on-dep-change; setState happens inside fetchOrders' async
  // handlers, not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const unassignedCount = orders.filter((o) => !o[employeeField]).length;

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader
        title={title}
        subtitle={`${total} order${total !== 1 ? "s" : ""} in progress`}
        actions={
          <>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Order code, customer name or mobile…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-60 bg-white"
              />
            </div>
            <button onClick={fetchOrders} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <RefreshCw size={13} /> Refresh
            </button>
          </>
        }
      />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <StatCard icon={Icon} label="In Progress" value={total} tone="teal" />
        <StatCard icon={Icon} label="Unassigned" value={unassignedCount} tone={unassignedCount > 0 ? "rose" : "gray"} />
      </div>

      <DataTable
        columns={[
          { key: "code", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "employee", label: "Assigned To" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "created", label: "Created" },
        ]}
        rows={orders}
        rowKey={(o) => o.Id}
        loading={loading}
        emptyMessage={search ? "No matching orders." : emptyLabel}
        pagination={{ page, total, limit, onPageChange: setPage, onLimitChange: (l) => { setLimit(l); setPage(1); } }}
        renderRow={(o) => (
          <tr
            key={o.Id}
            onClick={() => navigate(`/orders/${o.Id}`, { state: { order: o } })}
            className="hover:bg-teal-50/40 transition-colors text-gray-700 cursor-pointer"
          >
            <td className="px-4 py-2.5 font-mono font-semibold text-teal-700 whitespace-nowrap">{o.OrderCode || `#${o.Id}`}</td>
            <td className="px-4 py-2.5">
              <div className="font-semibold text-gray-800">{o.address?.full_name || `Customer #${o.CustomerId}`}</div>
              {o.address?.mobile && <div className="text-gray-400 text-xs">{o.address.mobile}</div>}
            </td>
            <td className="px-4 py-2.5"><StatusBadge status={o.Status} dot /></td>
            <td className="px-4 py-2.5">
              {o[employeeField] ? (
                `#${o[employeeField]}`
              ) : (
                <span className="text-rose-600 font-semibold">Unassigned</span>
              )}
            </td>
            <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(o.FinalAmount)}</td>
            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{formatDateTime(o.CreatedAt)}</td>
          </tr>
        )}
      />
    </div>
  );
}

export function DeliveriesPage() {
  return (
    <FleetOrdersPage
      title="Deliveries"
      statuses={["out_for_delivery"]}
      employeeField="DeliveryEmployeeId"
      icon={Truck}
      emptyLabel="No deliveries in progress right now."
    />
  );
}

export function PickupsPage() {
  return (
    <FleetOrdersPage
      title="Pickups"
      statuses={["order_accepted", "pickup_scheduled", "pickup_pending"]}
      employeeField="AssignedEmployeeId"
      icon={PackageCheck}
      emptyLabel="No pickups in progress right now."
    />
  );
}
