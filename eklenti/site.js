/*! FonRota eklentisi — FonRota sitesiyle bağlantı. Site "kurumun sitesinde doldur" dediğinde
   eklentiye haber verir; eklenti kurumun sayfasını açar ve form yüklenince kendiliğinden doldurur. */
document.documentElement.dataset.fonrotaEklenti = chrome.runtime.getManifest().version;
window.addEventListener("message", e => {
  if (e.source !== window || e.origin !== location.origin) return;
  const m = e.data; if (!m || m.kaynak !== "fonrota-site" || m.tip !== "ac" || !/^https?:\/\//.test(m.url || "")) return;
  chrome.runtime.sendMessage({ tip: "ac", url: m.url, profil: m.profil || null, ad: m.ad || "" }, r => {
    window.postMessage({ kaynak: "fonrota-eklenti", tip: "acildi", tamam: !!(r && r.tamam), hata: r && r.hata }, location.origin);
  });
});
