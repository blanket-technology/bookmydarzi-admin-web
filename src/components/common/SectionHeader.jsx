// Shared section header for detail-page cards (icon + title + subtitle +
// optional trailing badge/action). Lifted from TailorFullDetails.jsx, the
// richest of the several near-duplicate SectionHeader implementations that
// existed across detail pages - this is the version every detail page
// should import going forward.
export default function SectionHeader({ icon: Icon, title, subtitle, badge }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 border border-teal-100">
            <Icon size={20} className="text-teal-600" />
          </div>
        )}
        <div>
          <h3 className="font-bold text-gray-800 text-base leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}
