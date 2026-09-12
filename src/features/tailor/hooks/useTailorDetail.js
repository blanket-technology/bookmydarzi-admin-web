import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatDateTime } from "../../../utils/formatters.js";
import { formFromData, validators } from "../utils/tailorUtils.js";
import { confirmDialog, notifyError, notifySuccess } from "../../../services/dialogService.js";
import { useTailorDetailStore } from "../store/tailorDetailStore.js";

export default function useTailorDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeTailorId } = useParams();
  const raw = { ...(location.state || {}), tailorId: routeTailorId };
  const tailorData = raw.tailor || {};

  const liveData = useTailorDetailStore((s) => s.liveData);
  const form = useTailorDetailStore((s) => s.form);
  const profileFetchError = useTailorDetailStore((s) => s.profileFetchError);
  const orders = useTailorDetailStore((s) => s.orders);
  const ordersTotal = useTailorDetailStore((s) => s.ordersTotal);
  const ordersLoading = useTailorDetailStore((s) => s.ordersLoading);
  const ordersPage = useTailorDetailStore((s) => s.ordersPage);
  const ordersLimit = useTailorDetailStore((s) => s.ordersLimit);
  const ordersStatus = useTailorDetailStore((s) => s.ordersStatus);
  const workload = useTailorDetailStore((s) => s.workload);
  const workloadLoading = useTailorDetailStore((s) => s.workloadLoading);
  const kycUrls = useTailorDetailStore((s) => s.kycUrls);
  const saving = useTailorDetailStore((s) => s.saving);
  const verifying = useTailorDetailStore((s) => s.verifying);

  const setForm = useTailorDetailStore((s) => s.setForm);
  const setProfileFetchError = useTailorDetailStore((s) => s.setProfileFetchError);
  const setOrdersPage = useTailorDetailStore((s) => s.setOrdersPage);
  const setOrdersLimit = useTailorDetailStore((s) => s.setOrdersLimit);
  const setOrdersStatus = useTailorDetailStore((s) => s.setOrdersStatus);
  const fetchProfile = useTailorDetailStore((s) => s.fetchProfile);
  const fetchOrders = useTailorDetailStore((s) => s.fetchOrders);
  const fetchWorkload = useTailorDetailStore((s) => s.fetchWorkload);
  const saveProfile = useTailorDetailStore((s) => s.saveProfile);
  const toggleVerification = useTailorDetailStore((s) => s.toggleVerification);
  const deleteTailorProfile = useTailorDetailStore((s) => s.deleteTailorProfile);
  const deleteKycDoc = useTailorDetailStore((s) => s.deleteKycDoc);
  const getProductionCounts = useTailorDetailStore((s) => s.getProductionCounts);

  const [activeTab, setActiveTab] = useState("overview");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [kycFiles, setKycFiles] = useState({ aadhar: null, pan_card: null, other: null });
  const [kycUploading, setKycUploading] = useState({ aadhar: false, pan_card: false, other: false });
  const [viewing, setViewing] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadedTailorId = useRef(null);
  const tailorId = liveData.tailor_id || raw.tailorId || "T-0001";

  useEffect(() => {
    const incoming = tailorData?.tailor_id ?? raw.tailorId;
    if (incoming && incoming !== loadedTailorId.current) {
      loadedTailorId.current = incoming;
      useTailorDetailStore.setState({
        liveData: tailorData,
        form: formFromData(tailorData),
        kycUrls: {
          aadhar: tailorData.aadhar_url || null,
          pan_card: tailorData.pan_card_url || null,
          other: tailorData.other_doc_url || null,
        },
      });
    }
  }, [location.state, tailorData, raw.tailorId]);

  const fetchTailorProfile = useCallback(() => {
    const tid = tailorData?.tailor_id ?? raw.tailorId;
    if (tid) fetchProfile(tid, tailorData);
  }, [tailorData, raw.tailorId, fetchProfile]);

  useEffect(() => {
    fetchTailorProfile();
  }, [fetchTailorProfile]);

  useEffect(() => {
    if (tailorId) fetchOrders(tailorId);
  }, [tailorId, ordersPage, ordersLimit, ordersStatus, fetchOrders]);

  useEffect(() => {
    if (tailorId) fetchWorkload(tailorId);
  }, [tailorId, fetchWorkload]);

  const productionCounts = getProductionCounts();
  const kycCount = Object.values(kycUrls).filter(Boolean).length + Object.values(kycFiles).filter(Boolean).length;

  const timelineEvents = useMemo(() => {
    return orders
      .filter((o) => o.CreatedAt)
      .map((o) => ({
        id: `order-${o.Id}`,
        type: "order",
        at: o.CreatedAt,
        atLabel: formatDateTime(o.CreatedAt),
        title: `Order ${o.OrderCode || `#${o.Id}`}`,
        subtitle: o.StatusLabel || o.Status,
        onClick: () => navigate(`/orders/${o.Id}`, { state: { order: o } }),
      }))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [orders, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (touched[name]) setErrors((p) => ({ ...p, [name]: validators[name]?.(value) || "" }));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors((p) => ({ ...p, [name]: validators[name]?.(value) || "" }));
  };

  const validateAll = () => {
    const e = {};
    const t = {};
    ["full_name", "email", "mobile"].forEach((k) => {
      t[k] = true;
      e[k] = validators[k]?.(form[k]) || "";
    });
    setTouched((p) => ({ ...p, ...t }));
    setErrors((p) => ({ ...p, ...e }));
    return Object.values(e).every((v) => v === "");
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    const tid = liveData.tailor_id || raw.tailorId;
    if (!tid) {
      setSaveMsg("No tailor ID found - cannot save.");
      return;
    }
    const result = await saveProfile({ tailorId: tid, form, kycFiles, photo, liveData });
    if (result.ok) {
      setPhoto(null);
      setKycFiles({ aadhar: null, pan_card: null, other: null });
      setSaveMsg("success");
      setEditMode(false);
      setTimeout(() => setSaveMsg(null), 4000);
    } else {
      setSaveMsg(result.error);
    }
  };

  const handleToggleVerification = async () => {
    const tid = liveData.tailor_id || raw.tailorId;
    if (!tid) return;
    setVerifyMsg(null);
    const result = await toggleVerification(tid, liveData.is_approved);
    if (!result.ok) setVerifyMsg(result.error);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const tid = liveData.tailor_id || raw.tailorId;
    const result = await deleteTailorProfile(tid);
    if (!result.ok) {
      notifyError(result.error || "Failed to delete tailor.");
      return;
    }
    navigate(-1);
  };

  const onDeleteKyc = async (key) => {
    if (!kycUrls[key]) return;
    if (!(await confirmDialog({
      title: "Delete this document?",
      description: "This permanently removes the uploaded file.",
      confirmLabel: "Yes, Delete",
      tone: "danger",
    }))) return;
    const tid = liveData.tailor_id || raw.tailorId;
    setKycUploading((p) => ({ ...p, [key]: true }));
    try {
      await deleteKycDoc(tid, key);
    } catch (err) {
      notifyError(err.message || "Failed to delete document.");
    } finally {
      setKycUploading((p) => ({ ...p, [key]: false }));
    }
  };

  const reset = () => {
    setForm(formFromData(liveData));
    setKycFiles({ aadhar: null, pan_card: null, other: null });
    setErrors({});
    setTouched({});
  };

  return {
    navigate,
    raw,
    tailorId,
    liveData,
    form,
    activeTab,
    setActiveTab,
    errors,
    touched,
    editMode,
    setEditMode,
    photo,
    setPhoto,
    verifying,
    verifyMsg,
    kycFiles,
    setKycFiles,
    kycUploading,
    kycUrls,
    kycCount,
    viewing,
    setViewing,
    saveMsg,
    setSaveMsg,
    showDeleteConfirm,
    setShowDeleteConfirm,
    profileFetchError,
    setProfileFetchError,
    orders,
    ordersTotal,
    ordersLoading,
    ordersPage,
    ordersLimit,
    ordersStatus,
    setOrdersPage,
    setOrdersLimit,
    setOrdersStatus,
    workload,
    workloadLoading,
    productionCounts,
    timelineEvents,
    saving,
    onChange,
    onBlur,
    handleSave,
    handleToggleVerification,
    handleDelete,
    onDeleteKyc,
    reset,
    fetchTailorProfile,
    fetchOrders: () => fetchOrders(tailorId),
    goToTab: setActiveTab,
    handleEdit: () => {
      setEditMode(true);
      setSaveMsg(null);
    },
    handleCancel: () => {
      setEditMode(false);
      setErrors({});
      setTouched({});
      setSaveMsg(null);
      reset();
    },
    handleResetPassword: () => notifySuccess("Password reset link sent successfully."),
    onPickFile: (key, file) => setKycFiles((p) => ({ ...p, [key]: file })),
    onClearPending: (key) => setKycFiles((p) => ({ ...p, [key]: null })),
    onView: (key) => {
      const f = kycFiles[key];
      const u = kycUrls[key];
      if (f || u) setViewing({ file: f || null, url: f ? null : u });
    },
  };
}
