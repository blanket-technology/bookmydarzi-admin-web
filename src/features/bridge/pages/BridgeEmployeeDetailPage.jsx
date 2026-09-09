import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2, AlertCircle, Calendar,
  Package, History, RefreshCw, Pencil, ShieldCheck, ChevronRight,
  Briefcase, Truck, TrendingUp, Wallet, ListChecks, Save, X, Star,
  UserCircle2, XCircle, LayoutGrid, FileText, CreditCard,
  User, Mail, Phone, CheckCircle2, RotateCcw, Camera, Trash2,
} from "lucide-react";
import api from "../../../services/api";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { DonutChart, HBarChart, GaugeChart } from "../../../components/common/MiniCharts";
import SectionHeader from "../../../components/common/SectionHeader";
import {
  WorkspaceHero, HeroActionButton, KpiTile, SkeletonBlock, EmptyState,
  SummaryCard, StatGrid, Timeline, ConfirmModal,
} from "../../../components/common/EntityWorkspace";
import { KycCard, DocModal } from "../../../components/common/KycUpload";
import { InputField, SelectField } from "../../../components/common/FormFields";
import { formatEmployeeId, formatDate, formatDateTime, formatCurrency, extractErrorMessage } from "../../../utils/formatters";

const BRIDGE_TYPE_LABEL = { full_time: "Full Time", freelancer: "Freelancer" };

const inp = "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors";

// ─── Account validators (name/email/mobile) - same rules as Tailor's edit form ──
const accountValidators = {
  full_name: (v) => v.trim().length < 3 ? "Name must be at least 3 characters" : "",
  email:     (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email",
  mobile:    (v) => /^[6-9]\d{9}$/.test(v) ? "" : "Enter valid 10-digit mobile",
};

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "order_placed", label: "Order Placed" },
  { value: "order_accepted", label: "Order Accepted" },
  { value: "order_rejected", label: "Order Rejected" },
  { value: "searching_tailor", label: "Searching Tailor" },
  { value: "tailor_assigned", label: "Tailor Assigned" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "stitching_started", label: "Stitching Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_dispatch", label: "Ready for Dispatch" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: History },
];

const EVENT_ICON = { order: Package };

function Fact({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

// Operations Workspace for a Bridge (field employee) staff account - reached
// from BridgeDetails.jsx's table "View" action. Shares the same hero/KPI/
// tab/timeline pattern as Users/UserDetailPage.jsx (see EntityWorkspace.jsx)
// so Customer, Bridge and Tailor detail pages all read as one design system.
export default function BridgeEmployeeDetailPage() {
  const navigate = useNavigate();
  const { id: staffId } = useParams();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [orders, setOrders] = useState([]);       // full list (Orders tab, lazy)
  const [overviewOrder, setOverviewOrder] = useState(null); // most-recent, for Overview card
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [ordersStatus, setOrdersStatus] = useState("");

  const [toggleMsg, setToggleMsg] = useState(null);

  // ── Single unified edit mode - one "Edit" button in the hero opens one
  // form covering everything editable on this page (account fields +
  // professional/bridge-profile fields together), instead of separate
  // scattered edit controls per section. Saving fires both PATCH calls
  // (account, then bridge-profile) together. ──
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [photo, setPhoto] = useState(null);

  // ── KYC documents - same shape/handlers as Tailor/TailorFullDetails.jsx,
  // just posting to /admin/staff/{id}/kyc instead of /admin/tailors/{id}/kyc. ──
  const [kycEditMode, setKycEditMode] = useState(false);
  const [kycFiles, setKycFiles] = useState({ aadhar: null, pan_card: null, other: null });
  const [kycUploading, setKycUploading] = useState({ aadhar: false, pan_card: false, other: false });
  const [kycUrls, setKycUrls] = useState({ aadhar: null, pan_card: null, other: null });
  const [kycSaving, setKycSaving] = useState(false);
  const [kycSaveMsg, setKycSaveMsg] = useState(null);
  const [deleteKycKey, setDeleteKycKey] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null); // { file?: File, url?: string }
  const [isApproved, setIsApproved] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);

  const fetchStaff = useCallback(async () => {
    if (!staffId) return;
    setLoading(true); setError("");
    try {
      const res = await api.get(`/admin/staff/${staffId}`);
      setStaff(res.data);
      const d = res.data?.bridge_documents ?? {};
      setKycUrls({
        aadhar: d.aadhar_url || null,
        pan_card: d.pan_card_url || null,
        other: d.other_doc_url || null,
      });
      setIsApproved(!!d.is_approved);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load employee."));
    } finally { setLoading(false); }
  }, [staffId]);

  const onPickKycFile = (key, file) => setKycFiles((p) => ({ ...p, [key]: file }));
  const onClearPendingKyc = (key) => setKycFiles((p) => ({ ...p, [key]: null }));
  const onViewKyc = (key) => {
    const f = kycFiles[key];
    const u = kycUrls[key];
    if (f || u) setViewingDoc({ file: f || null, url: f ? null : u });
  };

  const kycCount = Object.values(kycUrls).filter(Boolean).length + Object.values(kycFiles).filter(Boolean).length;

  const onDeleteKyc = (key) => {
    if (!kycUrls[key]) return;
    setDeleteKycKey(key);
  };
  const confirmDeleteKyc = async () => {
    const key = deleteKycKey;
    setDeleteKycKey(null);
    if (!key) return;
    setKycUploading((p) => ({ ...p, [key]: true }));
    try {
      await api.delete(`/admin/staff/${staffId}/kyc`, { params: { document_type: key } });
      setKycUrls((p) => ({ ...p, [key]: null }));
    } catch (err) {
      setKycSaveMsg(extractErrorMessage(err, "Failed to delete document."));
    } finally {
      setKycUploading((p) => ({ ...p, [key]: false }));
    }
  };

  const saveKyc = async () => {
    setKycSaving(true);
    setKycSaveMsg(null);
    const docMap = { aadhar: "aadhar", pan_card: "pan_card", other: "other" };
    try {
      for (const [key, docType] of Object.entries(docMap)) {
        const file = kycFiles[key];
        if (!file) continue;
        setKycUploading((p) => ({ ...p, [key]: true }));
        try {
          const fd = new FormData();
          fd.append("document_type", docType);
          fd.append("file", file);
          const res = await api.post(`/admin/staff/${staffId}/kyc`, fd);
          setKycUrls((p) => ({ ...p, [key]: res.data.url }));
          setKycFiles((p) => ({ ...p, [key]: null }));
        } finally {
          setKycUploading((p) => ({ ...p, [key]: false }));
        }
      }
      setKycSaveMsg("success");
      setKycEditMode(false);
      setTimeout(() => setKycSaveMsg(null), 4000);
    } catch (err) {
      setKycSaveMsg(extractErrorMessage(err, "Failed to upload document."));
    } finally {
      setKycSaving(false);
    }
  };

  // Setting is_approved=true is rejected server-side unless all 3 KYC docs
  // are uploaded (see update_bridge_verification) - the button is also
  // disabled client-side below so this is a backstop, not the primary gate.
  const toggleVerification = async () => {
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await api.patch(`/admin/staff/${staffId}/verification`, { is_approved: !isApproved });
      setIsApproved(!!res.data?.bridge_documents?.is_approved);
    } catch (err) {
      setVerifyMsg(extractErrorMessage(err, "Failed to update verification status."));
    } finally {
      setVerifying(false);
    }
  };

  // Single entry point for editing this employee - opens one form covering
  // account fields (name/email/mobile/status) and professional/bridge-profile
  // fields (experience, area, vehicle, shift, joining date, capacity,
  // earnings) together, instead of separate scattered edit controls.
  const startEdit = () => {
    const p = staff?.bridge_professional_details ?? {};
    const e = staff?.bridge_earnings ?? {};
    const w = staff?.bridge_workload ?? {};
    setEditForm({
      full_name: staff?.full_name || "",
      email: staff?.email || "",
      mobile: staff?.mobile || "",
      status: staff?.is_active ? "Active" : "Inactive",
      experience_years: p.experience_years ?? "",
      bridge_type: p.bridge_type ?? "",
      assigned_area: p.assigned_area ?? "",
      vehicle_type: p.vehicle_type ?? "",
      working_shift: p.working_shift ?? "",
      joining_date: p.joining_date ? p.joining_date.slice(0, 10) : "",
      max_orders_per_day: w.max_orders_per_day ?? "",
      total_earnings: e.total_earnings ?? "",
      incentives_earned: e.incentives_earned ?? "",
    });
    setEditErrors({});
    setEditTouched({});
    setSaveMsg(null);
    setEditMode(true);
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    if (editTouched[name]) setEditErrors((p) => ({ ...p, [name]: accountValidators[name]?.(value) || "" }));
  };

  const onEditBlur = (e) => {
    const { name, value } = e.target;
    setEditTouched((p) => ({ ...p, [name]: true }));
    setEditErrors((p) => ({ ...p, [name]: accountValidators[name]?.(value) || "" }));
  };

  const validateEdit = () => {
    const e = {}, t = {};
    ["full_name", "email", "mobile"].forEach((k) => {
      t[k] = true; e[k] = accountValidators[k]?.(editForm[k]) || "";
    });
    setEditTouched((p) => ({ ...p, ...t }));
    setEditErrors((p) => ({ ...p, ...e }));
    return Object.values(e).every((v) => v === "");
  };

  const saveEdit = async () => {
    if (!validateEdit()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const parts = editForm.full_name.trim().split(" ");
      const accountPayload = {
        first_name: parts[0] || editForm.full_name.trim(),
        last_name: parts.slice(1).join(" ") || undefined,
        email: editForm.email.trim(),
        mobile: editForm.mobile.trim(),
        is_active: editForm.status === "Active",
      };
      const profilePayload = {
        experience_years: editForm.experience_years === "" ? null : Number(editForm.experience_years),
        bridge_type: editForm.bridge_type || null,
        assigned_area: editForm.assigned_area || null,
        vehicle_type: editForm.vehicle_type || null,
        working_shift: editForm.working_shift || null,
        joining_date: editForm.joining_date ? new Date(editForm.joining_date).toISOString() : null,
        max_orders_per_day: editForm.max_orders_per_day === "" ? null : Number(editForm.max_orders_per_day),
        total_earnings: editForm.total_earnings === "" ? null : Number(editForm.total_earnings),
        incentives_earned: editForm.incentives_earned === "" ? null : Number(editForm.incentives_earned),
      };
      await api.patch(`/admin/staff/${staffId}`, accountPayload);
      const res = await api.patch(`/admin/staff/${staffId}/bridge-profile`, profilePayload);
      let updated = res.data;
      // Admin-on-behalf-of-user upload - POST /admin/users/{id}/photo
      // (distinct from the self-service-only POST /users/profile/photo).
      // staffId here IS the USERS.Id (route param), unlike Tailor's page
      // where the URL param is tailor_id and a separate user_id lookup is
      // needed.
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        const photoRes = await api.post(`/admin/users/${staffId}/photo`, fd);
        updated = { ...updated, profile_image_url: photoRes.data?.profile_image_url ?? updated.profile_image_url };
        setPhoto(null);
      }
      setStaff(updated);
      setSaveMsg("success");
      setEditMode(false);
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg(extractErrorMessage(err, "Failed to save."));
    } finally {
      setSaving(false);
    }
  };

  // Overview's "Assigned Orders" card needs only the total count + the single
  // most-recent order (with amount/status-label, which the staff endpoint's
  // lighter assigned_orders summary doesn't carry). So it fetches ONE rich row
  // (limit:1); the server still returns the true `total` (a COUNT, independent
  // of limit). This is the only orders fetch on mount.
  const fetchOrdersOverview = useCallback(async () => {
    if (!staffId) return;
    try {
      const res = await api.get("/admin/orders", {
        params: { employee_id: staffId, page: 1, limit: 1 },
      });
      setOverviewOrder((res.data?.orders ?? [])[0] ?? null);
      setOrdersTotal(res.data?.total ?? 0);
    } catch {
      setOverviewOrder(null);
    }
  }, [staffId]);

  // The full paginated/filterable order list is only shown on the Orders tab -
  // fetched lazily the first time that tab is opened (see the effect below).
  const fetchOrders = useCallback(async () => {
    if (!staffId) return;
    setOrdersLoading(true);
    try {
      const res = await api.get("/admin/orders", {
        params: {
          employee_id: staffId,
          page: ordersPage,
          limit: ordersLimit,
          status: ordersStatus || undefined,
        },
      });
      setOrders(res.data?.orders ?? []);
    } catch {
      setOrders([]);
    } finally { setOrdersLoading(false); }
  }, [staffId, ordersPage, ordersLimit, ordersStatus]);

  // Resets to page 1 whenever the status filter changes, so a filter switch
  // never leaves the user stranded on a now out-of-range page.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOrdersPage(1); }, [ordersStatus]);

  // Fetch-on-mount/staffId-change; setState happens inside fetchStaff's and
  // fetchOrdersOverview's async handlers, not synchronously in the effect body.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!staffId) {
      navigate("/bridgedetail");
      return;
    }
    fetchStaff();
    fetchOrdersOverview();
  }, [staffId, fetchStaff, fetchOrdersOverview, navigate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Lazy-load the full orders list only while the Orders/Activity tab is open
  // (and re-fetch when its pagination/filter changes). Not fetched on mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeTab === "orders" || activeTab === "activity") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const goToTab = (tabId) => setActiveTab(tabId);

  const handleToggle = async () => {
    if (!staff) return;
    setToggling(true);
    try {
      await api.patch(`/admin/users/${staff.id}/status`, {
        action: staff.is_active ? "deactivate" : "activate",
      });
      setStaff((s) => ({ ...s, is_active: !s.is_active }));
    } catch (err) {
      setToggleMsg({ type: "error", text: extractErrorMessage(err, "Status update failed.") });
    } finally { setToggling(false); }
  };


  // ── KPI row - all values come directly from the bridge_* nested objects
  // already returned by GET /admin/staff/{id}; nothing invented here. ──
  const kpis = staff ? [
    { label: "Today's Pickups", value: staff.bridge_delivery_performance?.todays_pickups ?? "-" },
    { label: "Today's Deliveries", value: staff.bridge_delivery_performance?.todays_deliveries ?? "-" },
    { label: "Active Orders", value: staff.bridge_workload?.current_active_orders ?? "-", accent: "text-blue-600" },
    { label: "Pending Pickups", value: staff.bridge_delivery_performance?.pending_pickups ?? "-", accent: "text-amber-600" },
    { label: "Pending Deliveries", value: staff.bridge_delivery_performance?.pending_deliveries ?? "-", accent: "text-amber-600" },
  ] : [];

  // ── Activity timeline - derived client-side from the orders list already
  // being fetched (same "no new endpoint" pattern as UserDetailPage.jsx).
  const timelineEvents = useMemo(() => {
    return orders
      .filter((o) => o.CreatedAt)
      .map((o) => ({
        id: `order-${o.Id}`, type: "order", at: o.CreatedAt, atLabel: formatDateTime(o.CreatedAt),
        title: `Order ${o.OrderCode || `#${o.Id}`}`, subtitle: o.StatusLabel || o.Status,
        onClick: () => navigate(`/orders/${o.Id}`, { state: { order: o } }),
      }))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [orders, navigate]);

  // Guard AFTER all hooks have run (Rules of Hooks): every hook above must be
  // called unconditionally on every render, so this early return lives here,
  // not before the hooks.
  if (!staffId) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      {viewingDoc && (
        <DocModal file={viewingDoc?.file} serverUrl={viewingDoc?.url} onClose={() => setViewingDoc(null)} />
      )}

      <ConfirmModal
        open={!!deleteKycKey}
        icon={Trash2}
        title="Delete Document?"
        description="This permanently removes the uploaded file."
        confirmLabel="Yes, Delete"
        onConfirm={confirmDeleteKyc}
        onCancel={() => setDeleteKycKey(null)}
      />
      {loading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <SkeletonBlock className="h-24 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-16" />)}
          </div>
          <SkeletonBlock className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        </div>
      ) : (
        <>
          {/* ── Sticky hero ─────────────────────────────────────────────── */}
          <WorkspaceHero
            onBack={() => navigate("/bridgedetail")}
            avatar={
              <div className="w-20 h-20 rounded-2xl border-2 border-white/30 overflow-hidden bg-teal-600 shrink-0 flex items-center justify-center">
                {photo ? (
                  <img src={URL.createObjectURL(photo)} alt="profile" className="w-full h-full object-cover" />
                ) : staff.profile_image_url ? (
                  <img src={staff.profile_image_url} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 size={40} className="text-teal-200" />
                )}
              </div>
            }
            title={staff.full_name || "N/A"}
            badges={
              <>
                <StatusBadge status="employee" label="Employee" />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${staff.is_active ? "bg-teal-400/20 text-teal-100" : "bg-orange-400/20 text-orange-100"}`}>
                  {staff.is_active ? "Active" : "Inactive"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isApproved ? "bg-blue-400/20 text-blue-100" : "bg-amber-400/20 text-amber-100"}`}>
                  {isApproved ? "Verified" : "Pending Verification"}
                </span>
              </>
            }
            metaLine={<>#{formatEmployeeId(staff.id, staff.user_code)} &nbsp;·&nbsp; {staff.email || "N/A"} &nbsp;·&nbsp; {staff.mobile || "N/A"}</>}
            factsRow={
              <>
                <span className="flex items-center gap-1.5"><Calendar size={11} /> Joined {staff.created_at ? formatDate(staff.created_at) : "-"}</span>
                <span className="flex items-center gap-1.5">
                  <Briefcase size={11} />
                  {BRIDGE_TYPE_LABEL[staff.bridge_professional_details?.bridge_type] ?? "Type not set"}
                </span>
                <span className="flex items-center gap-1.5"><Truck size={11} /> {staff.bridge_professional_details?.assigned_area || "Area not set"}</span>
              </>
            }
            actions={
              <>
                <HeroActionButton onClick={startEdit} icon={Pencil} label="Edit" />
                <HeroActionButton
                  onClick={handleToggle} disabled={toggling} loading={toggling}
                  icon={ShieldCheck} label={staff.is_active ? "Deactivate" : "Activate"}
                  tone={staff.is_active ? "warn" : "positive"}
                />
              </>
            }
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={goToTab}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

            {toggleMsg && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 bg-red-50 text-red-800 border-red-200 text-sm font-semibold">
                <XCircle size={18} className="text-red-500 shrink-0" />
                <span className="flex-1">{toggleMsg.text}</span>
                <button onClick={() => setToggleMsg(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
            )}

            {/* ── KPI row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {kpis.map((k) => <KpiTile key={k.label} {...k} />)}
            </div>

            {/* ── Tab content ──────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SummaryCard icon={Package} title="Assigned Orders" count={ordersTotal} onViewAll={() => goToTab("orders")} empty="No orders assigned yet.">
                  {overviewOrder && (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{overviewOrder.OrderCode || `#${overviewOrder.Id}`}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={overviewOrder.Status} label={overviewOrder.StatusLabel} />
                        <span className="text-xs text-gray-400 [font-variant-numeric:tabular-nums]">{formatCurrency(overviewOrder.FinalAmount)}</span>
                      </div>
                    </div>
                  )}
                </SummaryCard>

                <SummaryCard icon={TrendingUp} title="Performance" count={null} onViewAll={() => goToTab("performance")} empty="">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">On-Time Delivery</span>
                      <span className="font-bold text-gray-700">{staff.bridge_performance_metrics?.on_time_delivery_rate != null ? `${staff.bridge_performance_metrics.on_time_delivery_rate}%` : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Customer Rating</span>
                      <span className="font-bold text-gray-700 flex items-center gap-1">
                        {staff.bridge_performance_metrics?.customer_rating != null ? (
                          <><Star size={11} className="text-amber-400 fill-amber-400" />{staff.bridge_performance_metrics.customer_rating}</>
                        ) : "-"}
                      </span>
                    </div>
                  </div>
                </SummaryCard>

                <SummaryCard icon={Wallet} title="Earnings" count={null} onViewAll={() => goToTab("performance")} empty="">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Total Earnings</span>
                      <span className="font-bold text-gray-700">{formatCurrency(staff.bridge_earnings?.total_earnings ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Incentives</span>
                      <span className="font-bold text-gray-700">{formatCurrency(staff.bridge_earnings?.incentives_earned ?? 0)}</span>
                    </div>
                  </div>
                </SummaryCard>

                <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                  <SectionHeader
                    icon={Briefcase}
                    title="Professional Details"
                    subtitle="Bridge type, area, vehicle, shift, and earnings"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Fact label="Experience" value={staff.bridge_professional_details?.experience_years != null ? `${staff.bridge_professional_details.experience_years} Years` : "-"} />
                    <Fact label="Bridge Type" value={BRIDGE_TYPE_LABEL[staff.bridge_professional_details?.bridge_type] ?? "-"} />
                    <Fact label="Assigned Area" value={staff.bridge_professional_details?.assigned_area || "-"} />
                    <Fact label="Vehicle Type" value={staff.bridge_professional_details?.vehicle_type || "-"} />
                    <Fact label="Working Shift" value={staff.bridge_professional_details?.working_shift || "-"} />
                    <Fact label="Joining Date" value={staff.bridge_professional_details?.joining_date ? formatDate(staff.bridge_professional_details.joining_date) : "-"} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 pb-4">
                  <SectionHeader
                    icon={Package}
                    title="Assigned Orders"
                    subtitle={ordersTotal > 0 ? `${ordersTotal} order${ordersTotal !== 1 ? "s" : ""}` : "No orders assigned yet"}
                    badge={
                      <div className="flex items-center gap-2">
                        <select
                          value={ordersStatus}
                          onChange={(e) => setOrdersStatus(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg text-gray-700 text-xs outline-none bg-gray-50 border-2 border-gray-200 font-semibold focus:border-teal-400"
                        >
                          {ORDER_STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <button onClick={fetchOrders} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    }
                  />
                </div>
                {ordersLoading ? (
                  <div className="px-6 pb-6 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState icon={Package} text={ordersStatus ? "No orders with this status." : "No orders assigned to this employee yet."} />
                ) : (
                  <div className="divide-y divide-gray-50 px-6 pb-2">
                    {orders.map((o) => (
                      <button
                        key={o.Id}
                        onClick={() => navigate(`/orders/${o.Id}`, { state: { order: o } })}
                        className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{o.OrderCode || `#${o.Id}`}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(o.CreatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-gray-600 [font-variant-numeric:tabular-nums]">{formatCurrency(o.FinalAmount)}</span>
                          <StatusBadge status={o.Status} label={o.StatusLabel} />
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!ordersLoading && ordersTotal > 0 && (
                  <Pagination
                    page={ordersPage}
                    total={ordersTotal}
                    limit={ordersLimit}
                    onPageChange={setOrdersPage}
                    onLimitChange={(l) => { setOrdersLimit(l); setOrdersPage(1); }}
                  />
                )}
              </div>
            )}

            {activeTab === "performance" && (
              <div className="space-y-4">
                {/* Visual performance overview - charts from the same delivery
                    numbers shown as tiles below. */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <SectionHeader icon={Truck} title="Delivery Mix" subtitle="Completed vs pending" />
                    <div className="mt-4">
                      <DonutChart
                        centerLabel="Total"
                        data={[
                          { label: "Deliveries Done", value: staff.bridge_delivery_performance?.total_deliveries ?? 0, color: "emerald" },
                          { label: "Pending Deliveries", value: staff.bridge_delivery_performance?.pending_deliveries ?? 0, color: "amber" },
                          { label: "Failed", value: staff.bridge_delivery_performance?.failed_deliveries ?? 0, color: "rose" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <SectionHeader icon={Package} title="Today's Workload" subtitle="Pickups & deliveries" />
                    <div className="mt-4">
                      <HBarChart
                        data={[
                          { label: "Today's Pickups", value: staff.bridge_delivery_performance?.todays_pickups ?? 0, color: "blue" },
                          { label: "Today's Deliveries", value: staff.bridge_delivery_performance?.todays_deliveries ?? 0, color: "teal" },
                          { label: "Pending Pickups", value: staff.bridge_delivery_performance?.pending_pickups ?? 0, color: "amber" },
                          { label: "Pending Deliveries", value: staff.bridge_delivery_performance?.pending_deliveries ?? 0, color: "violet" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <SectionHeader icon={TrendingUp} title="On-Time Delivery" subtitle="Delivery success rate" />
                    <div className="flex-1 flex items-center justify-center mt-4">
                      <GaugeChart
                        value={staff.bridge_performance_metrics?.on_time_delivery_rate ?? 0}
                        label="On-Time Rate"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <SectionHeader icon={Truck} title="Delivery Performance" subtitle="Live counts from this employee's order history" />
                  <StatGrid items={[
                    { label: "Total Pickups", value: staff.bridge_delivery_performance?.total_pickups },
                    { label: "Total Deliveries", value: staff.bridge_delivery_performance?.total_deliveries },
                    { label: "Today's Pickups", value: staff.bridge_delivery_performance?.todays_pickups },
                    { label: "Today's Deliveries", value: staff.bridge_delivery_performance?.todays_deliveries },
                    { label: "Pending Pickups", value: staff.bridge_delivery_performance?.pending_pickups },
                    { label: "Pending Deliveries", value: staff.bridge_delivery_performance?.pending_deliveries },
                    { label: "Cancelled Orders", value: staff.bridge_delivery_performance?.cancelled_orders },
                    { label: "Failed Deliveries", value: staff.bridge_delivery_performance?.failed_deliveries },
                  ]} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <SectionHeader icon={TrendingUp} title="Performance Metrics" subtitle="On-time rates, average delivery time, rating" />
                  <StatGrid items={[
                    { label: "On-Time Pickup Rate", value: staff.bridge_performance_metrics?.on_time_pickup_rate != null ? `${staff.bridge_performance_metrics.on_time_pickup_rate}%` : "-" },
                    { label: "On-Time Delivery Rate", value: staff.bridge_performance_metrics?.on_time_delivery_rate != null ? `${staff.bridge_performance_metrics.on_time_delivery_rate}%` : "-" },
                    { label: "Avg Delivery Time", value: staff.bridge_performance_metrics?.average_delivery_minutes != null ? `${staff.bridge_performance_metrics.average_delivery_minutes} mins` : "-" },
                    {
                      label: "Customer Rating",
                      value: staff.bridge_performance_metrics?.customer_rating != null ? (
                        <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" />{staff.bridge_performance_metrics.customer_rating}</span>
                      ) : "-",
                    },
                    { label: "Completed Orders", value: staff.bridge_performance_metrics?.completed_orders },
                  ]} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <SectionHeader icon={Wallet} title="Earnings" subtitle="Manually entered by admin - no automated payout calculation yet" />
                  <StatGrid items={[
                    { label: "Total Earnings", value: formatCurrency(staff.bridge_earnings?.total_earnings ?? 0) },
                    { label: "Incentives Earned", value: formatCurrency(staff.bridge_earnings?.incentives_earned ?? 0) },
                  ]} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <SectionHeader icon={ListChecks} title="Workload" subtitle="Assignment counts and current capacity" />
                  <StatGrid items={[
                    { label: "Orders Assigned", value: staff.bridge_workload?.orders_assigned },
                    { label: "Orders Accepted", value: staff.bridge_workload?.orders_accepted },
                    { label: "Orders Rejected", value: staff.bridge_workload?.orders_rejected },
                    { label: "Current Active Orders", value: staff.bridge_workload?.current_active_orders },
                    { label: "Max Orders/Day", value: staff.bridge_workload?.max_orders_per_day ?? "-" },
                  ]} />
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <SectionHeader
                  icon={FileText}
                  title="KYC Verification"
                  subtitle="Upload identity documents for this employee"
                  badge={
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border-2
                        ${kycCount === 3 ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                        {kycCount}/3 uploaded
                      </span>
                      {!kycEditMode ? (
                        <button
                          onClick={() => setKycEditMode(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border-2 border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      ) : null}
                    </div>
                  }
                />

                {kycSaveMsg && (
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border-2 text-sm font-semibold
                    ${kycSaveMsg === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                    {kycSaveMsg === "success" ? "Document(s) uploaded successfully!" : kycSaveMsg}
                  </div>
                )}

                {verifyMsg && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3 border-2 bg-red-50 text-red-800 border-red-200 text-sm font-semibold">
                    <AlertCircle size={16} className="shrink-0" /> {verifyMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <KycCard
                    label="Aadhar Card" icon={CreditCard} docKey="aadhar"
                    pendingFile={kycFiles.aadhar} existingUrl={kycUrls.aadhar} uploading={kycUploading.aadhar}
                    editMode={kycEditMode} onPickFile={onPickKycFile} onView={onViewKyc} onClearPending={onClearPendingKyc} onDelete={onDeleteKyc}
                  />
                  <KycCard
                    label="PAN Card" icon={FileText} docKey="pan_card"
                    pendingFile={kycFiles.pan_card} existingUrl={kycUrls.pan_card} uploading={kycUploading.pan_card}
                    editMode={kycEditMode} onPickFile={onPickKycFile} onView={onViewKyc} onClearPending={onClearPendingKyc} onDelete={onDeleteKyc}
                  />
                  <KycCard
                    label="Other Document" icon={FileText} docKey="other"
                    pendingFile={kycFiles.other} existingUrl={kycUrls.other} uploading={kycUploading.other}
                    editMode={kycEditMode} onPickFile={onPickKycFile} onView={onViewKyc} onClearPending={onClearPendingKyc} onDelete={onDeleteKyc}
                  />
                </div>

                <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-100 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Accepted formats: JPG, PNG, PDF &nbsp;·&nbsp; Max 5 MB per file &nbsp;·&nbsp; All 3 documents required to verify this employee
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Verification Status</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isApproved
                        ? "This employee's documents have been reviewed and verified."
                        : kycCount < 3
                        ? `All 3 documents must be uploaded before verifying (${kycCount}/3 uploaded).`
                        : "All documents uploaded - ready for review."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVerification}
                    disabled={verifying || (!isApproved && kycCount < 3)}
                    className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                      isApproved
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-200"
                        : "bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-500/25"
                    }`}
                  >
                    {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {verifying ? "Saving…" : isApproved ? "Unverify" : "Mark as Verified"}
                  </button>
                </div>

                {kycEditMode && (
                  <div className="flex gap-3 pt-1 border-t border-gray-100">
                    <button type="button" onClick={() => { setKycEditMode(false); setKycFiles({ aadhar: null, pan_card: null, other: null }); }} disabled={kycSaving}
                      className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                      <X size={14} /> Cancel
                    </button>
                    <button type="button" onClick={saveKyc} disabled={kycSaving || Object.values(kycFiles).every((f) => !f)}
                      className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-lg shadow-teal-500/25">
                      {kycSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {kycSaving ? "Uploading…" : "Save Documents"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <SectionHeader
                  icon={History}
                  title="Activity Timeline"
                  subtitle="Assigned order history, most recent first"
                  badge={
                    <button onClick={fetchOrders} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <RefreshCw size={13} />
                    </button>
                  }
                />
                <div className="mt-4">
                  {ordersLoading ? (
                    <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}</div>
                  ) : timelineEvents.length === 0 ? (
                    <EmptyState icon={History} text="No recorded activity for this employee." />
                  ) : (
                    <Timeline events={timelineEvents} iconMap={EVENT_ICON} defaultIcon={Package} />
                  )}
                </div>
              </div>
            )}

            {editMode && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <SectionHeader icon={User} title="Edit Employee" subtitle="Account details and professional information, all in one place" />

                {saveMsg && (
                  <div className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 text-sm font-semibold
                    ${saveMsg === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                    {saveMsg === "success" ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-red-500 shrink-0" />}
                    <span className="flex-1">
                      {saveMsg === "success" ? "Employee updated successfully!" : saveMsg}
                    </span>
                    <button onClick={() => setSaveMsg(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Account Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputField icon={User} name="full_name" label="Full Name" placeholder="Enter full name"
                      value={editForm.full_name} onChange={onEditChange} onBlur={onEditBlur}
                      error={editErrors.full_name} touched={editTouched.full_name} />
                    <InputField icon={Mail} name="email" label="Email Address" placeholder="example@email.com" type="email"
                      value={editForm.email} onChange={onEditChange} onBlur={onEditBlur}
                      error={editErrors.email} touched={editTouched.email} />
                    <InputField icon={Phone} name="mobile" label="Phone Number" placeholder="10-digit number"
                      value={editForm.mobile} onChange={onEditChange} onBlur={onEditBlur}
                      error={editErrors.mobile} touched={editTouched.mobile} />
                    <SelectField icon={ShieldCheck} name="status" label="Account Status" value={editForm.status} onChange={onEditChange}
                      options={[
                        { value: "", label: "Select Status" },
                        { value: "Active", label: "Active" },
                        { value: "Inactive", label: "Inactive" },
                      ]} />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 h-11 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold border-2 border-teal-200 cursor-pointer transition-all">
                      <Camera size={15} /> Upload Profile Photo
                      <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                        onChange={(e) => e.target.files[0] && setPhoto(e.target.files[0])} />
                    </label>
                    {photo && <span className="text-xs text-gray-500">{photo.name}</span>}
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Professional Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Experience (years)</label>
                      <input type="number" min="0" className={inp} value={editForm.experience_years}
                        onChange={(e) => setEditForm((p) => ({ ...p, experience_years: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Bridge Type</label>
                      <select className={inp} value={editForm.bridge_type}
                        onChange={(e) => setEditForm((p) => ({ ...p, bridge_type: e.target.value }))}>
                        <option value="">Select</option>
                        <option value="full_time">Full Time</option>
                        <option value="freelancer">Freelancer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Assigned Area</label>
                      <input className={inp} value={editForm.assigned_area} placeholder="e.g. Noida Sector 62, Indirapuram"
                        onChange={(e) => setEditForm((p) => ({ ...p, assigned_area: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Vehicle Type</label>
                      <input className={inp} value={editForm.vehicle_type} placeholder="e.g. Bike"
                        onChange={(e) => setEditForm((p) => ({ ...p, vehicle_type: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Working Shift</label>
                      <input className={inp} value={editForm.working_shift} placeholder="e.g. 9:00 AM - 7:00 PM"
                        onChange={(e) => setEditForm((p) => ({ ...p, working_shift: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Joining Date</label>
                      <input type="date" className={inp + " [color-scheme:light]"} value={editForm.joining_date}
                        onChange={(e) => setEditForm((p) => ({ ...p, joining_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Max Orders / Day</label>
                      <input type="number" min="0" className={inp} value={editForm.max_orders_per_day}
                        onChange={(e) => setEditForm((p) => ({ ...p, max_orders_per_day: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Total Earnings (₹)</label>
                      <input type="number" min="0" step="0.01" className={inp} value={editForm.total_earnings}
                        onChange={(e) => setEditForm((p) => ({ ...p, total_earnings: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Incentives Earned (₹)</label>
                      <input type="number" min="0" step="0.01" className={inp} value={editForm.incentives_earned}
                        onChange={(e) => setEditForm((p) => ({ ...p, incentives_earned: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setEditMode(false)} disabled={saving}
                    className="flex-1 h-11 px-6 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                    <RotateCcw size={15} /> Cancel
                  </button>
                  <button type="button" onClick={saveEdit} disabled={saving}
                    className="flex-1 h-11 px-8 bg-[#007A7A] hover:bg-[#006B6B] disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition-all">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
