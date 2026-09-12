import { useEffect, useState } from "react";
import { SlidersHorizontal, XCircle } from "lucide-react";
import { getCancellationPolicy } from "../services/cancellationService.js";
import LoadingState from "../../../components/common/LoadingState.jsx";
import { extractErrorMessage } from "../../../utils/formatters.js";

export default function PolicyEditor({ onClose }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCancellationPolicy()
      .then((data) => setPolicies(data))
      .catch((err) => setError(extractErrorMessage(err, "Failed to load policy.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b">
          <SlidersHorizontal className="text-teal-600" size={20} />
          <h2 className="text-lg font-bold text-slate-800 flex-1">Cancellation Policy</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><XCircle size={20} /></button>
        </div>
        {loading ? (
          <LoadingState />
        ) : (
          <div className="overflow-y-auto flex-1 p-5 space-y-2">
            {error && <p className="text-rose-600 text-sm mb-3">{error}</p>}
            {policies.map((p) => (
              <div key={p.OrderStage} className="flex items-center gap-3 py-3 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.DisplayStage}</p>
                  <p className="text-xs text-slate-400">{p.OrderStage}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.CancellationAllowed ? (
                    <span className="text-xs text-emerald-600 font-semibold">Cancellable</span>
                  ) : (
                    <span className="text-xs text-rose-500 font-semibold">No Cancel</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
