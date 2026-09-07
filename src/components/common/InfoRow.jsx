// Shared label/value row used across every detail page (Users, Bridge,
// Orders, Tailors). Previously each page independently redefined its own
// near-identical InfoRow with small inconsistencies (e.g. OrderFullDetails'
// version returned null on a falsy value, hiding rows like "0"; others
// rendered "-" instead) - this is the single version every detail page
// should import going forward.
//
// hideIfEmpty: opt-in to OrderFullDetails' old "hide the row entirely when
// value is falsy" behavior, for pages that intentionally omit blank fields
// rather than showing "-".
export default function InfoRow({ label, value, hideIfEmpty = false }) {
  if (hideIfEmpty && !value) return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 font-semibold text-xs uppercase tracking-wide shrink-0">
        {label}
      </span>
      <span className="text-gray-800 font-medium text-sm text-right ml-3">
        {value ?? "-"}
      </span>
    </div>
  );
}
