import { Loader2, ChevronRight } from "lucide-react";

// Shared building blocks for entity "Operations Workspace" detail pages
// (Customer, Bridge/Employee, Tailor). Extracted from UserDetailPage.jsx's
// original inline implementation so all three entity types render with the
// exact same hero/KPI/tab/summary-card/timeline visual language, differing
// only in the data each page feeds in.

export function WorkspaceHero({ onBack, avatar, title, badges, metaLine, factsRow, actions, tabs, activeTab, onTabChange }) {
  return (
    <div className="sticky top-0 z-20 bg-teal-700 shadow-md">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <button onClick={onBack}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all shrink-0">
              <ChevronRight size={24} className="rotate-180" />
            </button>
            {avatar}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-white text-3xl font-bold leading-tight truncate">{title}</h1>
                {badges}
              </div>
              <p className="text-teal-200 text-base mt-1.5 truncate">{metaLine}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">{actions}</div>
        </div>

        {factsRow && (
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/10 text-sm text-teal-200 flex-wrap">
            {factsRow}
          </div>
        )}
      </div>

      {tabs && (
        <div className="max-w-6xl mx-auto px-5 sm:px-8 border-t border-white/10">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                    active ? "border-white text-white" : "border-transparent text-teal-200 hover:text-white"
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function HeroActionButton({ onClick, disabled, loading, icon: Icon, label, tone = "neutral", title }) {
  const toneClass = {
    neutral: "bg-white/15 hover:bg-white/25 text-white border border-white/20",
    warn: "bg-amber-500 hover:bg-amber-600 text-white",
    positive: "bg-emerald-500 hover:bg-emerald-600 text-white",
    danger: "w-11 h-11 !px-0 justify-center bg-red-500 hover:bg-red-600 text-white shrink-0",
  }[tone];

  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center gap-2 h-11 px-5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 ${toneClass} ${disabled ? "cursor-not-allowed" : ""}`}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
      {tone !== "danger" && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

export function KpiTile({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
      <p className={`text-lg font-bold mt-0.5 [font-variant-numeric:tabular-nums] ${accent || "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}

export function SkeletonBlock({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

/** Destructive-action confirmation, matching the visual language of the
 * original inline "Delete Tailor?" dialog - replaces window.confirm(),
 * which looks like a raw browser dialog next to the rest of this app's
 * design. tone="danger" (default) uses the red icon/button treatment;
 * pass tone="neutral" for a non-destructive confirmation. */
export function ConfirmModal({
  open,
  icon: Icon,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  const iconWrap = tone === "danger" ? "bg-red-100 text-red-500" : "bg-teal-100 text-teal-600";
  const confirmBtn =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-teal-600 hover:bg-teal-700";
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {Icon ? (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconWrap}`}>
            <Icon size={28} />
          </div>
        ) : null}
        <h3 className="text-lg font-bold text-gray-800 text-center">{title}</h3>
        {description ? (
          <p className="text-sm text-gray-500 text-center mt-2 mb-6">{description}</p>
        ) : (
          <div className="mb-4" />
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-white text-sm font-bold transition-all ${confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon size={26} className="text-gray-200 mb-2" />
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}

/** Overview summary card - count + latest item + status + View All. Never
 * renders a full table (that lives on the corresponding tab). */
export function SummaryCard({ icon: Icon, title, count, onViewAll, children, empty }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <Icon size={15} className="text-teal-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        </div>
        {count != null && <span className="text-xs font-bold text-gray-400 [font-variant-numeric:tabular-nums]">{count}</span>}
      </div>
      <div className="flex-1 min-h-[40px]">
        {count === 0 ? (
          <p className="text-xs text-gray-400">{empty}</p>
        ) : children}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-3 pt-3 border-t border-gray-50 text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start"
        >
          View All <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

/** Compact key/value tile for grids of facts/stats. */
export function StatTile({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-gray-800 mt-0.5 [font-variant-numeric:tabular-nums]">{value ?? "-"}</p>
    </div>
  );
}

export function StatGrid({ items }) {
  const visible = items.filter((i) => i.hidden !== true);
  if (visible.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {visible.map(({ label, value }) => <StatTile key={label} label={label} value={value} />)}
    </div>
  );
}

/** Vertical dot-and-line activity timeline. `events` = [{ id, type, at, title, subtitle, onClick }]. */
export function Timeline({ events, iconMap, defaultIcon }) {
  if (events.length === 0) return null;
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-100" />
      {events.map((e) => {
        const Icon = iconMap[e.type] || defaultIcon;
        const Wrapper = e.onClick ? "button" : "div";
        return (
          <Wrapper
            key={e.id}
            onClick={e.onClick}
            className={`relative mb-4 last:mb-0 block w-full text-left ${e.onClick ? "cursor-pointer hover:bg-gray-50 rounded-lg -ml-2 pl-2 py-1 transition-colors" : ""}`}
          >
            <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center">
              <Icon size={9} className="text-teal-600" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-700 truncate">{e.title}</span>
              <span className="text-xs text-gray-400 shrink-0">{e.atLabel}</span>
            </div>
            {e.subtitle && <p className="text-xs text-gray-400 mt-0.5">{e.subtitle}</p>}
          </Wrapper>
        );
      })}
    </div>
  );
}
