/**
 * PageHeader - compact, consistent teal header bar used on every management page.
 *
 * Props:
 *   title    {string}   required - page title (rendered in text-base font-bold)
 *   subtitle {string}   optional - small descriptor line below the title
 *   actions  {ReactNode} optional - buttons / dropdowns rendered on the right
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="bg-brand text-white px-5 py-3 rounded-xl shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-base font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-teal-100 text-xs mt-0.5 font-normal">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
