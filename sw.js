// Hizmet çalışanı: telefona kurulabilmek için gerekli; sayfaları önbelleğe almaz (site her zaman güncel açılır).
// Anlık bildirimler (Web Push). Sunucu tarafı: scraper/notify.py
self.addEventListener("push", e => {
  let d = {}; try { d = e.data.json(); } catch { d = { title: "Yeni destek", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Sana uygun yeni destek", { body: d.body || "", data: { url: d.url || "hesap.html?sekme=bildirimler" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  // Göreli adresleri sitenin kendi klasörüne göre çöz (ör. github.io/fonrota/).
  const url = new URL(String(e.notification.data.url).replace(/^\//, ""), self.registration.scope).href;
  e.waitUntil(clients.openWindow(url));
});
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
