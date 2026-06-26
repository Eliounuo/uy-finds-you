// YURTA notifications service worker.
// Handles native push events, in-page show-notification messages, and clicks.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "YURTA", body: "", url: "/" };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (_) {
    /* noop */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    }),
  );
});

// Bridge from page → SW: show a notification with a clickable URL.
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || msg.type !== "show-notification") return;
  const { title, body, url, tag } = msg;
  self.registration.showNotification(title || "YURTA", {
    body: body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: tag,
    data: { url: url || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        try {
          await client.navigate(url);
        } catch (_) {
          /* cross-origin or unsupported, ignore */
        }
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })(),
  );
});
