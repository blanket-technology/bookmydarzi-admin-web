/**
 * Browser push notifications for the admin panel, via Firebase Cloud
 * Messaging. Additive to the existing WebSocket + toast/bell system
 * (adminWsService.js) - push exists purely to reach staff who have
 * closed the tab or backgrounded the browser, which the WebSocket
 * connection cannot do. While the tab is open and focused, the existing
 * WS "NOTIFICATION" event already delivers the same alert, so the
 * foreground FCM handler below intentionally does not show a second,
 * duplicate notification.
 *
 * Progressive enhancement: if Firebase isn't configured (isPushConfigured
 * is false) or the browser doesn't support the required APIs, every
 * function here is a safe no-op. Nothing about login/the rest of the app
 * depends on push succeeding.
 */

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from "firebase/messaging";
import api from "./api.js";
import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY, isPushConfigured } from "../config/env.js";

const DEVICE_TOKEN_STORAGE_KEY = "bmd_fcm_token";

let messagingInstance = null;

async function getMessagingInstance() {
  if (!isPushConfigured) return null;
  if (!("serviceWorker" in navigator)) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (messagingInstance) return messagingInstance;

  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Request notification permission and register this browser's push token
 * with the backend. Call once after login. Safe to call repeatedly - it's
 * a no-op once already granted+registered, and the backend upserts by
 * token so re-registration is harmless.
 */
export async function requestPushPermission() {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;
    } else if (Notification.permission !== "granted") {
      return false;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;

    await api.post("/notifications/device-tokens", { token, platform: "web" });
    sessionStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);

    // Foreground messages: the WS-driven toast/bell already covers this
    // case (tab open + focused), so this handler intentionally does
    // nothing beyond logging - it exists so the SDK doesn't warn about
    // an unhandled foreground message.
    onMessage(messaging, () => {});

    return true;
  } catch (err) {
    console.warn("Push registration failed", err);
    return false;
  }
}

/** Unregister this browser's push token from the backend. Call on logout. */
export async function unregisterPush() {
  const token = sessionStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    await api.delete("/notifications/device-tokens", { data: { token, platform: "web" } });
  } catch (err) {
    console.warn("Push unregistration (backend) failed", err);
  }

  try {
    const messaging = await getMessagingInstance();
    if (messaging) await deleteToken(messaging);
  } catch (err) {
    console.warn("Push unregistration (FCM) failed", err);
  }

  sessionStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
}
