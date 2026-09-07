import {
  AlertCircle, Calendar, ShieldCheck, KeyRound, Trash2, Package, History, RefreshCw, ChevronRight,
  MapPin, Ruler, CreditCard, ShoppingCart, LifeBuoy, MessageCircle,
  XCircle, AlertTriangle, UserCircle2, CheckCircle2, X,
} from "lucide-react";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import SectionHeader from "../../../components/common/SectionHeader.jsx";
import {
  WorkspaceHero, HeroActionButton, KpiTile, SkeletonBlock, EmptyState, SummaryCard, Timeline, ConfirmModal,
} from "../../../components/common/EntityWorkspace.jsx";
import PaymentDetailModal from "../../../components/common/PaymentDetailModal.jsx";
import TicketModal from "../../../components/common/TicketModal.jsx";
import CancellationDetailModal from "../../../components/common/CancellationDetailModal.jsx";
import FactDetailModal from "../../../components/common/FactDetailModal.jsx";
import ConversationView from "../../chat/components/ConversationView.jsx";
import { formatEntityId, formatDate, formatDateTime, formatCurrency } from "../../../utils/formatters.js";
import { ORDER_STATUS_OPTIONS, ROLE_LABEL, TABS } from "../constants/userDetailConstants.js";

export default function UserDetailContent({
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
  auditLoading,
  fd,
  fullDetailLoading,
  fullDetailError,
  resetLoading,
  resetMsg,
  toggling,
  showDeleteConfirm,
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
  fetchOrders,
  fetchAudit,
  fetchFullDetail,
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
}) {
  if (!userId) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      {loading ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <SkeletonBlock className="h-24 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} className="h-16" />)}
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
          <ConfirmModal
            open={showDeleteConfirm}
            icon={Trash2}
            title="Delete User?"
            description={
              <>
                <span className="font-semibold text-gray-700">{user.FullName || user.Email}</span>'s account
                will be deactivated and hidden. This can be reversed by support if needed.
              </>
            }
            confirmLabel="Yes, Delete"
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />

          {viewPaymentOrderId && (
            <PaymentDetailModal
              orderId={viewPaymentOrderId}
              orderCode={orders.find((o) => o.Id === viewPaymentOrderId)?.OrderCode}
              onClose={() => setViewPaymentOrderId(null)}
            />
          )}
          {viewTicketId && (
            <TicketModal ticketId={viewTicketId} onClose={() => setViewTicketId(null)} onStatusChanged={() => {}} />
          )}
          {viewChatSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden relative">
                <button
                  onClick={() => setViewChatSession(null)}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/90 hover:bg-gray-100 text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100"
                  aria-label="Close conversation"
                >
                  <X size={18} />
                </button>
                <ConversationView
                  session={viewChatSession}
                  onRefresh={() => {}}
                  onResolve={handleResolveChat}
                  onBack={() => setViewChatSession(null)}
                />
              </div>
            </div>
          )}
          {viewCancellationId && (
            <CancellationDetailModal cancellationId={viewCancellationId} onClose={() => setViewCancellationId(null)} onRefresh={fetchFullDetail} />
          )}
          {viewFact && (
            <FactDetailModal {...viewFact} onClose={() => setViewFact(null)} />
          )}

          <WorkspaceHero
            onBack={() => navigate("/users")}
            avatar={
              <div className="w-20 h-20 rounded-2xl border-2 border-white/30 overflow-hidden bg-teal-600 shrink-0 flex items-center justify-center">
                {user.ProfileImageUrl ? (
                  <img src={user.ProfileImageUrl} alt={user.FullName} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 size={40} className="text-teal-200" />
                )}
              </div>
            }
            title={user.FullName || "-"}
            badges={
              <>
                <StatusBadge status={user.Role?.toLowerCase()} label={ROLE_LABEL[user.Role?.toLowerCase()] ?? user.Role} />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.IsActive ? "bg-teal-400/20 text-teal-100" : "bg-orange-400/20 text-orange-100"}`}>
                  {user.IsActive ? "Active" : "Inactive"}
                </span>
              </>
            }
            metaLine={<>#{formatEntityId(user.Role?.toLowerCase(), user.Id, user.UserCode)} &nbsp;·&nbsp; {user.Email || "-"} &nbsp;·&nbsp; {user.Mobile || "-"}</>}
            factsRow={
              <>
                <span className="flex items-center gap-1.5"><Calendar size={11} /> Joined {user.CreatedAt ? formatDate(user.CreatedAt) : "-"}</span>
                <span className="flex items-center gap-1.5"><History size={11} /> Last login {user.LastLogin ? formatDateTime(user.LastLogin) : "-"}</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={11} />
                  Email {user.IsEmailVerified ? "verified" : "not verified"}
                </span>
              </>
            }
            actions={
              <>
                <HeroActionButton onClick={handleReset} disabled={resetLoading} loading={resetLoading} icon={KeyRound} label="Reset Password" />
                <HeroActionButton
                  onClick={handleToggle} disabled={toggling} loading={toggling}
                  icon={ShieldCheck} label={user.IsActive ? "Deactivate" : "Activate"}
                  tone={user.IsActive ? "warn" : "positive"}
                />
                <HeroActionButton onClick={() => setShowDeleteConfirm(true)} icon={Trash2} label="Delete" tone="danger" />
              </>
            }
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {resetMsg && (
              <div className={`rounded-xl px-4 py-3.5 flex items-center gap-3 border-2 text-sm font-semibold ${
                resetMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
              }`}>
                {resetMsg.type === "success" ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-red-500 shrink-0" />}
                <span className="flex-1">{resetMsg.text}</span>
                <button onClick={() => setResetMsg(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiTile label="Total Orders" value={ordersTotal} />
              <KpiTile label="Lifetime Spend" value={formatCurrency(lifetimeSpend)} />
              <KpiTile label="Active Orders" value={activeOrdersCount} accent="text-blue-600" />
              <KpiTile label="Completed" value={completedOrdersCount} accent="text-emerald-600" />
              <KpiTile label="Cancelled" value={cancelledOrdersCount} accent="text-rose-600" />
              <KpiTile label="Support Tickets" value={fd.support_tickets.total} />
              <KpiTile label="Penalties" value={fd.penalties.total} accent={fd.penalties.total > 0 ? "text-amber-600" : undefined} />
            </div>

            {activeTab === "overview" && (
              fullDetailLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} className="h-32" />)}
                </div>
              ) : fullDetailError ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    <AlertCircle size={16} className="shrink-0" /> {fullDetailError}
                    <button onClick={fetchFullDetail} className="ml-auto underline font-semibold shrink-0">Retry</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard icon={Package} title="Orders" count={ordersTotal} onViewAll={() => setActiveTab("orders")} empty="No orders yet.">
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
                  <SummaryCard icon={CreditCard} title="Payments" count={fd.payments.total} onViewAll={() => setActiveTab("payments")} empty="No payments yet.">
                    {fd.payments.items[0] && (
                      <button onClick={() => openPayment(fd.payments.items[0])} className="block w-full text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <p className="text-sm font-semibold text-gray-800 [font-variant-numeric:tabular-nums]">{formatCurrency(fd.payments.items[0].amount)}</p>
                        <StatusBadge status={fd.payments.items[0].status} label={fd.payments.items[0].status} />
                      </button>
                    )}
                  </SummaryCard>
                  <SummaryCard icon={MapPin} title="Addresses" count={fd.addresses.length} onViewAll={() => setActiveTab("personal")} empty="No saved addresses.">
                    {fd.addresses[0] && (
                      <button onClick={() => openAddress(fd.addresses[0])} className="block w-full text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <p className="text-sm font-semibold text-gray-800 truncate">{fd.addresses[0].full_name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{fd.addresses[0].city || "-"}</p>
                      </button>
                    )}
                  </SummaryCard>
                  <SummaryCard icon={Ruler} title="Measurements" count={fd.measurements.length} onViewAll={() => setActiveTab("personal")} empty="No measurement profiles.">
                    {fd.measurements[0] && (
                      <button onClick={() => openMeasurement(fd.measurements[0])} className="block w-full text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <p className="text-sm font-semibold text-gray-800 truncate">{fd.measurements[0].profile_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fd.measurements[0].gender || "-"}</p>
                      </button>
                    )}
                  </SummaryCard>
                  <SummaryCard icon={LifeBuoy} title="Support" count={fd.support_tickets.total} onViewAll={() => setActiveTab("support")} empty="No support tickets.">
                    {fd.support_tickets.items[0] && (
                      <button onClick={() => setViewTicketId(fd.support_tickets.items[0].id)} className="block w-full text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <p className="text-sm font-semibold text-gray-800 truncate">{fd.support_tickets.items[0].subject || fd.support_tickets.items[0].ticket_code}</p>
                        <StatusBadge status={fd.support_tickets.items[0].status} label={fd.support_tickets.items[0].status} />
                      </button>
                    )}
                  </SummaryCard>
                  <SummaryCard icon={MessageCircle} title="Chat Sessions" count={fd.chat_sessions.total} onViewAll={() => setActiveTab("support")} empty="No chat sessions.">
                    {fd.chat_sessions.items[0] && (
                      <button onClick={() => setViewChatSession(fd.chat_sessions.items[0])} className="block w-full text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <p className="text-sm font-semibold text-gray-800 truncate">{fd.chat_sessions.items[0].issue_category || "General"}</p>
                        <StatusBadge status={fd.chat_sessions.items[0].status} label={fd.chat_sessions.items[0].status} />
                      </button>
                    )}
                  </SummaryCard>
                  <SummaryCard icon={AlertTriangle} title="Penalties" count={fd.penalties.total} onViewAll={() => setActiveTab("payments")} empty="No penalties on record.">
                    {fd.penalties.items[0] && (
                      <button onClick={() => openPenalty(fd.penalties.items[0])} className="block w-full text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors">
                        <p className="text-sm font-semibold text-gray-800 [font-variant-numeric:tabular-nums]">{formatCurrency(fd.penalties.items[0].penalty_amount)}</p>
                        <StatusBadge status={fd.penalties.items[0].is_applied ? "active" : "inactive"} label={fd.penalties.items[0].is_applied ? "Applied" : "Pending"} dot />
                      </button>
                    )}
                  </SummaryCard>
                </div>
              )
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 pb-4">
                  <SectionHeader
                    icon={Package}
                    title="Orders"
                    subtitle={ordersTotal > 0 ? `${ordersTotal} order${ordersTotal !== 1 ? "s" : ""}` : "No orders yet"}
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
                  <EmptyState icon={Package} text={ordersStatus ? "No orders with this status." : "No orders yet."} />
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
                    onLimitChange={setOrdersLimit}
                  />
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={CreditCard} title="Payments" subtitle={`${fd.payments.total} payment${fd.payments.total !== 1 ? "s" : ""}`} />
                  <div className="mt-3">
                    {fullDetailLoading ? (
                      <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}</div>
                    ) : fd.payments.items.length === 0 ? (
                      <EmptyState icon={CreditCard} text="No payments yet." />
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {fd.payments.items.map((p) => (
                          <button key={p.id} onClick={() => openPayment(p)}
                            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.payment_code || `#${p.id}`}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.created_at)} · {p.method || "-"}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-gray-600 [font-variant-numeric:tabular-nums]">{formatCurrency(p.amount)}</span>
                              <StatusBadge status={p.status} label={p.status} />
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={AlertTriangle} title="Penalties" subtitle={`${fd.penalties.total} on record`} />
                  <div className="mt-3">
                    {fd.penalties.items.length === 0 ? (
                      <EmptyState icon={AlertTriangle} text="No penalties on record." />
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {fd.penalties.items.map((p) => (
                          <button key={p.id} onClick={() => openPenalty(p)}
                            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 [font-variant-numeric:tabular-nums]">{formatCurrency(p.penalty_amount)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={p.is_applied ? "active" : "inactive"} label={p.is_applied ? "Applied" : "Pending"} dot />
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={XCircle} title="Cancellations" subtitle={`${fd.cancellations.total} on record`} />
                  <div className="mt-3">
                    {fd.cancellations.items.length === 0 ? (
                      <EmptyState icon={XCircle} text="No cancellations." />
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {fd.cancellations.items.map((c) => (
                          <button key={c.id} onClick={() => setViewCancellationId(c.id)}
                            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{c.cancellation_code || `#${c.id}`}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatDate(c.created_at)} · Penalty {formatCurrency(c.penalty_amount)} · Refund {formatCurrency(c.refund_amount)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={c.status} label={c.status} />
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={LifeBuoy} title="Support Tickets" subtitle={`${fd.support_tickets.total} ticket${fd.support_tickets.total !== 1 ? "s" : ""}`} />
                  <div className="mt-3">
                    {fullDetailLoading ? (
                      <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-10" />)}</div>
                    ) : fd.support_tickets.items.length === 0 ? (
                      <EmptyState icon={LifeBuoy} text="No support tickets." />
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {fd.support_tickets.items.map((t) => (
                          <button key={t.id} onClick={() => setViewTicketId(t.id)}
                            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{t.subject || t.ticket_code}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.created_at)} · {t.category || "-"}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={t.status} label={t.status} />
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={MessageCircle} title="Chat Sessions" subtitle={`${fd.chat_sessions.total} session${fd.chat_sessions.total !== 1 ? "s" : ""}`} />
                  <div className="mt-3">
                    {fd.chat_sessions.items.length === 0 ? (
                      <EmptyState icon={MessageCircle} text="No chat sessions." />
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {fd.chat_sessions.items.map((s) => (
                          <button key={s.id} onClick={() => setViewChatSession(s)}
                            className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{s.issue_category || "General"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(s.last_message_at || s.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={s.status} label={s.status} />
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={MapPin} title="Addresses" subtitle={`${fd.addresses.length} saved`} />
                  <div className="mt-3">
                    {fullDetailLoading ? (
                      <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <SkeletonBlock key={i} className="h-16" />)}</div>
                    ) : fd.addresses.length === 0 ? (
                      <EmptyState icon={MapPin} text="No saved addresses." />
                    ) : (
                      <div className="space-y-2">
                        {fd.addresses.map((a) => (
                          <button key={a.id} onClick={() => openAddress(a)}
                            className="w-full text-left text-sm border border-gray-100 rounded-xl p-3 hover:bg-gray-50 hover:border-gray-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-800">{a.full_name}</span>
                              <div className="flex items-center gap-1.5">
                                {a.is_default && <StatusBadge status="active" label="Default" dot />}
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{a.address_type}</span>
                                <ChevronRight size={14} className="text-gray-300" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {[a.address_line_1, a.address_line_2, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{a.mobile}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={Ruler} title="Measurement Profiles" subtitle={`${fd.measurements.length} saved`} />
                  <div className="mt-3">
                    {fd.measurements.length === 0 ? (
                      <EmptyState icon={Ruler} text="No measurement profiles." />
                    ) : (
                      <div className="space-y-2">
                        {fd.measurements.map((m) => (
                          <button key={m.id} onClick={() => openMeasurement(m)}
                            className="w-full text-left text-sm border border-gray-100 rounded-xl p-3 hover:bg-gray-50 hover:border-gray-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-800">{m.profile_name}</span>
                              <div className="flex items-center gap-1.5">
                                {m.is_default && <StatusBadge status="active" label="Default" dot />}
                                <ChevronRight size={14} className="text-gray-300" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {m.gender && `${m.gender} · `}
                              Chest {m.chest ?? "-"} · Waist {m.waist ?? "-"} · Hips {m.hips ?? "-"} · Height {m.height ?? "-"}
                            </p>
                            {m.fit_preference && <p className="text-xs text-gray-400 mt-1">Fit: {m.fit_preference}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <SectionHeader icon={ShoppingCart} title="Cart History" subtitle={`${fd.carts.total} record${fd.carts.total !== 1 ? "s" : ""}`} />
                  <div className="mt-3">
                    {fd.carts.items.length === 0 ? (
                      <EmptyState icon={ShoppingCart} text="No cart activity." />
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {fd.carts.items.map((c) => (
                          <div key={c.id} className="py-2 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800">{c.item_count} item{c.item_count === 1 ? "" : "s"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-gray-600 [font-variant-numeric:tabular-nums]">{formatCurrency(c.total_amount)}</span>
                              <StatusBadge status={c.status} label={c.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <SectionHeader
                  icon={History}
                  title="Activity Timeline"
                  subtitle="Audit logs, orders, payments, and support events, merged"
                  badge={
                    <button onClick={fetchAudit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <RefreshCw size={13} />
                    </button>
                  }
                />
                <div className="mt-4">
                  {(auditLoading || ordersLoading || fullDetailLoading) ? (
                    <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-12" />)}</div>
                  ) : timelineEvents.length === 0 ? (
                    <EmptyState icon={History} text="No recorded activity for this account." />
                  ) : (
                    <Timeline events={timelineEvents} iconMap={EVENT_ICON} defaultIcon={History} />
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
