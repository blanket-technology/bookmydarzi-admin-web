import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Scissors,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Download,
  Camera,
  Activity,
  Radio,
  Phone,
  User,
  Bike,
  Ruler,
  Pencil,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import api, { resolveMediaUrl } from "../../../services/api";
import { getStoredUser } from "../../../store/authStore";
import { ROLES } from "../../../constants/permissions.js";
import { extractErrorMessage, formatCurrency, formatDateTime } from "../../../utils/formatters";
import { notifyError } from "../../../services/dialogService";
import {
  getOrderActions,
  runOrderAction,
  STATUS_LABELS,
  ORDER_STATUS,
} from "../../../utils/orderActions";

// Mirrors backend orders.py _PHOTO_UPLOAD_STAGES - tailor uploads are only
// accepted while the order is in one of these stitching stages.
const PHOTO_UPLOAD_STAGES = new Set([
  ORDER_STATUS.STITCHING_STARTED,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.FINAL_CHECK,
]);

// Status → accent color family, used for both the header pill and each
// section card's left accent stripe so the order's stage reads peripherally
// while scrolling, not just from the one pill in the header.
const STATUS_THEME = {
  delivered:                { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    accent: "border-teal-400" },
  completed:                { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", accent: "border-emerald-400" },
  cancelled:                { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    accent: "border-rose-400" },
  order_rejected:           { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    accent: "border-rose-400" },
  out_for_delivery:         { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    accent: "border-blue-400" },
  ready_for_dispatch:       { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-400",    accent: "border-blue-300" },
  tailor_assigned:          { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500",  accent: "border-indigo-400" },
  cloth_received_by_tailor: { bg: "bg-indigo-50",  text: "text-indigo-600",  dot: "bg-indigo-400",  accent: "border-indigo-300" },
  stitching_started:        { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",  accent: "border-purple-400" },
  in_progress:              { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",  accent: "border-purple-400" },
  final_check:              { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  accent: "border-violet-400" },
  picked_up:                { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  accent: "border-orange-400" },
  pickup_pending:           { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   accent: "border-amber-400" },
  pickup_scheduled:         { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   accent: "border-amber-300" },
  order_accepted:           { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    accent: "border-teal-400" },
  order_placed:             { bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-500",  accent: "border-yellow-400" },
  searching_tailor:         { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     accent: "border-sky-400" },
  broadcasted:              { bg: "bg-sky-50",     text: "text-sky-800",    dot: "bg-sky-600",     accent: "border-sky-500" },
  pending_payment:          { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    accent: "border-gray-300" },
  payment_failed:           { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    accent: "border-rose-400" },
};
const DEFAULT_THEME = { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400", accent: "border-gray-200" };

function themeFor(status) {
  return STATUS_THEME[status] || DEFAULT_THEME;
}

// ─── Shared building blocks ─────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, accent, right, children }) {
  return (
    <div className={`bg-white rounded-2xl border-l-4 ${accent || "border-gray-200"} border-t border-r border-b border-gray-100 shadow-sm p-5`}>
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
        {Icon && <Icon size={17} className="text-teal-600" />}
        <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

/** Compact key-fact tile - for scannable data (Order Info, Payment), not
 * sequential/textual content. */
function Fact({ label, value, emphasis = false }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-0.5 text-gray-800 [font-variant-numeric:tabular-nums] ${emphasis ? "text-lg font-bold" : "text-sm font-semibold"}`}>
        {value}
      </p>
    </div>
  );
}

// Canonical fulfillment journey - the granular backend statuses are grouped
// into the handful of milestones an ops person tracks. `match` lists every
// raw status that maps to this step (so the stepper lights up correctly no
// matter which fine-grained status the order is in).
const JOURNEY = [
  { key: "placed",    label: "Placed",       match: ["order_placed", "pending_payment", "payment_failed", "order_accepted"] },
  { key: "assigned",  label: "Tailor Assigned", match: ["searching_tailor", "broadcasted", "tailor_assigned", "cloth_received_by_tailor"] },
  { key: "pickup",    label: "Picked Up",    match: ["pickup_pending", "pickup_scheduled", "picked_up"] },
  { key: "stitching", label: "Stitching",    match: ["stitching_started", "in_progress", "final_check", "ready_for_dispatch"] },
  { key: "delivery",  label: "Out for Delivery", match: ["out_for_delivery"] },
  { key: "done",      label: "Delivered",    match: ["delivered", "completed"] },
];

function journeyIndex(status) {
  const i = JOURNEY.findIndex((s) => s.match.includes(status));
  return i; // -1 for cancelled/rejected/unknown
}

/** Horizontal progress stepper across the order lifecycle. Cancelled/rejected
 * orders show a distinct "halted" state instead of the journey. */
function StatusStepper({ status }) {
  const terminated = ["cancelled", "order_rejected"].includes(status);
  const current = journeyIndex(status);

  if (terminated) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        <p className="text-sm font-semibold text-rose-700">
          {status === "cancelled" ? "Order Cancelled" : "Order Rejected"}
        </p>
        <span className="text-xs text-gray-400">- this order did not proceed through fulfillment.</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5">
      <div className="flex items-center">
        {JOURNEY.map((step, i) => {
          const done = current > i;
          const active = current === i;
          const state = done ? "done" : active ? "active" : "todo";
          const dot = {
            done: "bg-teal-600 text-white",
            active: "bg-teal-600 text-white ring-4 ring-teal-100",
            todo: "bg-gray-100 text-gray-400",
          }[state];
          const line = current > i ? "bg-teal-500" : "bg-gray-200";
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${dot}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-teal-700" : done ? "text-gray-600" : "text-gray-400"}`}>
                  {step.label}
                </span>
              </div>
              {i < JOURNEY.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 sm:mx-2 rounded-full -mt-4">
                  <div className={`h-full rounded-full ${line}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, variant = "primary", full }) {
  const base =
    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-teal-700 hover:bg-teal-800 text-white shadow-sm shadow-teal-600/20",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    secondary: "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${full ? "w-full" : ""}`}>
      {label}
    </button>
  );
}

export default function OrderFullDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const { order: initialOrder } = location.state || {};

  const [order, setOrder] = useState(initialOrder || null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadOrderError, setLoadOrderError] = useState("");

  // location.state.order is an optional prefetch seed (e.g. the row the
  // admin just clicked) - it's only ever used to paint something instantly
  // while a real fetch is in flight, NEVER as a substitute for one. The seed
  // can be stale (e.g. the admin accepted this order, went back to a list
  // that hasn't refetched, then reopened the same row - React Query's
  // placeholderData keeps serving the old row object) and previously that
  // staleness was invisible: an early-return here skipped the fetch entirely
  // whenever the seed's Id already matched the URL, so "Accept order" kept
  // showing after the order had already been accepted. The URL param is the
  // only source of truth for which order this page shows, and every mount
  // now re-verifies it against the server - so refresh/bookmark/notification
  // deep links, and a stale list-row click, all converge on real data.
  // Real fetch-on-param-change effect, not a derived-state anti-pattern;
  // loading/error must reset synchronously so a stale order's error banner
  // never flashes while the new orderId's request is in flight.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!orderId) return;
    setLoadingOrder(true);
    setLoadOrderError("");
    api.get(`/orders/${orderId}`)
      .then((res) => {
        setOrder(res.data);
        setLoadOrderError("");
      })
      .catch((err) => {
        setOrder((prev) => (prev && String(prev.Id) === String(orderId) ? prev : null));
        setLoadOrderError(extractErrorMessage(err, "Failed to load order. Please try again."));
      })
      .finally(() => setLoadingOrder(false));
  }, [orderId]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const [tailors, setTailors] = useState([]);
  const [selectedTailorId, setSelectedTailorId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [broadcasts, setBroadcasts] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photosError, setPhotosError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const [editingNotes, setEditingNotes] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(false);
  const [savingMeasurement, setSavingMeasurement] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    profile_name: "", gender: "", fit_preference: "",
    chest: "", waist: "", hips: "", shoulder: "", neck: "",
    sleeve_length: "", inseam: "", height: "", notes: "",
  });
  const [notesForm, setNotesForm] = useState({
    description: initialOrder?.Description || "",
    customization_notes: initialOrder?.CustomizationNotes || "",
    fabric_notes: initialOrder?.FabricNotes || "",
  });

  // Syncs the notes edit form to the freshly-loaded order; must run
  // whenever `order` changes (initial load, refetch after save) so the
  // form never shows a previous order's stale notes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (order) {
      setNotesForm({
        description: order.Description || "",
        customization_notes: order.CustomizationNotes || "",
        fabric_notes: order.FabricNotes || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.Id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // The tailor list populates the assignment dropdown ONLY - it is not needed
  // to render the page, and is meaningless for terminal orders (no assignment
  // possible). So it is NOT fetched on mount; it loads lazily the first time
  // the admin focuses/opens the tailor <select> (see onFocus at the select).
  const [tailorsLoaded, setTailorsLoaded] = useState(false);
  const loadTailors = useCallback(() => {
    if (tailorsLoaded) return; // fetch once, then cached in component state
    setTailorsLoaded(true);
    // Employees can't call GET /admin/tailors (admin/superadmin only) - use
    // the employee-safe endpoint instead so the dropdown populates for that
    // role rather than silently staying empty.
    const role = (getStoredUser()?.Role || "").toLowerCase();
    const endpoint = role === ROLES.EMPLOYEE ? "/employee/tailors" : "/admin/tailors";
    api.get(endpoint)
      .then((res) => {
        // Only approved + active tailors are eligible - the backend rejects
        // everyone else, so showing them is a dead end. Filter here.
        const list = (res.data || []).filter(
          (t) => t.is_approved !== false && t.is_active !== false,
        );
        setTailors(list);
      })
      .catch(() => { setTailorsLoaded(false); }); // allow retry on next focus
  }, [tailorsLoaded]);

  const fetchBroadcasts = () => {
    if (!order?.Id) return;
    api.get(`/tailor/orders/${order.Id}/broadcast/status`)
      .then((res) => setBroadcasts(res.data))
      .catch(() => setBroadcasts(null));
  };

  useEffect(() => {
    const broadcastStatuses = ["searching_tailor", "broadcasted", "tailor_accepted"];
    if (order?.Status && broadcastStatuses.includes(order.Status)) {
      fetchBroadcasts();
      const interval = setInterval(fetchBroadcasts, 15000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.Id, order?.Status]);

  // Fetch-on-order-change effect; clearing stale errors before the new
  // requests land prevents a previous order's photo/tracking error from
  // lingering on screen after navigating to a different order.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!order?.Id) return;
    setPhotosError("");
    setTrackingError("");
    api.get(`/orders/${order.Id}/photos`)
      .then((r) => {
        setPhotos(r.data || []);
        setPhotosError("");
      })
      .catch((err) => {
        setPhotos([]);
        setPhotosError(extractErrorMessage(err, "Failed to load photos."));
      });
    api.get(`/orders/${order.Id}/tracking`)
      .then((r) => {
        setTracking(r.data);
        setTrackingError("");
      })
      .catch((err) => {
        setTracking(null);
        setTrackingError(extractErrorMessage(err, "Failed to load tracking info."));
      });
  }, [order?.Id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Tailor-only upload - backend only accepts this while the order is in
  // stitching_started | in_progress | final_check (see orders.py
  // upload_order_photo / _PHOTO_UPLOAD_STAGES); the current status is checked
  // client-side too so the file picker never opens for a stage that would
  // just 422.
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !order?.Id) return;
    setUploadingPhoto(true);
    setPhotoUploadError("");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("stage", order.Status || "in_progress");
      await api.post(`/orders/${order.Id}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const r = await api.get(`/orders/${order.Id}/photos`);
      setPhotos(r.data || []);
    } catch (err) {
      setPhotoUploadError(extractErrorMessage(err, "Photo upload failed."));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const downloadInvoice = async () => {
    if (!order?.Id) return;
    setInvoiceLoading(true);
    try {
      const res = await api.get(`/orders/${order.Id}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.OrderCode || order.Id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notifyError("Invoice not available for this order.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const refresh = async () => {
    if (!order?.Id) return true;
    try {
      // Refresh THIS order via the single-order endpoint (same one the page
      // loads with, line ~132) - not GET /admin/orders?search= which fetched a
      // whole list just to find one record.
      const res = await api.get(`/orders/${order.Id}`);
      if (res.data) setOrder(res.data);
      return true;
    } catch {
      // best-effort refresh; keep showing the last-known order state, but
      // tell the caller so it can warn the admin the screen may be stale
      // instead of silently looking up to date.
      return false;
    }
  };

  const runAction = async (fn) => {
    setActionLoading(true);
    setMsg(null);
    try {
      await fn();
      const refreshed = await refresh();
      setMsg({
        type: "success",
        text: refreshed
          ? "Action completed successfully."
          : "Action completed successfully, but the screen couldn't refresh - reload the page to see the latest state.",
      });
    } catch (err) {
      setMsg({
        type: "error",
        text: extractErrorMessage(err, "Action failed."),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const assignTailor = () =>
    runAction(() =>
      api.patch(`/admin/orders/${order.Id}/assign-tailor`, {
        tailor_id: Number(selectedTailorId),
      })
    );

  // Force-starts a fresh broadcast round (app/api/v1/endpoints/admin.py:
  // POST /admin/orders/{id}/broadcast) - clears BroadcastExhausted and calls
  // initiate_broadcast server-side. The automated system already retries on
  // its own escalating rounds; this exists for the case an admin wants to
  // give the automated path another shot before falling back to manual
  // assignment below (e.g. after a tailor's availability changed).
  const triggerBroadcast = () =>
    runAction(() => api.post(`/admin/orders/${order.Id}/broadcast`));

  // The notes PATCH returns the full updated OrderResponse, so consume it
  // directly instead of going through runAction's list-search refresh (which
  // could miss the row and leave the notes looking unsaved). This guarantees
  // the saved values are reflected and re-syncs the form from the server.
  const openMeasurementEditor = () => {
    const m = order.measurement || {};
    setMeasurementForm({
      profile_name: m.profile_name || "",
      gender: m.gender || "",
      fit_preference: m.fit_preference || "",
      chest: m.chest ?? "", waist: m.waist ?? "", hips: m.hips ?? "",
      shoulder: m.shoulder ?? "", neck: m.neck ?? "",
      sleeve_length: m.sleeve_length ?? "", inseam: m.inseam ?? "",
      height: m.height ?? "", notes: m.notes || "",
    });
    setEditingMeasurement(true);
    setMsg(null);
  };

  const saveMeasurement = async () => {
    setSavingMeasurement(true);
    setMsg(null);
    try {
      // Send only filled values; numbers as numbers. Backend:
      // PATCH /admin/orders/{id}/measurement (AdminOrderMeasurementRequest).
      const numFields = ["chest", "waist", "hips", "shoulder", "neck", "sleeve_length", "inseam", "height"];
      const payload = {};
      for (const [k, v] of Object.entries(measurementForm)) {
        if (v === "" || v == null) continue;
        payload[k] = numFields.includes(k) ? Number(v) : v;
      }
      const res = await api.patch(`/admin/orders/${order.Id}/measurement`, payload);
      if (res.data) setOrder(res.data);
      setMsg({ type: "success", text: "Measurements saved." });
      setEditingMeasurement(false);
    } catch (err) {
      setMsg({ type: "error", text: extractErrorMessage(err, "Failed to save measurements.") });
    } finally {
      setSavingMeasurement(false);
    }
  };

  const saveNotes = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.patch(`/admin/orders/${order.Id}/notes`, {
        description: notesForm.description || null,
        customization_notes: notesForm.customization_notes || null,
        fabric_notes: notesForm.fabric_notes || null,
      });
      if (res.data) {
        setOrder(res.data);
        setNotesForm({
          description: res.data.Description || "",
          customization_notes: res.data.CustomizationNotes || "",
          fabric_notes: res.data.FabricNotes || "",
        });
      }
      setMsg({ type: "success", text: "Notes saved." });
      setEditingNotes(false);
    } catch (err) {
      setMsg({ type: "error", text: extractErrorMessage(err, "Failed to save notes.") });
    } finally {
      setActionLoading(false);
    }
  };

  const currentRole = (getStoredUser()?.Role || "").toLowerCase();
  const isTailor = currentRole === ROLES.TAILOR;
  const [pendingAction, setPendingAction] = useState(null); // action needing input/reason
  const [actionInput, setActionInput] = useState({});

  const executeAction = (action, input = {}) => {
    if (action.requiresReason && !input.__confirmed) {
      setActionInput({});
      setPendingAction(action);
      return;
    }
    if (action.requiresReason) {
      const reason = (input.reason || "").trim();
      if (!reason) return;
      runAction(() => runOrderAction(api, action, order, { reason }));
      return;
    }
    if (action.requiresInput && !input.__confirmed) {
      // Seed defaults that the modal pre-fills visually (e.g. the amount
      // field shows the remaining balance) so a Confirm click without any
      // edits still sends a valid value instead of undefined -> NaN -> null,
      // which the backend's amount: float field rejects with a 422.
      setActionInput(
        action.requiresInput.includes("amount")
          ? { amount: String(order.RemainingAmount || "") }
          : {}
      );
      setPendingAction(action);
      return;
    }
    runAction(() => runOrderAction(api, action, order, input));
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          {loadingOrder ? (
            <>
              <Loader2 size={32} className="mx-auto mb-3 text-teal-600 animate-spin" />
              <p className="font-semibold">Loading order…</p>
            </>
          ) : loadOrderError ? (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <p className="font-semibold text-rose-700">{loadOrderError}</p>
              <div className="mt-4 flex flex-col gap-2 items-center">
                <button
                  onClick={() => {
                    setLoadingOrder(true);
                    api.get(`/orders/${orderId}`)
                      .then((res) => {
                        setOrder(res.data);
                        setLoadOrderError("");
                      })
                      .catch((err) => {
                        setLoadOrderError(extractErrorMessage(err, "Failed to load order. Please try again."));
                      })
                      .finally(() => setLoadingOrder(false));
                  }}
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate("/ordersdetails")}
                  className="text-teal-600 underline text-sm hover:text-teal-700"
                >
                  Back to Orders
                </button>
              </div>
            </>
          ) : (
            <>
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">No order selected</p>
              <button
                onClick={() => navigate("/ordersdetails")}
                className="mt-3 text-teal-600 underline text-sm"
              >
                Back to Orders
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const status = order.Status?.toLowerCase();
  const theme = themeFor(status);
  const availableActions = getOrderActions(currentRole, order, null);
  const pickupType = (order.PickupType || order.pickup_type || "").toLowerCase();
  const timelineEvents = (tracking?.milestones || tracking?.timeline || []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-teal-700 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/ordersdetails")}
              title="Back to Orders"
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">
                {order.OrderCode || order.OrderNumber || `Order #${order.Id}`}
              </h1>
              <p className="text-teal-200 text-[11px]">
                {order.address?.full_name ? `for ${order.address.full_name}` : "Order Management & Workflow"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${theme.bg} ${theme.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
              {STATUS_LABELS[status] || order.StatusLabel || order.Status}
            </span>
            <button
              onClick={downloadInvoice}
              disabled={invoiceLoading}
              title="Download Invoice PDF"
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
            >
              {invoiceLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span className="hidden sm:inline">Invoice</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Lifecycle progress: where this order is, at a glance ──────── */}
        <div className="mb-6">
          <StatusStepper status={status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── Left: main narrative ───────────────────────────────────── */}
          <div className="space-y-6 min-w-0">

            {/* What the customer ordered */}
            <SectionCard
              icon={Package}
              title="Order Details"
              accent={theme.accent}
              right={
                order.CreatedAt ? (
                  <span className="text-[11px] text-gray-400">Ordered {formatDateTime(order.CreatedAt)}</span>
                ) : null
              }
            >
              {/* Ordered items - each with its catalog image, name & quantity */}
              {(() => {
                const items = Array.isArray(order.Items) && order.Items.length > 0
                  ? order.Items
                  : [{
                      service_name: order.ServiceTitle || order.ServiceName,
                      category_name: order.ServiceSubtitle,
                      image_url: null,
                      quantity: 1,
                    }];
                return (
                  <div className="space-y-3">
                    {items.map((it, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-teal-50 border border-gray-100 flex items-center justify-center shrink-0">
                          {it.image_url ? (
                            <img src={it.image_url} alt={it.service_name || "Service"} className="w-full h-full object-cover" />
                          ) : (
                            <Scissors size={22} className="text-teal-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 truncate">{it.service_name || "Service"}</p>
                          {it.category_name && <p className="text-xs text-gray-500 truncate">{it.category_name}</p>}
                          {it.person_name && <p className="text-[11px] text-gray-400 mt-0.5">For: {it.person_name}</p>}
                        </div>
                        {it.quantity != null && (
                          <span className="shrink-0 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg px-2.5 py-1">
                            Qty {it.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                    {order.UrgencyLevel && order.UrgencyLevel.toLowerCase() !== "standard" && (
                      <span className="inline-block text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{order.UrgencyLevel} Order</span>
                    )}
                  </div>
                );
              })()}

              {/* Cloth / customization / stitching preferences */}
              {(order.ClothDetails || order.CustomizationNotes || order.StitchingPreferences) && (
                <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                  {order.ClothDetails && (
                    <p className="text-sm text-gray-600"><span className="text-gray-400">Cloth: </span>{order.ClothDetails}</p>
                  )}
                  {order.CustomizationNotes && (
                    <p className="text-sm text-gray-600"><span className="text-gray-400">Customization: </span>{order.CustomizationNotes}</p>
                  )}
                  {order.StitchingPreferences && Object.keys(order.StitchingPreferences).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(order.StitchingPreferences)
                        .filter(([, v]) => v != null && v !== "")
                        .map(([k, v]) => (
                          <span key={k} className="text-[11px] bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5 text-gray-600">
                            <span className="text-gray-400">{k.replace(/_/g, " ")}: </span>
                            <span className="font-semibold">{String(v)}</span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Customer's reference images - "this is what I want it to look like" */}
              {Array.isArray(order.ImageReferences) && order.ImageReferences.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Reference Photos from Customer ({order.ImageReferences.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {order.ImageReferences.map((img, i) => {
                      const url = resolveMediaUrl(img);
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:opacity-90 transition-opacity"
                          title="Open full size"
                        >
                          <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Pickup Info */}
            {pickupType && (
              <SectionCard
                icon={Clock}
                title="Pickup Info"
                accent={theme.accent}
                right={
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    pickupType === "scheduled" ? "bg-indigo-100 text-indigo-700" : "bg-teal-100 text-teal-700"
                  }`}>
                    {pickupType === "scheduled" ? "Scheduled" : "Instant"}
                  </span>
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Fact label="Internal Status" value={STATUS_LABELS[order.Status?.toLowerCase()] || order.Status} />
                  {(order.PickupTimeSlot || order.pickup_time_slot) && (
                    <Fact label="Time Slot" value={order.PickupTimeSlot || order.pickup_time_slot} />
                  )}
                  {(order.ScheduledPickupAt || order.scheduled_pickup_at) && (
                    <Fact label="Scheduled For" value={formatDateTime(order.ScheduledPickupAt || order.scheduled_pickup_at)} />
                  )}
                </div>
              </SectionCard>
            )}

            {/* Measurement - always shown; a clear message when none is on file
                (common for orders where measurement is taken at doorstep pickup). */}
            
            <div className="hidden">
              <SectionCard
        
              icon={Ruler}
              title="Measurement"
              accent={theme.accent}
              right={
                !editingMeasurement && !isTailor ? (
                  <button
                    onClick={openMeasurementEditor}
                    className="flex items-center gap-1.5 text-xs font-semibold  text-teal-700 hover:text-teal-800"
                  >
                    <Pencil size={13} /> {order.measurement ? "Edit" : "Add"}
                  </button>
                ) : order.measurement?.profile_name ? (
                  <span className="text-xs font-semibold text-gray-500">{order.measurement.profile_name}</span>
                ) : null
              }
            >
              {editingMeasurement ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { k: "profile_name", label: "Profile Name", type: "text", ph: "e.g. Vivek - Shirt" },
                      { k: "gender", label: "Gender", type: "text", ph: "male / female" },
                      { k: "fit_preference", label: "Fit", type: "text", ph: "slim / regular" },
                      { k: "chest", label: "Chest (in)", type: "number" },
                      { k: "waist", label: "Waist (in)", type: "number" },
                      { k: "hips", label: "Hips (in)", type: "number" },
                      { k: "shoulder", label: "Shoulder (in)", type: "number" },
                      { k: "neck", label: "Neck (in)", type: "number" },
                      { k: "sleeve_length", label: "Sleeve (in)", type: "number" },
                      { k: "inseam", label: "Inseam (in)", type: "number" },
                      { k: "height", label: "Height (in)", type: "number" },
                    ].map(({ k, label, type, ph }) => (
                      <div key={k}>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
                        <input
                          type={type}
                          step={type === "number" ? "0.1" : undefined}
                          placeholder={ph}
                          value={measurementForm[k]}
                          onChange={(e) => setMeasurementForm((f) => ({ ...f, [k]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Notes</label>
                    <textarea
                      rows={2}
                      value={measurementForm.notes}
                      onChange={(e) => setMeasurementForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Any special measurement notes…"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <ActionButton label="Cancel" variant="secondary" onClick={() => setEditingMeasurement(false)} />
                    <ActionButton label={savingMeasurement ? "Saving…" : "Save Measurements"} onClick={saveMeasurement} disabled={savingMeasurement} />
                  </div>
                </div>
              ) : order.measurement ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Fact label="Gender" value={order.measurement.gender} />
                    <Fact label="Fit" value={order.measurement.fit_preference} />
                    <Fact label="Neck" value={order.measurement.neck ? `${order.measurement.neck} in` : null} />
                    <Fact label="Chest" value={order.measurement.chest ? `${order.measurement.chest} in` : null} />
                    <Fact label="Waist" value={order.measurement.waist ? `${order.measurement.waist} in` : null} />
                    <Fact label="Hips" value={order.measurement.hips ? `${order.measurement.hips} in` : null} />
                    <Fact label="Shoulder" value={order.measurement.shoulder ? `${order.measurement.shoulder} in` : null} />
                    <Fact label="Sleeve Length" value={order.measurement.sleeve_length ? `${order.measurement.sleeve_length} in` : null} />
                    <Fact label="Inseam" value={order.measurement.inseam ? `${order.measurement.inseam} in` : null} />
                    <Fact label="Height" value={order.measurement.height ? `${order.measurement.height} in` : null} />
                  </div>
                  {order.measurement.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.measurement.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-3">
                  <Ruler size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">No measurements on file yet</p>
                    <p className="text-xs text-amber-700/80 mt-0.5">
                      The customer chose to have measurements taken at doorstep pickup, or hasn&apos;t added them yet.
                      {!isTailor && <> Use <span className="font-semibold">Add</span> above to record them manually.</>}
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>


            {/* Notes */}
            <SectionCard
              icon={FileText}
              title="Notes"
              accent={theme.accent}
              right={
                !editingNotes ? (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                ) : null
              }
            >
              {editingNotes ? (
                <div className="space-y-4">
                  {[
                    { key: "description", label: "Description", ph: "Order description…" },
                    { key: "customization_notes", label: "Customization Notes", ph: "Customization details…" },
                    { key: "fabric_notes", label: "Fabric Notes", ph: "Fabric-specific notes…" },
                  ].map(({ key, label, ph }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
                      <textarea
                        rows={2}
                        placeholder={ph}
                        value={notesForm[key]}
                        onChange={(e) => setNotesForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none bg-gray-50 focus:bg-white transition-colors"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end gap-2">
                    <ActionButton label="Cancel" variant="secondary" onClick={() => {
                      setEditingNotes(false);
                      setNotesForm({
                        description: order.Description || "",
                        customization_notes: order.CustomizationNotes || "",
                        fabric_notes: order.FabricNotes || "",
                      });
                    }} />
                    <ActionButton label={actionLoading ? "Saving…" : "Save Notes"} onClick={saveNotes} disabled={actionLoading} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Description", value: order.Description },
                    { label: "Customization Notes", value: order.CustomizationNotes },
                    { label: "Fabric Notes", value: order.FabricNotes },
                  ].filter((n) => n.value).map((n) => (
                    <div key={n.label}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{n.label}</p>
                      <p className="mt-0.5 text-sm text-gray-700 whitespace-pre-wrap">{n.value}</p>
                    </div>
                  ))}
                  {!order.Description && !order.CustomizationNotes && !order.FabricNotes && (
                    <p className="text-sm text-gray-400">No notes added yet. Click <span className="font-semibold text-teal-700">Edit</span> to add order, customization or fabric notes.</p>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Progress Photos */}
            {(photos.length > 0 || currentRole === ROLES.TAILOR || photosError) && (
              <SectionCard
                icon={Camera}
                title="Progress Photos"
                accent={theme.accent}
                right={photosError ? null : <span className="text-xs text-gray-400">{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>}
              >
                {photosError && (
                  <div className="mb-4 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
                    <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-800">{photosError}</p>
                      <button
                        onClick={() => {
                          setPhotosError("");
                          api.get(`/orders/${order.Id}/photos`)
                            .then((r) => {
                              setPhotos(r.data || []);
                              setPhotosError("");
                            })
                            .catch((err) => {
                              setPhotosError(extractErrorMessage(err, "Failed to load photos."));
                            });
                        }}
                        className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                {currentRole === ROLES.TAILOR && (
                  <div className="mb-4">
                    {PHOTO_UPLOAD_STAGES.has((order?.Status || "").toLowerCase()) ? (
                      <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm font-semibold cursor-pointer transition-colors ${
                        uploadingPhoto
                          ? "border-gray-200 text-gray-400"
                          : "border-teal-200 text-teal-700 hover:bg-teal-50"
                      }`}>
                        {uploadingPhoto ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                        {uploadingPhoto ? "Uploading…" : "Upload Progress Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Uploading is only available while this order is Stitching Started, In Progress, or Final Check.
                      </p>
                    )}
                    {photoUploadError && (
                      <p className="text-xs text-rose-600 mt-1.5">{photoUploadError}</p>
                    )}
                  </div>
                )}
                {!photosError && (
                  photos.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No progress photos uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((p, i) => {
                        const url = resolveMediaUrl(p.photo_url || p.PhotoUrl || p.url);
                        return (
                          <a
                            key={p.id || i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block aspect-square rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity bg-gray-50 relative"
                          >
                            <img src={url} alt={`Progress ${i + 1}`} className="w-full h-full object-cover" />
                            {(p.stage || p.Stage) && (
                              <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
                                {(p.stage || p.Stage).replace(/_/g, " ")}
                              </span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )
                )}
              </SectionCard>
            )}

            {/* Order Tracking Timeline */}
            {(timelineEvents.length > 0 || trackingError) && (
              <SectionCard icon={Activity} title="Order Timeline" accent={theme.accent}>
                {trackingError ? (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">{trackingError}</p>
                      <button
                        onClick={() => {
                          setTrackingError("");
                          api.get(`/orders/${order.Id}/tracking`)
                            .then((r) => {
                              setTracking(r.data);
                              setTrackingError("");
                            })
                            .catch((err) => {
                              setTrackingError(extractErrorMessage(err, "Failed to load tracking info."));
                            });
                        }}
                        className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-100" />
                    {timelineEvents.map((m, i) => {
                      const done = m.completed || m.is_completed || Boolean(m.completed_at || m.timestamp);
                      return (
                        <div key={i} className="relative mb-4 last:mb-0">
                          <div className={`absolute -left-4 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            done ? "bg-teal-600 border-teal-600" : "bg-white border-gray-200"
                          }`}>
                            {done && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <p className={`text-xs font-bold ${done ? "text-gray-800" : "text-gray-400"}`}>
                            {m.label || m.title || m.status?.replace(/_/g, " ")}
                          </p>
                          {(m.completed_at || m.timestamp) && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatDateTime(m.completed_at || m.timestamp)}
                            </p>
                          )}
                          {m.note && (
                            <p className="text-[11px] text-gray-500 mt-0.5 italic">{m.note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Broadcast Monitor */}
            {broadcasts && (
              <SectionCard
                icon={Radio}
                title="Broadcast Monitor"
                accent="border-sky-300"
                right={<span className="text-xs text-gray-400 italic">Auto-refreshes every 15s</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 text-left border-b border-gray-100">
                        <th className="pb-2 pr-3">Tailor ID</th>
                        <th className="pb-2 pr-3">Round</th>
                        <th className="pb-2 pr-3">Status</th>
                        <th className="pb-2 pr-3">Notified</th>
                        <th className="pb-2">Expires</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(broadcasts.broadcasts || []).map((bc) => (
                        <tr key={bc.id} className="text-gray-700">
                          <td className="py-1.5 pr-3 font-mono">{bc.tailor_id}</td>
                          <td className="py-1.5 pr-3">
                            {bc.round >= 4 ? (
                              <span className="text-amber-600 font-semibold">R4 · All Areas</span>
                            ) : (
                              `R${bc.round}`
                            )}
                          </td>
                          <td className="py-1.5 pr-3">
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                              bc.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                              bc.status === "declined" ? "bg-rose-100 text-rose-600" :
                              bc.status === "expired"  ? "bg-gray-100 text-gray-500" :
                              "bg-sky-100 text-sky-700"
                            }`}>
                              {bc.status}
                            </span>
                          </td>
                          <td className="py-1.5 pr-3 text-gray-400">
                            {bc.notified_at ? new Date(bc.notified_at).toLocaleTimeString() : "-"}
                          </td>
                          <td className="py-1.5 text-gray-400">
                            {bc.expires_at ? new Date(bc.expires_at).toLocaleTimeString() : "-"}
                          </td>
                        </tr>
                      ))}
                      {(broadcasts.broadcasts || []).length === 0 && (
                        <tr><td colSpan={5} className="py-3 text-center text-gray-400 italic">No broadcasts yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </div>

          {/* ── Right: sticky summary + actions ────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-20">

            {msg && (
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold ${
                  msg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {msg.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-500 shrink-0" />
                )}
                <span className="leading-snug">{msg.text}</span>
              </div>
            )}

            {currentRole === ROLES.EMPLOYEE && order.Status === ORDER_STATUS.READY_FOR_DISPATCH && (
              <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 border-2 bg-teal-50 border-teal-200 text-teal-800 text-sm">
                <Bike size={18} className="text-teal-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Ready for dispatch</p>
                  <p className="text-xs mt-0.5 text-teal-700">
                    This order is now waiting to be claimed as a delivery offer. Accept it from the Deliveries screen in the mobile admin app (web doesn't have this screen yet).
                  </p>
                </div>
              </div>
            )}

            {/* Workflow Actions - highest-frequency controls, kept near the
                top of the sticky sidebar rather than at the bottom of a long
                page. */}
            <SectionCard
              icon={Clock}
              title="Workflow Actions"
              accent={theme.accent}
              right={actionLoading ? <Loader2 size={14} className="animate-spin text-teal-500" /> : null}
            >
              {availableActions.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No further actions available{currentRole ? ` for role "${currentRole}"` : ""}.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {availableActions.map((action) => (
                    <div key={action.id}>
                      <ActionButton
                        label={action.label}
                        onClick={() => executeAction(action)}
                        disabled={actionLoading || Boolean(action.disabledReason)}
                        variant={action.group === "danger" ? "danger" : action.group === "secondary" ? "secondary" : "primary"}
                        full
                      />
                      {action.disabledReason && (
                        <p className="text-[11px] text-amber-600 mt-1">{action.disabledReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Payment */}
            <SectionCard icon={CreditCard} title="Payment" accent={theme.accent}>
              <div className="grid grid-cols-2 gap-4">
                <Fact label="Total" value={order.AmountDisplay} emphasis />
                <Fact label="Balance" value={order.RemainingAmountDisplay} emphasis={Number(order.RemainingAmount) > 0} />
                <Fact label="Advance" value={order.BookingAmount ? formatCurrency(order.BookingAmount) : null} />
                <Fact label="Status" value={order.PaymentStatusLabel || order.PaymentStatus} />
              </div>
              {order.SettlementStatus && (
                <p className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  Settlement: <span className="font-semibold text-gray-700">{order.SettlementStatus}</span>
                </p>
              )}
            </SectionCard>

            {/* Customer & Address */}
            <SectionCard icon={MapPin} title="Delivery Address" accent={theme.accent}>
              <div className="space-y-2.5">
                {order.address?.full_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800">{order.address.full_name}</span>
                  </div>
                )}
                {order.address?.mobile && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span className="text-gray-600">{order.address.mobile}</span>
                  </div>
                )}
                {(() => {
                  const a = order.address || {};
                  // Backend (AddressResponseSchema) uses snake_case with the
                  // trailing "_1"/"_2" - the old code read address_line1 (no
                  // underscore) so the street never rendered. Build the full
                  // address from every available part.
                  const line1 = a.address_line_1 || a.address_line1 || a.AddressLine1;
                  const line2 = a.address_line_2 || a.address_line2 || a.AddressLine2;
                  const landmark = a.landmark || a.Landmark;
                  const cityStatePin = [a.city || a.City, a.state || a.State, a.pincode || a.Pincode]
                    .filter(Boolean).join(", ");
                  const type = a.address_type || a.AddressType;
                  const hasAny = line1 || line2 || landmark || cityStatePin;
                  if (!hasAny) {
                    return <p className="text-sm text-gray-400">No delivery address on file.</p>;
                  }
                  return (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-gray-600 leading-relaxed">
                        {line1 && <>{line1}<br /></>}
                        {line2 && <>{line2}<br /></>}
                        {landmark && <span className="text-gray-500">Near {landmark}<br /></span>}
                        {cityStatePin && <span className="font-medium text-gray-700">{cityStatePin}</span>}
                        {type && (
                          <span className="ml-2 inline-block text-[10px] font-bold uppercase text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">{type}</span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </SectionCard>

            {/* Tailor Assignment */}
            <SectionCard icon={Scissors} title="Tailor Assignment" accent={theme.accent}>
              {order.NeedsManualAssignment && (
                <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2.5 rounded-lg text-xs font-semibold">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>
                    No tailor accepted this order after every broadcast round, including the
                    all-tailor fallback. Retry the broadcast or assign a tailor manually below.
                    {order.BroadcastExhaustedAt && (
                      <span className="block font-normal text-rose-600 mt-0.5">
                        Broadcast exhausted {new Date(order.BroadcastExhaustedAt).toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              )}
              {(order.NeedsManualAssignment ||
                ["searching_tailor", "broadcasted"].includes(status)) && (
                <ActionButton
                  label={
                    <>
                      <RefreshCw size={15} className={actionLoading ? "animate-spin" : undefined} />
                      {actionLoading ? "Re-triggering…" : "Re-trigger Broadcast"}
                    </>
                  }
                  onClick={triggerBroadcast}
                  disabled={actionLoading}
                  variant="secondary"
                  full
                />
              )}
              <Fact
                label="Assigned Tailor"
                value={
                  order.TailorId
                    ? order.TailorName
                      ? `${order.TailorName} (#${order.TailorId})`
                      : `#${order.TailorId}`
                    : "Not assigned"
                }
              />
              {!["delivered", "cancelled", "order_rejected"].includes(status) && (
                <div className="mt-4 flex flex-col gap-2">
                  <select
                    value={selectedTailorId}
                    onChange={(e) => setSelectedTailorId(e.target.value)}
                    onFocus={loadTailors}
                    onMouseDown={loadTailors}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="">
                      {tailorsLoaded ? "Select Tailor…" : "Select Tailor… (tap to load)"}
                    </option>
                    {tailors
                      .filter((t) => t.is_available)
                      .map((t) => (
                        <option key={t.tailor_id} value={t.tailor_id}>
                          {t.full_name} (#{t.tailor_id})
                        </option>
                      ))}
                  </select>
                  {tailorsLoaded && tailors.length > 0 && tailors.every((t) => !t.is_available) && (
                    <span className="text-xs text-amber-600">
                      All tailors are currently busy - none are available for manual assignment.
                    </span>
                  )}
                  <ActionButton
                    label={actionLoading ? "Assigning…" : "Assign"}
                    onClick={assignTailor}
                    disabled={!selectedTailorId || actionLoading}
                    full
                  />
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Action input modal - for actions requiring structured input (schedule pickup, collect payment, assign tailor) */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-gray-800 mb-3">{pendingAction.label}</h3>
            <div className="space-y-3">
              {pendingAction.requiresReason && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Reason</label>
                  <textarea
                    rows={3}
                    autoFocus
                    placeholder={`Why are you ${pendingAction.label.toLowerCase()}ing this order?`}
                    value={actionInput.reason ?? ""}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                    onChange={(e) => setActionInput((p) => ({ ...p, reason: e.target.value }))}
                  />
                </div>
              )}
              {pendingAction.requiresInput?.includes("scheduled_pickup_at") && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Scheduled Pickup At</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                    onChange={(e) => setActionInput((p) => ({ ...p, scheduled_pickup_at: e.target.value }))}
                  />
                </div>
              )}
              {pendingAction.requiresInput?.includes("pickup_time_slot") && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 10am-12pm"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                    onChange={(e) => setActionInput((p) => ({ ...p, pickup_time_slot: e.target.value }))}
                  />
                </div>
              )}
              {pendingAction.requiresInput?.includes("tailor_id") && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Tailor</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                    onChange={(e) => setActionInput((p) => ({ ...p, tailor_id: e.target.value }))}
                  >
                    <option value="">Select Tailor…</option>
                    {tailors.map((t) => (
                      <option key={t.tailor_id} value={t.tailor_id}>{t.full_name} (#{t.tailor_id})</option>
                    ))}
                  </select>
                </div>
              )}
              {pendingAction.requiresInput?.includes("method") && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Payment Method</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                    onChange={(e) => setActionInput((p) => ({ ...p, method: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    <option value="cash">Cash</option>
                    <option value="qr">QR</option>
                  </select>
                </div>
              )}
              {pendingAction.requiresInput?.includes("amount") && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">
                    Amount {order.RemainingAmount ? `(balance ₹${order.RemainingAmount})` : ""}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={actionInput.amount ?? ""}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                    onChange={(e) => setActionInput((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={pendingAction.requiresReason && !actionInput.reason?.trim()}
                onClick={() => {
                  const action = pendingAction;
                  const input = actionInput;
                  setPendingAction(null);
                  executeAction(action, { ...input, __confirmed: true });
                }}
                className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
