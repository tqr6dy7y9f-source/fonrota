/*! FonRota eklentisi — sağ tık menüsü: bir alana tek bir bilgiyi yazar */
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
  if (!kayit) return chrome.scripting.executeScript({ target: hedef, func: () => alert("FonRota: önce eklenti simgesine tıklayıp hesabınla giriş yap.") });
  await chrome.scripting.executeScript({ target: hedef, files: ["doldur.js"] });
  const [r] = await chrome.scripting.executeScript({ target: hedef, func: (p, k, a) => window.__fonrota.alanaYaz(p, k, a), args: [kayit.p, k, ALAN_ADI] });
  if (r && r.result && r.result.hata) chrome.scripting.executeScript({ target: hedef, func: m => alert("FonRota: " + m), args: [r.result.hata] });
});
