import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, Bot, User, UserCheck, CheckCircle,
  RefreshCw, MessageSquare, Zap, ArrowLeft, X, ZoomIn, ZoomOut, Package, Copy,
} from "lucide-react";
import { resolveMediaUrl } from "../../../services/api.js";
import { extractErrorMessage } from "../../../utils/formatters.js";
import renderMarkdown from "../utils/renderMarkdown.jsx";
import { notifyError } from "../../../services/dialogService.js";
import { getStoredUser } from "../../../store/authStore.jsx";
import { MESSAGES_FETCH_LIMIT, SENDER_LABELS } from "../constants/chatConstants.js";
import { applyQuickReplyTemplate, getChatWsUrl, timeFmt } from "../utils/chatUtils.js";
import {
  assignSession,
  getQuickReplies,
  getSessionMessages,
} from "../services/chatService.js";
import OrderContextPanel from "./OrderContextPanel.jsx";

function Lightbox({ url, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setZoomed((z) => !z)}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          title={zoomed ? "Zoom out" : "Zoom in"}
        >
          {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className={`${zoomed ? "overflow-auto" : ""} max-w-[92vw] max-h-[90vh] p-2`} onClick={(e) => e.stopPropagation()}>
        <img
          src={url}
          alt="Attachment"
          onClick={() => setZoomed((z) => !z)}
          className={`rounded-xl shadow-2xl transition-transform duration-200 ${
            zoomed ? "max-w-none cursor-zoom-out scale-100" : "max-w-[92vw] max-h-[90vh] object-contain cursor-zoom-in"
          }`}
          style={zoomed ? { width: "160vw", maxWidth: "none" } : undefined}
        />
      </div>
    </div>
  );
}

function MessageRow({ msg, onImageClick }) {
  const isCustomer = msg.sender_type === "customer";
  const isAI = msg.sender_type === "ai";
  const isSystem = msg.sender_type === "system";
  const imageUrl = msg.message_type === "image" ? msg.metadata?.attachment_id : null;

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{msg.body}</span>
      </div>
    );
  }

  const bubble = isCustomer
    ? "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-md"
    : isAI
    ? "bg-violet-50 border border-violet-100 text-violet-950 rounded-2xl rounded-br-md"
    : "bg-teal-600 text-white rounded-2xl rounded-br-md";

  return (
    <div className={`flex items-end gap-2 ${isCustomer ? "flex-row justify-start" : "flex-row-reverse justify-start"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isCustomer ? "bg-slate-200" : isAI ? "bg-violet-100" : "bg-teal-100"
      }`}>
        {isCustomer
          ? <User size={13} className="text-slate-500" />
          : isAI
          ? <Bot size={13} className="text-violet-600" />
          : <User size={13} className="text-teal-600" />}
      </div>

      <div className={`flex flex-col max-w-[72%] ${isCustomer ? "items-start" : "items-end"}`}>
        {imageUrl ? (
          <button
            type="button"
            onClick={() => onImageClick?.(resolveMediaUrl(imageUrl))}
            className="block cursor-zoom-in"
            title="Click to view"
          >
            <img
              src={resolveMediaUrl(imageUrl)}
              alt="Attachment"
              className="max-w-[220px] max-h-[260px] rounded-2xl border border-slate-200 object-cover hover:opacity-90 transition-opacity"
            />
            {msg.body && <p className="text-sm text-slate-600 mt-1 text-left">{msg.body}</p>}
          </button>
        ) : (
          <div className={`px-3.5 py-2 text-sm leading-relaxed break-words ${bubble}`}>
            {/* Agents can send quick-reply templates authored with the same
                markdown emphasis the AI uses (see the quick-reply picker
                below) - rendering only for isAI would leave a human agent's
                sent **bold** text showing literal asterisks to the customer. */}
            {!isCustomer ? renderMarkdown(msg.body) : <div className="whitespace-pre-wrap">{msg.body}</div>}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1 px-1">
          {!isCustomer && (
            <span className={`text-[10px] font-semibold ${isAI ? "text-violet-400" : "text-teal-500"}`}>
              {SENDER_LABELS[msg.sender_type] ?? msg.sender_type}
            </span>
          )}
          <span className="text-[10px] text-slate-300">{timeFmt(msg.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ConversationView({ session, onRefresh, onResolve, onBack, headerRightPad = false }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);
  const sessionUuid = session?.uuid;
  const activeUuidRef = useRef(sessionUuid);
  const token = sessionStorage.getItem("access_token");

  const fetchMessages = useCallback(async () => {
    if (!sessionUuid) return;
    const requestedUuid = sessionUuid;
    try {
      const data = await getSessionMessages(requestedUuid, MESSAGES_FETCH_LIMIT);
      if (requestedUuid !== activeUuidRef.current) return;
      setMessages(data?.messages ?? []);
    } catch {
      // non-fatal
    } finally {
      if (requestedUuid === activeUuidRef.current) setLoading(false);
    }
  }, [sessionUuid]);

  const fetchQuickReplies = useCallback(async () => {
    try {
      const data = await getQuickReplies();
      setQuickReplies(data?.quick_replies ?? []);
    } catch {
      // non-fatal
    }
  }, []);

  // Resets the thread's local view state when the selected session changes,
  // then kicks off the fetches for it - a real session-switch sync effect,
  // not a derived-state anti-pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    activeUuidRef.current = sessionUuid;
    setLoading(true);
    setMessages([]);
    setReply("");
    fetchMessages();
    fetchQuickReplies();
  }, [sessionUuid, fetchMessages, fetchQuickReplies]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Opens (and tears down/reopens) the per-session WebSocket; setWsStatus
  // calls track the socket's own connection lifecycle, not derived state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!sessionUuid || !token) return;
    const url = getChatWsUrl(sessionUuid);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => {
      // Authenticate via the frame body (not the URL) - keeps the JWT out of
      // access logs / history. Backend reads this as the first frame.
      try {
        ws.send(JSON.stringify({ type: "auth", token }));
      } catch {
        // send failure → server times out and closes; onclose handles it.
      }
      setWsStatus("connected");
    };
    ws.onclose = () => setWsStatus("disconnected");
    ws.onmessage = (e) => {
      try {
        const frame = JSON.parse(e.data);
        if (frame.event === "message_created") {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === frame.message?.id);
            return exists ? prev : [...prev, frame.message];
          });
        }
      } catch {
        // malformed frame - ignore, next frame may be valid
      }
    };

    return () => ws.close();
  }, [sessionUuid, token]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          event: "send_message",
          session_uuid: session.uuid,
          body: text,
          message_type: "text",
          client_id: crypto.randomUUID(),
        }));
        setReply("");
      } else {
        notifyError("Not connected to chat. Please wait for the connection to reconnect and try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const assignToMe = async () => {
    const myId = getStoredUser()?.Id;
    if (!myId) return;
    setAssigning(true);
    try {
      await assignSession(session.uuid, myId);
      onRefresh?.();
    } catch (err) {
      notifyError(extractErrorMessage(err, "Failed to assign this chat to you."));
    } finally {
      setAssigning(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const applyQuickReply = (qr) => {
    setReply(applyQuickReplyTemplate(qr.body, session.user_id, session.customer_name));
    setShowQR(false);
  };

  return (
    <div className="flex flex-col h-full">
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <div className={`flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0 ${headerRightPad ? "pr-12" : ""}`}>
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to all chats"
              className="flex-shrink-0 flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 mr-1"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline text-xs font-medium">All chats</span>
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-800">
                {session.customer_name || `User #${session.user_id}`}
              </h3>
              {session.order_id && (
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">
                  Order {session.order_code || `#${session.order_id}`}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                wsStatus === "connected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {wsStatus === "connected" ? "Live" : "Offline"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Session: {session.uuid?.slice(0, 8)}…</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {session.status !== "resolved" && session.status !== "closed" && (() => {
            const mine = session.assigned_agent_id === getStoredUser()?.Id;
            return (
              <button
                onClick={assignToMe}
                disabled={assigning || mine}
                title={mine ? "Assigned to you" : "Assign this chat to me"}
                className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  mine
                    ? "bg-teal-50 text-teal-700 border-teal-200 cursor-default"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 disabled:opacity-60"
                }`}
              >
                <UserCheck size={13} />
                <span className="hidden sm:inline">
                  {mine ? "Assigned to you" : assigning ? "Assigning…" : "Assign to me"}
                </span>
              </button>
            );
          })()}
          {session.status !== "resolved" && session.status !== "closed" && (
            <button
              onClick={() => onResolve?.(session.uuid)}
              title="Resolve"
              className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-lg border border-green-200 transition-colors"
            >
              <CheckCircle size={13} />
              <span className="hidden sm:inline">Resolve</span>
            </button>
          )}
          <button onClick={fetchMessages} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* No "Customer:" row here - it duplicated the exact same
          customer_name/User #N string already shown as the primary heading
          above, just in smaller secondary text. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0 text-xs">
        {(session.order_code || session.order_id) && (
          <div className="flex items-center gap-1.5">
            <Package size={12} className="text-slate-400" />
            <span className="text-slate-400">Order:</span>
            {session.order_id ? (
              <button
                type="button"
                onClick={() => navigate(`/orders/${session.order_id}`)}
                title="Open order details"
                className="font-semibold font-mono hover:underline text-teal-700"
              >
                {session.order_code || `#${session.order_id}`}
              </button>
            ) : (
              <span className="font-semibold font-mono text-slate-700">{session.order_code}</span>
            )}
            {session.order_code && (
              <button
                onClick={() => navigator.clipboard?.writeText(session.order_code)}
                title="Copy order code"
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              >
                <Copy size={11} />
              </button>
            )}
          </div>
        )}
        {session.issue_category && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Topic:</span>
            <span className="font-semibold text-slate-700 capitalize">{session.issue_category.replace(/_/g, " ")}</span>
          </div>
        )}
        {session.assigned_agent_id && (
          <div className="flex items-center gap-1.5 ml-auto">
            <UserCheck size={12} className="text-teal-500" />
            <span className="text-teal-600 font-semibold">
              {session.assigned_agent_id === getStoredUser()?.Id ? "Assigned to you" : "Assigned"}
            </span>
          </div>
        )}
      </div>

      {session.order_id && <OrderContextPanel orderId={session.order_id} />}

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-xs text-slate-400 gap-2">
            <MessageSquare size={24} className="text-slate-200" />
            <span>No messages yet</span>
          </div>
        ) : (
          messages.map((msg) => <MessageRow key={msg.id} msg={msg} onImageClick={setLightboxUrl} />)
        )}
        <div ref={bottomRef} />
      </div>

      {session.status !== "resolved" && session.status !== "closed" && (
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
          {showQR && quickReplies.length > 0 && (
            <div className="mb-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
              {quickReplies.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => applyQuickReply(qr)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <div className="text-xs font-semibold text-slate-700">{qr.title}</div>
                  <div className="text-[11px] text-slate-400 truncate">{qr.body.replace(/\*\*/g, "")}</div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setShowQR((v) => !v)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors"
              title="Quick replies"
            >
              <Zap size={15} />
            </button>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a reply… (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              className="flex-shrink-0 p-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-200 text-white rounded-xl transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
