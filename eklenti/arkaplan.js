/*! FonRota eklentisi — arka plan: sağ tık menüsü ve FonRota sitesinden açılan sekmelerde otomatik doldurma */
importScripts("ayar.js", "ortak.js");
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "fonrota", title: "FonRota ile doldur", contexts: ["editable"] });
    Object.entries(ALAN_ADI).forEach(([k, ad]) => chrome.contextMenus.create({ id: "f:" + k, parentId: "fonrota", title: ad, contexts: ["editable"] }));
  });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!String(info.menuItemId).startsWith("f:") || !tab) return;
  const k = String(info.menuItemId).slice(2), kayit = await depo.al("profil");
  const hedef = { tabId: tab.id, frameIds: [info.frameId || 0] };
  if (!kayit) return chrome.scripting.executeScript({ target: hedef, func: () => alert("FonRota: önce FonRota sitesinde giriş yapıp “Kurumun sitesinde otomatik doldur”a bas ya da eklenti simgesinden giriş yap.") });
  await chrome.scripting.executeScript({ target: hedef, files: ["doldur.js"] });
  const [r] = await chrome.scripting.executeScript({ target: hedef, func: (p, k, a) => window.__fonrota.alanaYaz(p, k, a), args: [kayit.p, k, ALAN_ADI] });
  if (r && r.result && r.result.hata) chrome.scripting.executeScript({ target: hedef, func: m => alert("FonRota: " + m), args: [r.result.hata] });
});

/* FonRota sitesi -> kurumun sitesi: sekmeyi aç, 30 dakika boyunca o sekmede yüklenen her sayfada formu doldur
   (kurumun ilk sayfası bilgi sayfasıysa, kullanıcı forma geçtiğinde de dolar). */
const SURE = 30 * 60 * 1000;
const takip = { al: async () => (await chrome.storage.session.get("takip")).takip || {}, yaz: t => chrome.storage.session.set({ takip: t }) };
chrome.runtime.onMessage.addListener((m, gonderen, cevap) => {
  if (m.tip !== "ac" || !gonderen.tab || !gonderen.url || !gonderen.url.startsWith(AYAR.SITE_URL.replace(/\/$/, "")) && !/^http:\/\/localhost[:/]/.test(gonderen.url)) return;
  (async () => {
    if (m.profil && typeof m.profil === "object") await depo.yaz("profil", { p: m.profil, zaman: Date.now(), email: m.profil.eposta || "", kaynak: "site" });
    if (!(await depo.al("profil"))) return cevap({ hata: "Profil yok. FonRota sitesinde giriş yap." });
    const tab = await chrome.tabs.create({ url: m.url, index: gonderen.tab.index + 1 });
    const t = await takip.al(); t[tab.id] = { bitis: Date.now() + SURE, ad: m.ad }; await takip.yaz(t);
    cevap({ tamam: true });
  })();
  return true;
});
chrome.tabs.onUpdated.addListener(async (id, degisim, tab) => {
  if (degisim.status !== "complete" || !/^https?:/.test(tab.url || "")) return;
  const t = await takip.al(); const k = t[id]; if (!k) return;
  if (Date.now() > k.bitis) { delete t[id]; return takip.yaz(t); }
  const kayit = await depo.al("profil"); if (!kayit) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: id, allFrames: true }, files: ["doldur.js"] });
    await chrome.scripting.executeScript({ target: { tabId: id, allFrames: true }, func: (p, a, ad) => window.__fonrota.otomatik(p, a, ad), args: [kayit.p, ALAN_ADI, k.ad || ""] });
  } catch (e) { /* bu siteye izin yok: kullanıcı eklenti simgesinden "Bu sayfayı doldur" ile doldurabilir */ chrome.action.setBadgeText({ tabId: id, text: "!" }); chrome.action.setTitle({ tabId: id, title: "FonRota: bu sayfayı doldurmak için tıkla" }); }
});
chrome.tabs.onRemoved.addListener(async id => { const t = await takip.al(); if (t[id]) { delete t[id]; takip.yaz(t); } });
