// Firebase Cloud Messaging background service worker.
//
// This file is served as-is from the site root (Vite copies public/ files
// unchanged) so it can NOT use import.meta.env - there is no build step for
// service workers. The values below are the Firebase web config, which is
// public by Firebase's own design (it identifies the project to the
// browser; it is not a secret), so hardcoding it here is expected and safe.
//
// Fill these in from Firebase console > Project settings > General >
// "Your apps" > Web app > SDK setup and configuration. Must match the
// VITE_FIREBASE_* values in .env exactly, or push tokens obtained by the
// app won't be deliverable by this worker.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDyZG2VorbuXWW8LUdPGPrW-nH427pzHEk",
  authDomain: "bookmydarzi-3b472.firebaseapp.com",
  projectId: "bookmydarzi-3b472",
  storageBucket: "bookmydarzi-3b472.firebasestorage.app",
  messagingSenderId: "906446329135",
  appId: "1:906446329135:web:52ea699fadc7664134fdda",
});

const messaging = firebase.messaging();

// Fires only when the admin panel tab is closed or backgrounded - the
// foreground case is already handled by the existing WebSocket-driven
// toast/bell (adminWsService.js), so no duplicate notification is shown
// there (see src/services/pushService.js's onMessage handler).
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "BookMyDarzi";
  const body = payload.notification?.body || payload.data?.body || "";

  self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: payload.data || {},
    tag: payload.data?.notification_id || undefined,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deep_link;
  const url = deepLink || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
