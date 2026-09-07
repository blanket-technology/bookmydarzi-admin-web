import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

// The real-time WebSocket (adminWsService.js) can be dead - mid-reconnect
// after a server restart, a brief network blip that killed the TCP
// connection but not general connectivity, or the gap right after the tab
// regains focus - while the browser's own internet connection is fine.
// Previously there was zero visible signal for this: an admin could be
// sitting on a silently-dead real-time connection, missing live order/
// dashboard updates entirely until the next reconnect happened to succeed,
// with nothing on screen suggesting anything was wrong.
//
// Deliberately does NOT show for the "connecting" status - that's the
// normal first moment after every login/page load, and flashing a warning
// banner on every load would train admins to ignore it. Only shows once
// the socket has actually gone from connected to disconnected (a real
// drop), and never while the browser itself is offline (navigator.onLine
// false) - that's a more basic problem the browser already makes obvious.
export default function ConnectionStatusBanner() {
  const [wsStatus, setWsStatus] = useState("connecting");
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const onStatus = (e) => setWsStatus(e.detail?.status ?? "connecting");
    window.addEventListener("bmd:WS_STATUS", onStatus);
    return () => window.removeEventListener("bmd:WS_STATUS", onStatus);
  }, []);

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const show = browserOnline && wsStatus === "disconnected";
  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 bg-amber-700 px-5 py-3 text-white shadow-lg"
      role="status"
    >
      <RefreshCw size={16} className="animate-spin" />
      <span className="text-sm font-semibold tracking-wide">Reconnecting live updates…</span>
    </div>
  );
}
