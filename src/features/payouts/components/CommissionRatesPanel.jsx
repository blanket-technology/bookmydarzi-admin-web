import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import * as payoutService from "../services/payoutService.js";
import * as tailorService from "../../tailor/services/tailorService.js";
import * as catalogService from "../../catalog/services/catalogService.js";

// Admin sets a commission rate per (tailor, category) or a tailor-wide
// default (category left blank) - the backend resolves the most specific
// match at payout-creation time (see app/services/payouts/payout_service.py's
// resolve_commission_percent), falling back to a platform-wide default when
// no rate has been set at all, so this panel is optional to use, not a
// blocker for payouts to work.
export default function CommissionRatesPanel() {
  const [rates, setRates] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tailorId, setTailorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [percent, setPercent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [rateList, tailorList, tree] = await Promise.all([
        payoutService.getCommissionRates(),
        tailorService.getTailors(),
        catalogService.getCatalogTree(),
      ]);
      setRates(rateList);
      setTailors(tailorList);
      setCategories((tree?.categories || []).map((c) => ({ id: c.id, name: c.name })));
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load commission rates."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tailorId || !percent) {
      setSaveError("Select a tailor and enter a commission percentage.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await payoutService.upsertCommissionRate({
        tailor_id: Number(tailorId),
        category_id: categoryId ? Number(categoryId) : null,
        commission_percent: percent,
      });
      setTailorId("");
      setCategoryId("");
      setPercent("");
      await load();
    } catch (err) {
      setSaveError(extractErrorMessage(err, "Failed to save commission rate."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rateId) => {
    setDeletingId(rateId);
    try {
      await payoutService.deleteCommissionRate(rateId);
      setRates((prev) => prev.filter((r) => r.id !== rateId));
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to delete commission rate."));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-teal-600" size={22} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tailor</label>
          <select
            value={tailorId}
            onChange={(e) => setTailorId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white outline-none"
          >
            <option value="">Select tailor…</option>
            {tailors.map((t) => (
              <option key={t.tailor_id} value={t.tailor_id}>{t.full_name || `Tailor #${t.tailor_id}`}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Category (optional)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white outline-none"
          >
            <option value="">All categories (tailor default)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Commission %</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            placeholder="65.00"
            className="w-full px-3 py-2 rounded-lg text-sm border-2 border-gray-200 focus:border-teal-500 bg-gray-50 focus:bg-white outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Save Rate
        </button>
        {saveError && <p className="w-full text-xs text-red-600">{saveError}</p>}
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tailor</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Commission %</th>
              <th className="px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                No commission rates set - payouts use the platform default rate.
              </td></tr>
            ) : rates.map((r) => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">{r.tailor_name || `#${r.tailor_id}`}</td>
                <td className="px-4 py-3 text-gray-500">{r.category_name || "All categories"}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800 tabular-nums">{Number(r.commission_percent).toFixed(2)}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deletingId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
