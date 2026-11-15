// FINN service worker: makes the app installable and shows push notifications.
// It deliberately caches nothing — filings must always be fresh, and the server already caches.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// A fetch handler is part of what makes Chrome offer "Install app"; it just passes through.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { title: "FINN", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.title || "FINN", {
      body: d.body || "",
      tag: d.tag || "finn",
      renotify: !!d.tag,
      icon: "/app-icon/192",
      badge: "/app-icon/192",
      data: { url: d.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
