import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage, formatCurrency, formatDate } from "../../../utils/formatters.js";
import { confirmDialog, notifyError } from "../../../services/dialogService.js";
import { useUserDetailStore } from "../store/userDetailStore.js";
import {
  buildTimelineEvents,
  computeLifetimeSpend,
  countOrdersByStatus,
  getFullDetailOrDefault,
} from "../utils/userDetailUtils.js";
import {
  fetchCustomerFullDetail,
  fetchUserAuditLogs,
  fetchUserById,
  fetchUserOrders,
  requestPasswordReset,
  updateUserStatus,
  deleteUser,
  resolveChatSession,
} from "../services/userDetailService.js";
import { History, Package, CreditCard, LifeBuoy, MapPin, Ruler, AlertTriangle } from "lucide-react";

export default function useUserDetail() {
  const navigate = useNavigate();
  const { id: userId } = useParams();
  const queryClient = useQueryClient();

  const activeTab = useUserDetailStore((s) => s.activeTab);
  const ordersPage = useUserDetailStore((s) => s.ordersPage);
  const ordersLimit = useUserDetailStore((s) => s.ordersLimit);
  const ordersStatus = useUserDetailStore((s) => s.ordersStatus);
  const setActiveTab = useUserDetailStore((s) => s.setActiveTab);
  const setOrdersPage = useUserDetailStore((s) => s.setOrdersPage);
  const setOrdersLimit = useUserDetailStore((s) => s.setOrdersLimit);
  const setOrdersStatus = useUserDetailStore((s) => s.setOrdersStatus);
  const setShowDeleteConfirm = useUserDetailStore((s) => s.setShowDeleteConfirm);
  const setResetMsg = useUserDetailStore((s) => s.setResetMsg);

  const [viewPaymentOrderId, setViewPaymentOrderId] = useState(null);
  const [viewTicketId, setViewTicketId] = useState(null);
  const [viewChatSession, setViewChatSession] = useState(null);
  const [viewCancellationId, setViewCancellationId] = useState(null);
  const [viewFact, setViewFact] = useState(null);

  const userQuery = useQuery({
    queryKey: ["user", { userId }],
    queryFn: () => fetchUserById(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  // Overview's KPI row (Total/Active/Completed/Cancelled order counts) and the
  // "Orders" summary card (first order + total) are computed from a bounded set
  // of recent orders - the SAME 10 the page already used as its first page, so
  // behaviour is unchanged. The server returns the true `total` (a COUNT,
  // independent of limit) for the "Total Orders" KPI. This is the only orders
  // fetch on mount; the full paginated list below is deferred to the Orders tab.
  const ordersOverviewQuery = useQuery({
    queryKey: ["userOrdersOverview", { userId }],
    queryFn: () => fetchUserOrders(userId, { page: 1, limit: 10, status: "" }),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  // The full paginated order list is only shown on the Orders tab - fetch it
  // lazily the first time that tab is opened. Cached afterwards so tab switches
  // don't refetch. placeholderData keeps the previous page during pagination.
  const ordersQuery = useQuery({
    queryKey: ["userOrders", { userId, page: ordersPage, limit: ordersLimit, status: ordersStatus }],
    queryFn: () => fetchUserOrders(userId, { page: ordersPage, limit: ordersLimit, status: ordersStatus }),
    enabled: Boolean(userId) && activeTab === "orders",
    placeholderData: (prev) => prev, // v5: retain last page while refetching (was dead keepPreviousData)
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  // Audit logs feed ONLY the Activity-tab timeline (not Overview), so fetch
  // them lazily the first time Activity is opened, not on mount. Once loaded
  // they stay cached (staleTime), so switching tabs doesn't refetch.
  const auditQuery = useQuery({
    queryKey: ["userAudit", { userId }],
    queryFn: () => fetchUserAuditLogs(userId),
    enabled: Boolean(userId) && activeTab === "activity",
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const fullDetailQuery = useQuery({
    queryKey: ["userFullDetail", { userId }],
    queryFn: () => fetchCustomerFullDetail(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!userId) {
      navigate("/users");
    }
  }, [userId, navigate]);

  const user = userQuery.data ?? null;
  const loading = userQuery.isLoading;
  const error = userQuery.isError ? extractErrorMessage(userQuery.error, "Failed to load user.") : "";

  // Overview: recent-orders set (bounded) drives the KPI counts + summary card.
  const overviewOrders = ordersOverviewQuery.data?.orders ?? [];
  const ordersTotal = ordersOverviewQuery.data?.total ?? 0;

  // Orders TAB: the full paginated list (lazy). Falls back to the overview set
  // before the tab has been opened so nothing renders empty if referenced early.
  const orders = ordersQuery.data?.orders ?? overviewOrders;
  // Only "loading" while the tab query is actually fetching (a disabled query
  // reports isLoading=true in v5, which would wrongly show a spinner).
  const ordersLoading = ordersQuery.isFetching && ordersQuery.data === undefined;

  const auditLogs = auditQuery.data ?? [];
  const auditLoading = auditQuery.isFetching && auditQuery.data === undefined;

  const fullDetail = fullDetailQuery.data ?? null;
  const fullDetailLoading = fullDetailQuery.isLoading;
  const fullDetailError = fullDetailQuery.isError ? extractErrorMessage(fullDetailQuery.error, "Failed to load customer details.") : "";

  const fd = getFullDetailOrDefault(fullDetail);
  const lifetimeSpend = computeLifetimeSpend(fd.payments);
  // Status-count KPIs come from the bounded overview set (unchanged behaviour -
  // the page previously counted its first 10 orders here too).
  const { activeOrdersCount, completedOrdersCount, cancelledOrdersCount } = countOrdersByStatus(overviewOrders);

  const timelineEvents = useMemo(
    () =>
      buildTimelineEvents({
        auditLogs,
        orders: overviewOrders,
        payments: fd.payments.items,
        supportTickets: fd.support_tickets.items,
        navigate,
        onPaymentClick: setViewPaymentOrderId,
        onTicketClick: setViewTicketId,
      }),
    [auditLogs, overviewOrders, fd.payments.items, fd.support_tickets.items, navigate]
  );

  const EVENT_ICON = { audit: History, order: Package, payment: CreditCard, support: LifeBuoy };

  const openPayment = (p) => p.order_id && setViewPaymentOrderId(p.order_id);
  const openAddress = (a) =>
    setViewFact({
      icon: MapPin,
      title: a.full_name || "Address",
      subtitle: a.address_type,
      facts: [
        { label: "Recipient", value: a.full_name },
        { label: "Mobile", value: a.mobile },
        { label: "Address", value: [a.address_line_1, a.address_line_2, a.landmark].filter(Boolean).join(", ") },
        { label: "City", value: a.city },
        { label: "State", value: a.state },
        { label: "Pincode", value: a.pincode },
        { label: "Type", value: a.address_type },
        { label: "Default", value: a.is_default ? "Yes" : "No" },
      ],
    });
  const openMeasurement = (m) =>
    setViewFact({
      icon: Ruler,
      title: m.profile_name || "Measurement Profile",
      subtitle: m.gender,
      facts: [
        { label: "Gender", value: m.gender },
        { label: "Chest", value: m.chest },
        { label: "Waist", value: m.waist },
        { label: "Hips", value: m.hips },
        { label: "Height", value: m.height },
        { label: "Shoulder", value: m.shoulder },
        { label: "Sleeve Length", value: m.sleeve_length },
        { label: "Inseam", value: m.inseam },
        { label: "Fit Preference", value: m.fit_preference },
        { label: "Default", value: m.is_default ? "Yes" : "No" },
        { label: "Updated", value: m.updated_at ? formatDate(m.updated_at) : null },
      ],
    });
  const openPenalty = (p) =>
    setViewFact({
      icon: AlertTriangle,
      title: `Penalty ${p.id ? `#${p.id}` : ""}`.trim(),
      subtitle: p.reason,
      facts: [
        { label: "Amount", value: formatCurrency(p.penalty_amount) },
        { label: "Reason", value: p.reason },
        { label: "Status", value: p.is_applied ? "Applied" : "Pending" },
        { label: "Order", value: p.order_id ? `#${p.order_id}` : null },
        { label: "Created", value: p.created_at ? formatDate(p.created_at) : null },
      ],
    });

  const handleReset = async () => {
    try {
      await requestPasswordReset(user?.Email);
      setResetMsg({ type: "success", text: "Password reset email sent." });
    } catch (err) {
      setResetMsg({ type: "error", text: extractErrorMessage(err, "Failed to send reset email.") });
    }
  };

  const handleToggle = async () => {
    if (!user) return;
    const action = user.IsActive ? "deactivate" : "activate";
    const nextIsActive = !user.IsActive;

    queryClient.setQueryData(["user", { userId }], (prev) =>
      prev ? { ...prev, IsActive: nextIsActive } : prev
    );

    try {
      await updateUserStatus(user.Id, action);
      queryClient.invalidateQueries({ queryKey: ["user", { userId }] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userOrdersOverview", { userId }] });
    } catch (err) {
      queryClient.setQueryData(["user", { userId }], (prev) =>
        prev ? { ...prev, IsActive: user.IsActive } : prev
      );
      notifyError(extractErrorMessage(err, "Status update failed."));
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUser(user.Id);
      queryClient.removeQueries({ queryKey: ["user", { userId }] });
      queryClient.removeQueries({ queryKey: ["userFullDetail", { userId }] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/users");
    } catch (err) {
      notifyError(extractErrorMessage(err, "Delete failed."));
    }
  };

  const handleResolveChat = async (uuid) => {
    if (!(await confirmDialog({
      title: "Mark conversation as resolved?",
      description: "This closes out the conversation as resolved.",
      confirmLabel: "Yes, Resolve",
      tone: "neutral",
    }))) return;
    try {
      await resolveChatSession(uuid);
      setViewChatSession(null);
      queryClient.invalidateQueries(["userFullDetail", { userId }]);
    } catch (err) {
      notifyError(extractErrorMessage(err, "Resolve failed"));
    }
  };

  return {
    userId,
    navigate,
    user,
    loading,
    error,
    activeTab,
    orders,
    ordersTotal,
    ordersLoading,
    ordersPage,
    ordersLimit,
    ordersStatus,
    auditLogs,
    auditLoading,
    fd,
    fullDetailLoading,
    fullDetailError,
    resetLoading: false,
    resetMsg: null,
    toggling: false,
    showDeleteConfirm: false,
    lifetimeSpend,
    activeOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    timelineEvents,
    EVENT_ICON,
    viewPaymentOrderId,
    viewTicketId,
    viewChatSession,
    viewCancellationId,
    viewFact,
    setActiveTab,
    setOrdersPage,
    setOrdersLimit,
    setOrdersStatus,
    setShowDeleteConfirm,
    setResetMsg,
    fetchOrders: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
      queryClient.invalidateQueries({ queryKey: ["userOrdersOverview", { userId }] });
    },
    fetchAudit: () => queryClient.invalidateQueries(["userAudit", { userId }]),
    fetchFullDetail: () => queryClient.invalidateQueries(["userFullDetail", { userId }]),
    openPayment,
    openAddress,
    openMeasurement,
    openPenalty,
    setViewPaymentOrderId,
    setViewTicketId,
    setViewChatSession,
    setViewCancellationId,
    setViewFact,
    handleReset,
    handleToggle,
    handleDelete,
    handleResolveChat,
  };
}
