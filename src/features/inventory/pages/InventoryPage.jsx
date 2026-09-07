import { useEffect, useState, useCallback } from "react";
import { Plus, Search, RefreshCw, Package, Trash2, Pencil, X } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import DataTable from "../../../components/common/DataTable";
import { ConfirmModal } from "../../../components/common/EntityWorkspace";
import StatCard from "../../bridge/components/StatCard.jsx";
import api from "../../../services/api";
import { extractErrorMessage } from "../../../utils/formatters";

// Fleet/materials parity with the mobile staff app's Inventory screen
// (bmdadmin/src/app/(drawer)/inventory) - this was the one gap where mobile
// had a full CRUD screen and web had none. Mirrors app/schemas/inventory.py
// exactly: Id, Name, Category, Quantity, Unit, PricePerUnit (PascalCase
// response, snake_case request body - the backend's InventoryResponse maps
// directly from ORM attribute names, unlike most other admin schemas).
const EMPTY_FORM = { name: "", category: "", quantity: "", unit: "", price_per_unit: "" };

function ItemModal({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const isEdit = Boolean(initial?.id);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.name?.trim()) return;
    onSave({
      name: form.name.trim(),
      category: form.category?.trim() || undefined,
      quantity: form.quantity === "" ? undefined : Number(form.quantity),
      unit: form.unit?.trim() || undefined,
      price_per_unit: form.price_per_unit === "" ? undefined : Number(form.price_per_unit),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">{isEdit ? "Edit Item" : "Add Inventory Item"}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Cotton Fabric - White" autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Category</label>
            <input value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Fabric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Quantity</label>
              <input type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. meters" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Price per unit (₹)</label>
            <input type="number" step="0.01" min="0" value={form.price_per_unit} onChange={(e) => set("price_per_unit", e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400" placeholder="0" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
          <button onClick={submit} disabled={saving || !form.name?.trim()} className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [modalItem, setModalItem] = useState(null); // null = closed, {} = add, item = edit
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/inventory");
      setItems(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load inventory."));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount; setState happens inside fetchItems' async handlers,
  // not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return it.Name?.toLowerCase().includes(term) || it.Category?.toLowerCase().includes(term);
  });

  const lowStockCount = items.filter((it) => Number(it.Quantity) <= 5).length;
  const totalValue = items.reduce((sum, it) => sum + Number(it.Quantity || 0) * Number(it.PricePerUnit || 0), 0);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (modalItem?.id) {
        await api.patch(`/inventory/${modalItem.id}`, payload);
      } else {
        await api.post("/inventory", payload);
      }
      setModalItem(null);
      await fetchItems();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not save this item."));
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/inventory/${deleteTarget.Id}`);
      setDeleteTarget(null);
      await fetchItems();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete this item."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 w-full min-h-screen bg-gray-100">
      <PageHeader
        title="Inventory"
        subtitle={`${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
        actions={
          <>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name / category…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-4 py-1.5 rounded-full text-gray-800 text-xs outline-none w-52 bg-white"
              />
            </div>
            <button onClick={fetchItems} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => setModalItem({})} className="flex items-center gap-1.5 bg-white text-teal-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
              <Plus size={13} /> Add Item
            </button>
          </>
        }
      />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatCard icon={Package} label="Total Items" value={items.length} tone="teal" />
        <StatCard icon={Package} label="Low Stock (≤5)" value={lowStockCount} tone="rose" />
        <StatCard icon={Package} label="Total Stock Value" value={`₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} tone="emerald" />
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "quantity", label: "Quantity", align: "right" },
          { key: "unit", label: "Unit" },
          { key: "price", label: "Price / Unit", align: "right" },
          { key: "value", label: "Total Value", align: "right" },
          { key: "actions", label: "Actions", align: "center" },
        ]}
        rows={filtered.slice((page - 1) * limit, page * limit)}
        rowKey={(it) => it.Id}
        loading={loading}
        emptyMessage={search ? "No matching items." : "No inventory items yet."}
        emptyIcon={Package}
        pagination={{ page, total: filtered.length, limit, onPageChange: setPage, onLimitChange: (l) => { setLimit(l); setPage(1); } }}
        renderRow={(it) => (
          <tr key={it.Id} className="hover:bg-teal-50/40 transition-colors text-gray-700">
            <td className="px-4 py-2.5 font-semibold">{it.Name}</td>
            <td className="px-4 py-2.5 text-gray-500">{it.Category || "-"}</td>
            <td className={`px-4 py-2.5 text-right font-mono ${Number(it.Quantity) <= 5 ? "text-rose-600 font-bold" : ""}`}>{it.Quantity}</td>
            <td className="px-4 py-2.5 text-gray-500">{it.Unit || "-"}</td>
            <td className="px-4 py-2.5 text-right font-mono">₹{Number(it.PricePerUnit || 0).toLocaleString("en-IN")}</td>
            <td className="px-4 py-2.5 text-right font-mono font-semibold">
              ₹{(Number(it.Quantity || 0) * Number(it.PricePerUnit || 0)).toLocaleString("en-IN")}
            </td>
            <td className="px-4 py-2.5 text-center">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setModalItem({ id: it.Id, name: it.Name, category: it.Category ?? "", quantity: it.Quantity ?? "", unit: it.Unit ?? "", price_per_unit: it.PricePerUnit ?? "" })}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeleteTarget(it)}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {modalItem !== null && (
        <ItemModal
          initial={modalItem.id ? modalItem : null}
          onCancel={() => setModalItem(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        icon={Trash2}
        title={`Delete "${deleteTarget?.Name}"?`}
        description="This cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
