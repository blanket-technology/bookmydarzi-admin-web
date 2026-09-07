import { AlertCircle, User, Bot } from "lucide-react";
import { STATUS_COLOR, STATUS_LABEL } from "../constants/chatConstants.js";
import { timeSince } from "../utils/chatUtils.js";

export default function SessionRow({ session, isActive, onClick }) {
  const isPending = session.status === "pending_human";
  const isAI = session.status === "ai_handling";

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors
        ${isActive ? "bg-teal-50 border-l-2 border-l-teal-500" : "border-l-2 border-l-transparent"}
        ${isPending && !isActive ? "bg-amber-50/60" : ""}
      `}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAI
              ? "bg-purple-100 text-purple-600"
              : isPending
              ? "bg-amber-100 text-amber-600"
              : "bg-teal-100 text-teal-600"
          }`}
        >
          {isAI ? <Bot size={14} /> : <User size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-xs font-semibold text-slate-700 truncate">
              {session.customer_name || `User #${session.user_id}`}
            </span>
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {timeSince(session.last_message_at)}
            </span>
          </div>
          {session.order_id && (
            <p className="text-[10px] text-teal-600 font-medium mb-0.5">
              Order #{session.order_id}
            </p>
          )}
          <span
            className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              STATUS_COLOR[session.status] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {isPending && <AlertCircle size={9} />}
            {STATUS_LABEL[session.status] ?? session.status}
          </span>
        </div>
      </div>
    </button>
  );
}
