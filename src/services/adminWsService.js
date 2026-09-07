/**
 * Singleton WebSocket client for the admin panel.
 *
 * Events received:
 *   NEW_ORDER            → toast + bmd:NEW_ORDER CustomEvent
 *   ORDER_STATUS_UPDATED → toast + bmd:ORDER_STATUS_UPDATED CustomEvent
 *   BILLING_UPDATED      → bmd:BILLING_UPDATED CustomEvent
 *   HOME_UPDATED         → bmd:HOME_UPDATED CustomEvent
 *
 * Also dispatches its own connection lifecycle as bmd:WS_STATUS
 * ({ detail: { status: "connecting" | "connected" | "disconnected" } }) -
 * previously nothing surfaced this at all, so an admin could be sitting on
 * a dead/reconnecting socket (server restart, brief network blip) with zero
 * visible indication, silently missing live order/dashboard updates until
 * the connection happened to recover.
 */

import { WS_BASE_URL } from "../config/env.js";
import { refreshAccessToken } from "./api.js";

const HEARTBEAT_INTERVAL_MS = 25_000; // keep Railway proxy alive (closes idle ~60s)

class AdminWsService {
  constructor() {
    this.ws = null;
    this.shouldConnect = false;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.reconnectDelay = 3000;
  }

  connect() {
    this.shouldConnect = true;
    this._open();
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._stopHeartbeat();
    if (this.ws) {
      const dead = this.ws;
      this.ws = null;
      dead.onopen = null;
      dead.onmessage = null;
      dead.onerror = null;
      dead.onclose = null;
      // Do NOT call close() while the socket is still CONNECTING.
      // React Strict Mode runs useEffect cleanup before the first connection
      // completes; calling close() on a CONNECTING socket triggers Chrome's
      // "WebSocket is closed before the connection is established" error.
      // The socket will be abandoned once it opens and finds no handlers.
      if (dead.readyState !== WebSocket.CONNECTING) {
        dead.close();
      }
    }
  }

  _startHeartbeat(ws) {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws === ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "ping" }));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _open() {
    if (!this.shouldConnect) return;

    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const wsBase = WS_BASE_URL;
    // Do NOT put the JWT in the URL query string - it leaks into proxy/server
    // access logs (Railway logs these), browser history and Referer headers.
    // The backend supports (and prefers) authenticating via the first frame
    // instead: connect tokenless, then send {"type":"auth","token":...} within
    // its AUTH_TIMEOUT window. See app/core/websocket_auth.py.
    const url = `${wsBase}/ws`;

    let ws;
    try {
      ws = new WebSocket(url);
      this._dispatchStatus("connecting");
    } catch {
      this._scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return;
      // Authenticate over the (encrypted, non-logged) frame body, not the URL.
      try {
        ws.send(JSON.stringify({ type: "auth", token }));
      } catch {
        // If the auth frame can't be sent the server will time out and close;
        // onclose then triggers a reconnect.
      }
      this.reconnectDelay = 3000;
      this._startHeartbeat(ws);
      this._dispatchStatus("connected");
      console.log("[AdminWS] Connected");
    };

    ws.onmessage = (e) => {
      if (this.ws !== ws) return;
      try {
        const { event, data } = JSON.parse(e.data);
        this._handle(event, data);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      // Do NOT call ws.close() here. When the socket is still in CONNECTING
      // state (e.g. the server rejected the upgrade due to an expired token),
      // calling close() produces the Chrome error
      // "WebSocket is closed before the connection is established."
      // The browser closes the socket automatically after onerror; onclose
      // fires next and triggers the reconnect.
    };

    ws.onclose = (e) => {
      if (this.ws !== ws) return;
      this.ws = null;
      this._stopHeartbeat();
      // Only surface "disconnected" while we're still trying to stay
      // connected - a deliberate disconnect() (logout, unmount) already set
      // shouldConnect false first, so that case never shows an alarming
      // status for what is actually expected, intentional teardown.
      if (this.shouldConnect) this._dispatchStatus("disconnected");
      console.log("[AdminWS] Disconnected (code=%d) - reconnecting in %dms", e.code, this.reconnectDelay);
      this._scheduleReconnect();
    };
  }

  _dispatchStatus(status) {
    window.dispatchEvent(new CustomEvent("bmd:WS_STATUS", { detail: { status } }));
  }

  _handle(event, data) {
    window.dispatchEvent(new CustomEvent(`bmd:${event}`, { detail: data }));

    if (event === "NEW_ORDER") {
      const code = data?.order_code ?? `#${data?.order_id}`;
      this._toast(`New order received: ${code}`, "success");
    }
    if (event === "ORDER_STATUS_UPDATED") {
      const code = data?.order_code ?? `#${data?.order_id}`;
      const status = (data?.status ?? "").replace(/_/g, " ");
      this._toast(`Order ${code} → ${status}`, "info");
    }
  }

  _toast(msg, type = "info") {
    window.dispatchEvent(new CustomEvent("bmd:toast", { detail: { msg, type } }));
  }

  _scheduleReconnect() {
    if (!this.shouldConnect) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30_000);
      // Refresh the JWT before reconnecting so an expired access token
      // doesn't put us in a permanent reconnect loop.
      await this._refreshAccessToken();
      this._open();
    }, this.reconnectDelay);
  }

  async _refreshAccessToken() {
    try {
      await refreshAccessToken();
    } catch {
      // Shared refresh helper already handled logout/cleanup.
    }
  }
}

export const adminWsService = new AdminWsService();
