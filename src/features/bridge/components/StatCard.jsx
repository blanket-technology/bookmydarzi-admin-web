export default function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tones[tone] || tones.gray}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-800 [font-variant-numeric:tabular-nums]">{value}</p>
      </div>
    </div>
  );
}
