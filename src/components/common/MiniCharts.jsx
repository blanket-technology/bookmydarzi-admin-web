/**
 * Dependency-free mini charts (pure SVG/CSS) for admin performance panels.
 * No charting library - keeps the bundle lean and avoids a new dependency.
 * Each chart is self-contained, responsive, and accessible (role/aria-label).
 *
 * Palette: teal is the brand accent; semantic colors (emerald=good,
 * amber=waiting, rose=problem, blue=in-progress) encode state, kept separate
 * from the accent so meaning reads at a glance.
 */

const COLORS = {
  teal: "#0d9488",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  slate: "#94a3b8",
};

/** Resolve a color token or pass through a raw hex. */
function color(c) {
  return COLORS[c] || c;
}

/**
 * Donut chart for a small categorical breakdown.
 * props.data: [{ label, value, color }]  (color = token or hex)
 */
export function DonutChart({ data = [], size = 150, thickness = 22, centerLabel, centerValue }) {
  const items = data.filter((d) => (d.value || 0) > 0);
  const total = items.reduce((s, d) => s + (d.value || 0), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const segments = total > 0
    ? items.map((d) => {
        const frac = d.value / total;
        const len = frac * c;
        const seg = { ...d, dash: `${len} ${c - len}`, dashoffset: -offset };
        offset += len;
        return seg;
      })
    : [];

  const label = centerLabel ?? "Total";
  const value = centerValue ?? total;

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Donut chart. ${items.map((d) => `${d.label}: ${d.value}`).join(", ") || "no data"}`}
        className="shrink-0"
      >
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f2" strokeWidth={thickness} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color(s.color)}
            strokeWidth={thickness}
            strokeDasharray={s.dash}
            strokeDashoffset={s.dashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-gray-800" style={{ fontSize: 22, fontWeight: 700 }}>
          {value}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 10, fontWeight: 600 }}>
          {label}
        </text>
      </svg>

      <ul className="space-y-1.5 min-w-0">
        {(total > 0 ? items : []).map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color(d.color) }} />
            <span className="text-gray-500 truncate">{d.label}</span>
            <span className="ml-auto font-bold text-gray-800 tabular-nums">{d.value}</span>
          </li>
        ))}
        {total === 0 && <li className="text-xs text-gray-400">No data yet.</li>}
      </ul>
    </div>
  );
}

/**
 * Horizontal bar chart - good for a pipeline / breakdown of counts.
 * props.data: [{ label, value, color }]
 */
export function HBarChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.value || 0));
  return (
    <div className="space-y-2.5" role="img" aria-label={`Bar chart. ${data.map((d) => `${d.label}: ${d.value}`).join(", ")}`}>
      {data.map((d, i) => {
        const pct = Math.round(((d.value || 0) / max) * 100);
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs font-medium text-gray-500 truncate text-right">{d.label}</span>
            <div className="flex-1 h-5 rounded-md bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-md transition-[width] duration-500 flex items-center justify-end px-1.5"
                style={{ width: `${Math.max(pct, (d.value || 0) > 0 ? 8 : 0)}%`, background: color(d.color) }}
              >
                {(d.value || 0) > 0 && <span className="text-[10px] font-bold text-white tabular-nums">{d.value}</span>}
              </div>
            </div>
            {(d.value || 0) === 0 && <span className="text-[10px] text-gray-300 -ml-8 tabular-nums">0</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Semicircular gauge for a single percentage (e.g. capacity utilisation).
 */
export function GaugeChart({ value = 0, label = "Utilisation", size = 160 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const semi = Math.PI * r; // length of the half circle
  const dash = (pct / 100) * semi;

  // Color by load: green < 60, amber 60-85, red > 85.
  const stroke = pct > 85 ? COLORS.rose : pct > 60 ? COLORS.amber : COLORS.emerald;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${pct} percent`}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#eef2f2"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${semi}`}
          className="transition-[stroke-dasharray] duration-700"
        />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-800" style={{ fontSize: 26, fontWeight: 700 }}>
          {pct}%
        </text>
      </svg>
      <p className="text-xs font-semibold text-gray-500 -mt-1">{label}</p>
    </div>
  );
}
