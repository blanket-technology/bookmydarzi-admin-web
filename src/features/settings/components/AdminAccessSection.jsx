import { useEffect, useState } from "react";
import {
  Search, Loader2, AlertCircle, ArrowLeft, ShieldCheck, ShieldOff,
  CheckCircle2, Minus, Lock, Unlock,
} from "lucide-react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { useAdminAccessStore } from "../store/settingsStore.js";
import { ConfirmModal } from "../../../components/common/EntityWorkspace";
import LoadingState from "../../../components/common/LoadingState.jsx";

function AdminPicker({ onSelect }) {
  const admins = useAdminAccessStore((s) => s.admins);
  const loading = useAdminAccessStore((s) => s.adminsLoading);
  const error = useAdminAccessStore((s) => s.adminsError);
  const loadAdmins = useAdminAccessStore((s) => s.loadAdmins);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const q = search.trim().toLowerCase();
  const filtered = admins.filter((a) =>
    !q ||
    (a.full_name || "").toLowerCase().includes(q) ||
    (a.email || "").toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Admin Access</h2>
          <p className="text-xs text-gray-500 mt-0.5">Grant or restrict what a specific admin account can access, beyond their role default.</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search admin by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 rounded-full text-gray-700 text-xs outline-none bg-gray-50 border border-gray-200 w-64"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs mb-3">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <LoadingState compact />
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-12">
          {q ? "No matching admin accounts." : "No admin accounts found."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/40 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                {(a.full_name || a.email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{a.full_name || "-"}</p>
                <p className="text-xs text-gray-400 truncate">{a.email || "-"}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {a.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPermissionEditor({ admin, onBack }) {
  const screens = useAdminAccessStore((s) => s.screens);
  const permissions = useAdminAccessStore((s) => s.permissions);
  const effective = useAdminAccessStore((s) => s.effective);
  const lockout = useAdminAccessStore((s) => s.lockout);
  const loading = useAdminAccessStore((s) => s.editorLoading);
  const error = useAdminAccessStore((s) => s.editorError);
  const busyKey = useAdminAccessStore((s) => s.busyKey);
  const unlocking = useAdminAccessStore((s) => s.unlocking);
  const loadEditor = useAdminAccessStore((s) => s.loadEditor);
  const unlockAccount = useAdminAccessStore((s) => s.unlockAccount);
  const grantCell = useAdminAccessStore((s) => s.grantCell);
  const revokeCell = useAdminAccessStore((s) => s.revokeCell);
  const resetCell = useAdminAccessStore((s) => s.resetCell);

  useEffect(() => {
    loadEditor(admin.id);
  }, [admin.id, loadEditor]);

  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [unlockMsg, setUnlockMsg] = useState(null);

  const handleUnlock = async () => {
    setShowUnlockConfirm(false);
    try {
      await unlockAccount(admin);
    } catch (err) {
      setUnlockMsg(extractErrorMessage(err, "Unlock failed."));
    }
  };

  const cellState = (screenName, permName) => {
    if (!effective) return "none";
    const isRevoked = effective.explicit_revokes.some(
      (r) => r.screen_name === screenName && r.permission_name === permName
    );
    if (isRevoked) return "revoked";
    const isOverridden = effective.account_overrides.some(
      (s) => s.screen_name === screenName && s.permissions.includes(permName)
    );
    if (isOverridden) return "granted-override";
    const isRoleDefault = effective.role_default_screens.some(
      (s) => s.screen_name === screenName && s.permissions.includes(permName)
    );
    if (isRoleDefault) return "granted-role";
    return "none";
  };

  const handleCellClick = async (screen, perm, state) => {
    try {
      if (state === "revoked") await resetCell(admin, screen, perm);
      else if (state === "none" || state === "granted-role") await grantCell(admin, screen, perm);
      else await revokeCell(admin, screen, perm);
    } catch (err) {
      setUnlockMsg(extractErrorMessage(err, "Update failed."));
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to admin list
      </button>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-lg shrink-0">
          {(admin.full_name || admin.email || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">{admin.full_name || "-"}</p>
          <p className="text-xs text-gray-500">{admin.email}</p>
        </div>
        {lockout && (
          lockout.locked ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Lock size={13} />
                Locked out{lockout.retry_after_seconds ? ` - retry in ${Math.ceil(lockout.retry_after_seconds / 60)} min` : ""}
              </span>
              <button
                onClick={() => setShowUnlockConfirm(true)}
                disabled={unlocking}
                className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60"
              >
                {unlocking ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                Unlock Now
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
              <ShieldCheck size={13} />
              Not locked{lockout.failed_attempts > 0 ? ` (${lockout.failed_attempts} recent failed attempt${lockout.failed_attempts !== 1 ? "s" : ""})` : ""}
            </span>
          )
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-blue-800 font-semibold mb-2">Click any cell in the table below to change it.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-800">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500 shrink-0" />Allowed by their role - click to also grant it directly to this account</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-teal-600 shrink-0" />Granted specifically to this account - click to take it away</span>
          <span className="flex items-center gap-1.5"><ShieldOff size={15} className="text-rose-500 shrink-0" />Blocked for this account only - click to clear the block</span>
          <span className="flex items-center gap-1.5"><Minus size={15} className="text-gray-400 shrink-0" />Not allowed - click to grant it</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs mb-3">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {unlockMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs mb-3">
          <AlertCircle size={14} /> {unlockMsg}
        </div>
      )}

      <ConfirmModal
        open={showUnlockConfirm}
        icon={Unlock}
        title="Unlock Account?"
        description={`Unlock ${admin.full_name || admin.email}'s account? This immediately clears their failed-login lockout.`}
        confirmLabel="Yes, Unlock"
        tone="neutral"
        onConfirm={handleUnlock}
        onCancel={() => setShowUnlockConfirm(false)}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-50">Module</th>
              {permissions.map((p) => (
                <th key={p.id} className="px-3 py-3 text-center font-semibold capitalize whitespace-nowrap">
                  {p.permission_name.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {screens.map((screen, i) => (
              <tr key={screen.id} className={`border-t border-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}>
                <td className="px-4 py-2.5 font-semibold text-gray-800 sticky left-0 bg-inherit whitespace-nowrap">
                  {screen.screen_name.replace(/_/g, " ")}
                </td>
                {permissions.map((perm) => {
                  const state = cellState(screen.screen_name, perm.permission_name);
                  const key = `${screen.id}-${perm.id}`;
                  const busy = busyKey === key;
                  return (
                    <td key={perm.id} className="px-3 py-2.5 text-center">
                      <button
                        disabled={busy}
                        onClick={() => handleCellClick(screen, perm, state)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin text-gray-400" />
                        ) : state === "granted-role" ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : state === "granted-override" ? (
                          <ShieldCheck size={16} className="text-teal-600" />
                        ) : state === "revoked" ? (
                          <ShieldOff size={16} className="text-rose-500" />
                        ) : (
                          <Minus size={14} className="text-gray-300" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminAccessSection() {
  const selectedAdmin = useAdminAccessStore((s) => s.selectedAdmin);
  const selectAdmin = useAdminAccessStore((s) => s.selectAdmin);
  const clearSelectedAdmin = useAdminAccessStore((s) => s.clearSelectedAdmin);

  return selectedAdmin ? (
    <AdminPermissionEditor admin={selectedAdmin} onBack={clearSelectedAdmin} />
  ) : (
    <AdminPicker onSelect={selectAdmin} />
  );
}
