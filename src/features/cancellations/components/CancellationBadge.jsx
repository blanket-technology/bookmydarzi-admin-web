export default function CancellationBadge({ status, map }) {
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {(status ?? "-").replace(/_/g, " ")}
    </span>
  );
}
