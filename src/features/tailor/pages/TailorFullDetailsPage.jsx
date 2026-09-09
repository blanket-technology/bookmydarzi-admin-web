import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { extractErrorMessage, formatDate, formatDateTime, formatCurrency, formatTailorId } from "../../../utils/formatters";
import StatusBadge from "../../../components/common/StatusBadge";
import Pagination from "../../../components/common/Pagination";
import { DonutChart, HBarChart, GaugeChart } from "../../../components/common/MiniCharts";
import {
  WorkspaceHero, HeroActionButton, KpiTile, SkeletonBlock, EmptyState,
  SummaryCard, StatGrid, Timeline, ConfirmModal,
} from "../../../components/common/EntityWorkspace";
import { KycCard, DocModal } from "../../../components/common/KycUpload";
import { InputField, SelectField } from "../../../components/common/FormFields";

import {
  Save, KeyRound, Trash2,
  User, Mail, Phone, Scissors, ShieldCheck,
  CreditCard, FileText, Camera, Loader2,
  CheckCircle2, XCircle, AlertCircle,
  X, UserCircle2, RotateCcw, Navigation, Wifi, WifiOff,
  LayoutGrid, Package, TrendingUp, History, RefreshCw, ChevronRight, ListChecks,
} from "lucide-react";


// ─── Validators ────────────────────────────────────────────────────────────────
const validators = {
  full_name:     (v) => v.trim().length < 3  ? "Name must be at least 3 characters"    : "",
  email:        (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email",
  mobile:       (v) => /^[6-9]\d{9}$/.test(v) ? "" : "Enter valid 10-digit mobile",
  address:      (v) => v.trim().length < 5  ? "Address is too short"                  : "",
  aadhar:       (v) => /^\d{12}$/.test(v.replace(/\s/g, "")) ? "" : "Aadhar must be 12 digits",
  pan:          (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase()) ? "" : "Valid PAN e.g. ABCDE1234F",
  other:        (v) => v.trim().length < 3  ? "Document ID required"                  : "",
};

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, badge }) => (
  <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
        <Icon size={20} className="text-teal-600" />
      </div>
      <div>
        <h3 className="font-bold text-gray-800 text-base leading-tight">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    {badge}
  </div>
);

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: History },
];

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "tailor_assigned", label: "Tailor Assigned" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "cloth_received_by_tailor", label: "Cloth Received" },
  { value: "stitching_started", label: "Stitching Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "final_check", label: "Final Check (QC)" },
  { value: "ready_for_dispatch", label: "Ready for Dispatch" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Production-KPI status sets - mirrors app/constants/tailor_workload.py
// exactly (PENDING_ORDER_STATUSES / ACTIVE_ORDER_STATUSES) so the counts
// shown here always agree with what GET /admin/tailors/workload reports.
const PENDING_STITCHING_STATUSES = new Set([
  "tailor_assigned", "pickup_scheduled", "pickup_pending", "picked_up", "cloth_received_by_tailor",
]);
const NON_TERMINAL_STATUSES = new Set([
  "tailor_assigned", "pickup_scheduled", "pickup_pending", "picked_up", "cloth_received_by_tailor",
  "stitching_started", "in_progress", "final_check", "ready_for_dispatch", "out_for_delivery",
]);

// ─── Main FullDetails Component ───────────────────────────────────────────────
export default function TailorFullDetailsPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id: routeTailorId } = useParams();
  const raw = { ...(location.state || {}), tailorId: routeTailorId };

  const tailorData = raw.tailor || {};

  const [liveData, setLiveData] = useState(tailorData);
  const [activeTab, setActiveTab] = useState("overview");

  const formFromData = (d) => ({
    full_name:      d.full_name      || "",
    email:          d.email          || "",
    mobile:         d.mobile         || "",
    address:        d.address        || "",
    specialization: d.specialization || "",
    role:           d.role           || "",
    status:         d.is_active ? "Active" : "Inactive",
    verify:         d.is_approved ? "Verified" : "Pending",
    aadhar:         d.aadhar || "",
    pan:            d.pan    || "",
    other:          d.other  || "",
    is_online:      !!d.is_online,
    latitude:       d.latitude  ?? null,
    longitude:      d.longitude ?? null,
    experience:     d.experience ?? "",
    rating:         d.rating ?? null,
  });

  const [form, setForm] = useState(() => formFromData(tailorData));

  const loadedTailorId = useRef(null);
  useEffect(() => {
    const incoming = tailorData?.tailor_id ?? raw?.tailorId;
    if (incoming && incoming !== loadedTailorId.current) {
      loadedTailorId.current = incoming;
      setLiveData(tailorData);
      setForm(formFromData(tailorData));
    }
  }, [location.state]);

  const [profileFetchError, setProfileFetchError] = useState("");
  const [kycUrls, setKycUrls] = useState({
    aadhar:   tailorData.aadhar_url   || null,
    pan_card: tailorData.pan_card_url || null,
    other:    tailorData.other_doc_url || null,
  });

  const fetchTailorProfile = useCallback(() => {
    const tid = tailorData?.tailor_id ?? raw?.tailorId;
    if (!tid) return;
    setProfileFetchError("");
    api.get(`/admin/tailors/${tid}`)
      .then(res => {
        const fresh = res.data;
        loadedTailorId.current = fresh.tailor_id ?? tid;
        setLiveData(fresh);
        setForm(formFromData(fresh));
        setKycUrls({
          aadhar:   fresh.aadhar_url   || null,
          pan_card: fresh.pan_card_url || null,
          other:    fresh.other_doc_url || null,
        });
      })
      // A failure here (network blip, transient CORS/5xx during a backend
      // restart) used to be swallowed silently, leaving the page stuck on
      // stale/incomplete data with no indication anything went wrong. Now
      // surfaced as a dismissible, retryable banner instead.
      .catch(err => setProfileFetchError(extractErrorMessage(err, "Failed to load latest tailor details.")));
     
  }, [tailorData?.tailor_id, raw?.tailorId]);

  // Fetch-on-mount/tailorId-change effect; the setState calls happen inside
  // the callback's async response handlers, not synchronously in the effect
  // body, so the cascading-render concern this rule flags doesn't apply.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTailorProfile(); }, [fetchTailorProfile]);

  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [photo,   setPhoto]   = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [kycFiles,     setKycFiles]     = useState({ aadhar: null, pan_card: null, other: null });
  const [kycUploading, setKycUploading] = useState({ aadhar: false, pan_card: false, other: false });
  const [viewing, setViewing] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteKycKey, setDeleteKycKey] = useState(null);

  // Includes both persisted URLs and locally-picked-but-not-yet-uploaded
  // files, purely for the "N/3 selected" progress display.
  const kycCount = Object.values(kycUrls).filter(Boolean).length + Object.values(kycFiles).filter(Boolean).length;
  // Verification must gate on documents the backend actually has (kycUrls
  // only) - a picked-but-unsaved file in kycFiles was never uploaded
  // (uploadPendingKyc only runs inside handleSave), so counting it here let
  // the Verify button enable itself for files the server had never seen,
  // producing a hard failure on click.
  const uploadedKycCount = Object.values(kycUrls).filter(Boolean).length;
  const tailorId = liveData.tailor_id || raw.tailorId || "T-0001";
  const [saving, setSaving] = useState(false);

  // ── Orders - independent paginated/filterable fetch, same pattern as
  // Bridge/UserDetailPage.jsx (client-computed KPIs from this list, no new
  // backend endpoint). ──
  const [orders, setOrders] = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [ordersStatus, setOrdersStatus] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!tailorId) return;
    setOrdersLoading(true);
    try {
      const res = await api.get("/admin/orders", {
        params: { tailor_id: tailorId, page: ordersPage, limit: ordersLimit, status: ordersStatus || undefined },
      });
      setOrders(res.data?.orders ?? []);
      setOrdersTotal(res.data?.total ?? 0);
    } catch {
      setOrders([]);
    } finally { setOrdersLoading(false); }
  }, [tailorId, ordersPage, ordersLimit, ordersStatus]);

  // Resets to page 1 whenever the status filter changes, so a filter switch
  // never leaves the user stranded on a now out-of-range page.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOrdersPage(1); }, [ordersStatus]);
  // Fetch-on-dep-change effect; setState happens inside fetchOrders' async
  // handlers, not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Workload - GET /admin/tailors/workload returns ALL tailors unfiltered
  // (no per-tailor endpoint exists), so this fetches once and picks this
  // tailor's row client-side. ──
  const [workload, setWorkload] = useState(null);
  const [workloadLoading, setWorkloadLoading] = useState(true);

  const fetchWorkload = useCallback(async () => {
    setWorkloadLoading(true);
    try {
      const res = await api.get("/admin/tailors/workload");
      const row = (res.data ?? []).find((w) => String(w.tailor_id) === String(tailorId));
      setWorkload(row ?? null);
    } catch {
      setWorkload(null);
    } finally { setWorkloadLoading(false); }
  }, [tailorId]);

  // Fetch-on-mount/tailorId-change effect; setState happens inside
  // fetchWorkload's async handlers, not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchWorkload(); }, [fetchWorkload]);

  const goToTab = (tabId) => setActiveTab(tabId);

  // ── KPIs / production counts - derived client-side from the orders list
  // (same "no invented data" pattern as UserDetailPage.jsx). Ready for
  // Dispatch / Delayed are computed directly here since they aren't part of
  // the bulk workload payload. ──
  // Date.now() is intentionally read outside useMemo - memoizing a value
  // derived from wall-clock time would freeze "delayed" at whatever it was
  // when `orders` last changed, silently going stale as real time passes
  // with no re-render trigger of its own. This is a one-off "is the
  // deadline in the past" comparison, not a reused/animated value, so
  // reading it during render is safe despite the stricter purity rule.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const productionCounts = useMemo(() => {
    let pendingStitching = 0, readyForQc = 0, readyForDispatch = 0, delayed = 0;
    orders.forEach((o) => {
      const status = (o.Status || "").toLowerCase();
      if (PENDING_STITCHING_STATUSES.has(status)) pendingStitching += 1;
      if (status === "final_check") readyForQc += 1;
      if (status === "ready_for_dispatch") readyForDispatch += 1;
      if (NON_TERMINAL_STATUSES.has(status) && o.ExpectedDeliveryDate && new Date(o.ExpectedDeliveryDate).getTime() < now) {
        delayed += 1;
      }
    });
    return { pendingStitching, readyForQc, readyForDispatch, delayed };
  }, [orders, now]);

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (touched[name]) setErrors(p => ({ ...p, [name]: validators[name]?.(value) || "" }));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validators[name]?.(value) || "" }));
  };

  const validateAll = () => {
    const e = {}, t = {};
    ["full_name", "email", "mobile"].forEach(k => {
      t[k] = true; e[k] = validators[k]?.(form[k]) || "";
    });
    setTouched(p => ({ ...p, ...t }));
    setErrors(p => ({ ...p, ...e }));
    return Object.values(e).every(v => v === "");
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    const tid = liveData.tailor_id || raw.tailorId;
    if (!tid) { setSaveMsg("No tailor ID found - cannot save."); return; }
    setSaving(true);
    try {
      // is_approved is deliberately never sent from this generic profile
      // save - verification is a separate, explicit admin review action
      // (see toggleVerification / the Documents tab's Verify control), not
      // a field to flip alongside unrelated edits like a phone number change.
      const payload = {
        full_name:      form.full_name.trim()      || undefined,
        email:          form.email.trim()           || undefined,
        mobile:         form.mobile.trim()          || undefined,
        specialization: form.specialization.trim()  || undefined,
        is_active:      form.status === "Active",
        is_available:   form.status === "Active",
      };
      await api.patch(`/admin/tailors/${tid}`, payload);
      await uploadPendingKyc(tid);
      await uploadPendingPhoto();
      setLiveData(prev => ({
        ...prev,
        full_name:      payload.full_name      ?? prev.full_name,
        email:          payload.email          ?? prev.email,
        mobile:         payload.mobile         ?? prev.mobile,
        specialization: payload.specialization ?? prev.specialization,
        is_active:      payload.is_active,
        is_available:   payload.is_available,
      }));
      setSaveMsg("success");
      setEditMode(false);
      setTimeout(() => setSaveMsg(null), 4000);
    } catch (err) {
      setSaveMsg(extractErrorMessage(err, "Failed to save."));
    } finally {
      setSaving(false);
    }
  };

  // Deliberate, standalone admin review action - the backend rejects
  // is_approved=true unless all 3 KYC documents are already uploaded (this
  // is also enforced client-side below via the disabled state), but the
  // point of separating this from handleSave is that verifying is a
  // decision the admin makes AFTER inspecting each document, not a side
  // effect of saving unrelated profile edits.
  const toggleVerification = async () => {
    const tid = liveData.tailor_id || raw.tailorId;
    if (!tid) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res = await api.patch(`/admin/tailors/${tid}`, { is_approved: !liveData.is_approved });
      setLiveData(prev => ({ ...prev, is_approved: res.data?.is_approved ?? !prev.is_approved }));
      setForm(prev => ({ ...prev, verify: (res.data?.is_approved ?? !liveData.is_approved) ? "Verified" : "Pending" }));
    } catch (err) {
      setVerifyMsg(extractErrorMessage(err, "Failed to update verification status."));
    } finally {
      setVerifying(false);
    }
  };

  // Activate / deactivate the tailor's account directly from the header (moved
  // here from the main dashboard table so the list stays a clean overview).
  // The backend blocks activating an unverified tailor; we also gate it here.
  const [togglingActive, setTogglingActive] = useState(false);
  const [activeMsg, setActiveMsg] = useState(null);
  const toggleActivation = async () => {
    const tid = liveData.tailor_id || raw.tailorId;
    if (!tid) return;
    const goingActive = !liveData.is_active;
    if (goingActive && !liveData.is_approved) {
      setActiveMsg("Verify this tailor (upload KYC & approve) before activating.");
      return;
    }
    setTogglingActive(true);
    setActiveMsg(null);
    try {
      const res = await api.patch(`/admin/tailors/${tid}`, { is_active: goingActive });
      const nextActive = res.data?.is_active ?? goingActive;
      setLiveData(prev => ({ ...prev, is_active: nextActive }));
      setForm(prev => ({ ...prev, status: nextActive ? "Active" : "Inactive" }));
    } catch (err) {
      setActiveMsg(extractErrorMessage(err, "Failed to update account status."));
    } finally {
      setTogglingActive(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setSaveMsg(null);
  };

  const handleCancel = () => {
    setEditMode(false);
    setErrors({});
    setTouched({});
    setSaveMsg(null);
    reset();
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const tid = liveData.tailor_id || raw.tailorId;
    if (!tid) return;
    try {
      await api.delete(`/admin/tailors/${tid}`);
      navigate(-1);
    } catch (err) {
      setSaveMsg(extractErrorMessage(err, "Failed to delete tailor. Please try again."));
    }
  };

  // No backend endpoint exists yet for an admin to trigger a tailor's
  // password reset on their behalf (only the tailor's own self-service
  // forgot-password flow exists, which requires the account holder to act).
  // Disabled rather than faking success - see HeroActionButton's title prop.

  const onPickFile = (key, file) => setKycFiles(p => ({ ...p, [key]: file }));
  const onClearPending = (key) => setKycFiles(p => ({ ...p, [key]: null }));
  const onView = (key) => {
    const f = kycFiles[key];
    const u = kycUrls[key];
    if (f || u) setViewing({ file: f || null, url: f ? null : u });
  };
  const onDeleteKyc = (key) => {
    if (!kycUrls[key]) return;
    setDeleteKycKey(key);
  };
  const confirmDeleteKyc = async () => {
    const key = deleteKycKey;
    setDeleteKycKey(null);
    if (!key) return;
    const tid = liveData.tailor_id || raw.tailorId;
    setKycUploading(p => ({ ...p, [key]: true }));
    try {
      await api.delete(`/admin/tailors/${tid}/kyc`, { params: { document_type: key } });
      setKycUrls(p => ({ ...p, [key]: null }));
    } catch (err) {
      setSaveMsg(extractErrorMessage(err, "Failed to delete document."));
    } finally {
      setKycUploading(p => ({ ...p, [key]: false }));
    }
  };

  // Admin-on-behalf-of-user photo upload - POST /admin/users/{user_id}/photo
  // (distinct from the self-service POST /users/profile/photo, which only
  // ever uploads the CALLER's own photo). Keyed on the tailor's USER id,
  // not their tailor_id - the two are different tables/ids.
  const uploadPendingPhoto = async () => {
    if (!photo) return;
    const uid = liveData.user_id;
    if (!uid) throw new Error("No user ID found - cannot upload photo.");
    const fd = new FormData();
    fd.append("file", photo);
    const res = await api.post(`/admin/users/${uid}/photo`, fd);
    setLiveData(prev => ({ ...prev, profile_image_url: res.data?.profile_image_url ?? prev.profile_image_url }));
    setPhoto(null);
  };

  const uploadPendingKyc = async (tid) => {
    const docMap = { aadhar: "aadhar", pan_card: "pan_card", other: "other" };
    for (const [key, docType] of Object.entries(docMap)) {
      const file = kycFiles[key];
      if (!file) continue;
      setKycUploading(p => ({ ...p, [key]: true }));
      try {
        const fd = new FormData();
        fd.append("document_type", docType);
        fd.append("file", file);
        const res = await api.post(`/admin/tailors/${tid}/kyc`, fd);
        setKycUrls(p => ({ ...p, [key]: res.data.url }));
        setKycFiles(p => ({ ...p, [key]: null }));
      } catch (err) {
        throw new Error(`KYC upload failed for ${key}: ${extractErrorMessage(err, err.message || "unknown error")}`, { cause: err });
      } finally {
        setKycUploading(p => ({ ...p, [key]: false }));
      }
    }
  };

  const reset = () => {
    setForm(formFromData(liveData));
    setKycFiles({ aadhar: null, pan_card: null, other: null });
    setErrors({});
    setTouched({});
  };

  // ── KPI row - Active/Completed/Utilization come from the workload
  // endpoint; Pending Stitching/Ready for Dispatch/Delayed are computed
  // client-side from the orders list above. ──
  const kpis = [
    { label: "Active Orders", value: workloadLoading ? "…" : workload?.active_orders ?? "-", accent: "text-blue-600" },
    { label: "Pending Stitching", value: ordersLoading ? "…" : productionCounts.pendingStitching, accent: "text-amber-600" },
    { label: "Ready for QC", value: ordersLoading ? "…" : productionCounts.readyForQc },
    { label: "Ready for Dispatch", value: ordersLoading ? "…" : productionCounts.readyForDispatch },
    { label: "Delayed Orders", value: ordersLoading ? "…" : productionCounts.delayed, accent: productionCounts.delayed > 0 ? "text-rose-600" : undefined },
  ];

  return (
    <>
      {viewing && (
        <DocModal
          file={viewing?.file}
          serverUrl={viewing?.url}
          onClose={() => setViewing(null)}
        />
      )}

      <ConfirmModal
        open={showDeleteConfirm}
        icon={Trash2}
        title="Delete Tailor?"
        description={
          <>
            This action cannot be undone. All data for{" "}
            <span className="font-semibold text-gray-700">{form.full_name || "this tailor"}</span> will be permanently removed.
          </>
        }
        confirmLabel="Yes, Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        open={!!deleteKycKey}
        icon={Trash2}
        title="Delete Document?"
        description="This permanently removes the uploaded file."
        confirmLabel="Yes, Delete"
        onConfirm={confirmDeleteKyc}
        onCancel={() => setDeleteKycKey(null)}
      />

      <div className="min-h-screen bg-slate-100">
        {/* ── Sticky hero ─────────────────────────────────────────────── */}
        <WorkspaceHero
          onBack={() => navigate(-1)}
          avatar={
            <div className="w-20 h-20 rounded-2xl border-2 border-white/30 overflow-hidden bg-teal-600 shrink-0 flex items-center justify-center">
              {photo ? (
                <img src={URL.createObjectURL(photo)} alt="profile" className="w-full h-full object-cover" />
              ) : liveData.profile_image_url ? (
                <img src={liveData.profile_image_url} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 size={40} className="text-teal-200" />
              )}
            </div>
          }
          title={form.full_name || "-"}
          badges={
            <>
              <StatusBadge status={form.status === "Active" ? "active" : "inactive"} label={form.status || "-"} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.verify === "Verified" ? "bg-blue-400/20 text-blue-100" : "bg-amber-400/20 text-amber-100"}`}>
                {form.verify || "-"}
              </span>
            </>
          }
          metaLine={<>{formatTailorId(tailorId, liveData.user_code || raw.user_code, form.location)} &nbsp;·&nbsp; {form.email || "-"} &nbsp;·&nbsp; {form.mobile || "-"}</>}
          factsRow={
            <>
              <span className="flex items-center gap-1.5"><Scissors size={11} /> {form.specialization || "Specialization not set"}</span>
              <span className="flex items-center gap-1.5">{form.is_online ? <Wifi size={11} /> : <WifiOff size={11} />} {form.is_online ? "Online" : "Offline"}</span>
              {form.rating != null && <span className="flex items-center gap-1.5">⭐ {form.rating}</span>}
            </>
          }
          actions={
            editMode ? (
              <>
                <HeroActionButton onClick={handleCancel} icon={X} label="Cancel" />
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 h-9 px-4 bg-white text-teal-700 rounded-lg text-xs font-bold hover:bg-teal-50 transition-all shadow-lg disabled:opacity-60">
                  <Save size={13} /> <span className="hidden sm:inline">{saving ? "Saving…" : "Save Changes"}</span>
                </button>
              </>
            ) : (
              <>
                <HeroActionButton
                  onClick={toggleActivation}
                  loading={togglingActive}
                  disabled={togglingActive || (!liveData.is_active && !liveData.is_approved)}
                  icon={liveData.is_active ? XCircle : CheckCircle2}
                  label={liveData.is_active ? "Deactivate" : "Activate"}
                  tone={liveData.is_active ? "warn" : "neutral"}
                />
                <HeroActionButton onClick={handleEdit} icon={User} label="Edit Profile" />
                <HeroActionButton
                  disabled
                  icon={KeyRound}
                  label="Reset Password"
                  tone="warn"
                  title="Not available yet - no admin-triggered reset exists for tailor accounts"
                />
                <HeroActionButton onClick={() => setShowDeleteConfirm(true)} icon={Trash2} label="Delete" tone="danger" />
              </>
            )
          }
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={goToTab}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {profileFetchError && (
            <div className="rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 text-sm font-semibold bg-red-50 text-red-800 border-red-200">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <span className="flex-1">{profileFetchError}</span>
              <button onClick={fetchTailorProfile} className="underline font-bold shrink-0">Retry</button>
              <button onClick={() => setProfileFetchError("")} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={15} />
              </button>
            </div>
          )}

          {saveMsg && (
            <div className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 text-sm font-semibold
              ${saveMsg === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
              {saveMsg === "success" ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-red-500 shrink-0" />}
              <span className="flex-1">
                {saveMsg === "success" ? "Profile updated successfully!" : (saveMsg === "error" ? "Failed to save. Please try again." : saveMsg)}
              </span>
              <button onClick={() => setSaveMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
          )}

          {activeMsg && (
            <div className="rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 text-sm font-semibold bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle size={18} className="text-amber-500 shrink-0" />
              <span className="flex-1">{activeMsg}</span>
              <button onClick={() => setActiveMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
          )}

          {/* ── KPI row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {kpis.map((k) => <KpiTile key={k.label} {...k} />)}
          </div>

          {/* ── Tab content ──────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SummaryCard icon={Package} title="Orders" count={ordersTotal} onViewAll={() => goToTab("orders")} empty="No orders assigned yet.">
                {orders[0] && (
                  <div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{orders[0].OrderCode || `#${orders[0].Id}`}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={orders[0].Status} label={orders[0].StatusLabel} />
                      <span className="text-xs text-gray-400 [font-variant-numeric:tabular-nums]">{formatCurrency(orders[0].FinalAmount)}</span>
                    </div>
                  </div>
                )}
              </SummaryCard>

              <SummaryCard icon={ListChecks} title="Workload" count={null} onViewAll={() => goToTab("performance")} empty="">
                {workloadLoading ? (
                  <SkeletonBlock className="h-10" />
                ) : workload ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Current Queue</span>
                      <span className="font-bold text-gray-700">{workload.active_orders}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Capacity Utilization</span>
                      <span className="font-bold text-gray-700">{workload.utilization_percentage}%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No workload data available.</p>
                )}
              </SummaryCard>

              <SummaryCard icon={FileText} title="Documents" count={kycCount} onViewAll={() => goToTab("documents")} empty="No KYC documents uploaded.">
                <div className="flex items-center gap-2">
                  <StatusBadge status={form.verify === "Verified" ? "verified" : "pending"} label={form.verify || "Pending"} />
                  <span className="text-xs text-gray-400">{kycCount}/3 uploaded</span>
                </div>
              </SummaryCard>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 pb-4">
                <SectionHeader
                  icon={Package}
                  title="Orders"
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
                <EmptyState icon={Package} text={ordersStatus ? "No orders with this status." : "No orders assigned to this tailor yet."} />
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
              {/* Visual performance overview - charts built from the same live
                  workload/production numbers shown as tiles below. */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={Package} title="Order Mix" subtitle="Active vs pending vs completed" />
                  <div className="mt-4">
                    <DonutChart
                      centerLabel="Orders"
                      data={[
                        { label: "Active", value: workload?.active_orders ?? 0, color: "blue" },
                        { label: "Pending", value: workload?.pending_orders ?? 0, color: "amber" },
                        { label: "Completed", value: workload?.completed_orders ?? 0, color: "emerald" },
                      ]}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={ListChecks} title="Production Pipeline" subtitle="Where work sits right now" />
                  <div className="mt-4">
                    <HBarChart
                      data={[
                        { label: "Pending Stitching", value: productionCounts.pendingStitching ?? 0, color: "amber" },
                        { label: "Ready for QC", value: productionCounts.readyForQc ?? 0, color: "violet" },
                        { label: "Ready for Dispatch", value: productionCounts.readyForDispatch ?? 0, color: "teal" },
                        { label: "Delayed", value: productionCounts.delayed ?? 0, color: "rose" },
                      ]}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <SectionHeader icon={TrendingUp} title="Capacity" subtitle="Current utilisation" />
                  <div className="flex-1 flex items-center justify-center mt-4">
                    {workloadLoading ? (
                      <SkeletonBlock className="h-24 w-40" />
                    ) : (
                      <GaugeChart value={workload?.utilization_percentage ?? 0} label="Utilisation" />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <SectionHeader icon={Package} title="Production" subtitle="Live counts from this tailor's order history" />
                <StatGrid items={[
                  { label: "Active Orders", value: workload?.active_orders },
                  { label: "Pending Stitching", value: productionCounts.pendingStitching },
                  { label: "Ready for QC", value: productionCounts.readyForQc },
                  { label: "Ready for Dispatch", value: productionCounts.readyForDispatch },
                  { label: "Delayed Orders", value: productionCounts.delayed },
                  { label: "Completed Orders", value: workload?.completed_orders },
                ]} />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <SectionHeader icon={ListChecks} title="Workload & Capacity" subtitle="From the shared tailor workload dashboard" />
                {workloadLoading ? (
                  <SkeletonBlock className="h-16" />
                ) : workload ? (
                  <StatGrid items={[
                    { label: "Current Queue", value: workload.active_orders },
                    { label: "Pending Orders", value: workload.pending_orders },
                    { label: "Capacity Utilization", value: `${workload.utilization_percentage}%` },
                  ]} />
                ) : (
                  <EmptyState icon={ListChecks} text="No workload data available for this tailor." />
                )}
              </div>

              {form.rating != null && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <SectionHeader icon={TrendingUp} title="Rating" subtitle="Admin-set rating shown on the tailor's public profile" />
                  <StatGrid items={[{ label: "Rating", value: `⭐ ${form.rating}` }]} />
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <SectionHeader
                  icon={ShieldCheck}
                  title="KYC Verification"
                  subtitle="Enter document numbers and upload file copies"
                  badge={
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border-2
                      ${uploadedKycCount === 3 ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                      {uploadedKycCount}/3 uploaded{kycCount > uploadedKycCount ? ` (${kycCount - uploadedKycCount} pending save)` : ""}
                    </span>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <KycCard
                    label="Aadhar Card" icon={CreditCard} docKey="aadhar"
                    pendingFile={kycFiles.aadhar} existingUrl={kycUrls.aadhar} uploading={kycUploading.aadhar}
                    editMode={editMode} onPickFile={onPickFile} onView={onView} onClearPending={onClearPending} onDelete={onDeleteKyc}
                  />
                  <KycCard
                    label="PAN Card" icon={FileText} docKey="pan_card"
                    pendingFile={kycFiles.pan_card} existingUrl={kycUrls.pan_card} uploading={kycUploading.pan_card}
                    editMode={editMode} onPickFile={onPickFile} onView={onView} onClearPending={onClearPending} onDelete={onDeleteKyc}
                  />
                  <KycCard
                    label="Other Document" icon={FileText} docKey="other"
                    pendingFile={kycFiles.other} existingUrl={kycUrls.other} uploading={kycUploading.other}
                    editMode={editMode} onPickFile={onPickFile} onView={onView} onClearPending={onClearPending} onDelete={onDeleteKyc}
                  />
                </div>

                <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-100 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Accepted formats: JPG, PNG, PDF &nbsp;·&nbsp; Max 5 MB per file &nbsp;·&nbsp; All 3 documents required to verify this tailor
                  </p>
                </div>

                {verifyMsg && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3 border-2 bg-red-50 text-red-800 border-red-200 text-sm font-semibold">
                    <AlertCircle size={16} className="shrink-0" /> {verifyMsg}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Verification Status</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {liveData.is_approved
                        ? "This tailor's documents have been reviewed and verified."
                        : uploadedKycCount < 3 && kycCount >= 3
                        ? "Documents selected but not yet saved - click Save Changes to upload them before verifying."
                        : uploadedKycCount < 3
                        ? `All 3 documents must be uploaded before verifying (${uploadedKycCount}/3 uploaded).`
                        : "All documents uploaded - review each file above, then confirm."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVerification}
                    disabled={verifying || (!liveData.is_approved && uploadedKycCount < 3)}
                    className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                      liveData.is_approved
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-200"
                        : "bg-teal-700 hover:bg-teal-800 text-white shadow-lg shadow-teal-500/25"
                    }`}
                  >
                    {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {verifying ? "Saving…" : liveData.is_approved ? "Unverify" : "Mark as Verified"}
                  </button>
                </div>
              </div>
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
                  <EmptyState icon={History} text="No recorded activity for this tailor." />
                ) : (
                  <Timeline events={timelineEvents} iconMap={{ order: Package }} defaultIcon={Package} />
                )}
              </div>
            </div>
          )}

          {editMode && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <SectionHeader icon={User} title="Edit Personal Information" subtitle="Basic profile and contact details" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField icon={User} name="full_name" label="Full Name" placeholder="Enter full name" value={form.full_name} onChange={onChange} onBlur={onBlur} error={errors.full_name} touched={touched.full_name} disabled={!editMode} />
                <InputField icon={Mail} name="email" label="Email Address" placeholder="example@email.com" value={form.email} onChange={onChange} onBlur={onBlur} error={errors.email} touched={touched.email} disabled={!editMode} type="email" />
                <InputField icon={Phone} name="mobile" label="Phone Number" placeholder="10-digit number" value={form.mobile} onChange={onChange} onBlur={onBlur} error={errors.mobile} touched={touched.mobile} disabled={!editMode} />
                <InputField icon={Scissors} name="specialization" label="Specialization" placeholder="e.g. Bridal, Suits" value={form.specialization ?? ""} onChange={onChange} onBlur={onBlur} disabled={!editMode} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <SelectField icon={User} name="role" label="Role" value={form.role} onChange={onChange} disabled={!editMode}
                  options={[
                    { value: "", label: "Select Role" },
                    { value: "Tailor", label: "Tailor" },
                    { value: "Vendor", label: "Vendor" },
                  ]} />
                <SelectField icon={CheckCircle2} name="status" label="Account Status" value={form.status} onChange={onChange} disabled={!editMode}
                  options={[
                    { value: "", label: "Select Status" },
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]} />
              </div>
              {/* Verification is a deliberate admin review action (open the
                  Documents tab, inspect each file, then confirm) - not a
                  field to flip alongside unrelated profile edits like a
                  phone number change. See the Documents tab's dedicated
                  Verify/Unverify control. */}

              <div className="pt-2 border-t border-gray-100">
                <label className="absolute -bottom-1.5 -right-1.5 hidden" />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 h-11 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold border-2 border-teal-200 cursor-pointer transition-all">
                    <Camera size={15} /> Upload Profile Photo
                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                      onChange={(e) => e.target.files[0] && setPhoto(e.target.files[0])} />
                  </label>
                  <button type="button" onClick={reset} disabled={saving}
                    className="h-11 px-6 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 text-gray-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                    <RotateCcw size={15} /> Reset
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Navigation size={15} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500">Location & Online Status (read-only, set by the tailor's mobile app)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
                  <span>Latitude: {form.latitude != null ? form.latitude : "-"}</span>
                  <span>Longitude: {form.longitude != null ? form.longitude : "-"}</span>
                </div>
                {form.latitude != null && form.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// export handled by function declaration default above
