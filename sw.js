// Anlık bildirimler (Web Push). Sunucu tarafı: scraper/notify.py
self.addEventListener("push", e => {
  let d = {}; try { d = e.data.json(); } catch { d = { title: "Yeni destek", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Sana uygun yeni destek", { body: d.body || "", data: { url: d.url || "/hesap.html?sekme=bildirimler" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
