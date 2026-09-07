import { LogOut } from "lucide-react";
import useLogout from "../hooks/useLogout.js";

export default function LogoutPage({ isCollapsed = false }) {
  const { busy, handleLogout } = useLogout();

  if (isCollapsed) {
    return (
      <button
        onClick={handleLogout}
        disabled={busy}
        title="Logout"
        className="w-9 h-9 flex items-center justify-center mx-auto rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
      >
        <LogOut size={16} className={busy ? "animate-spin" : ""} />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
    >
      <LogOut size={14} className={busy ? "animate-spin" : ""} />
      {busy ? "Logging out…" : "Logout"}
    </button>
  );
}
