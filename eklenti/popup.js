/*! FonRota eklentisi — açılır pencere */
const kok = document.getElementById("kok");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const BELGE = /\.(pdf|docx?)([?#]|$)/i;
const formSayfasi = url => chrome.tabs.create({ url: chrome.runtime.getURL("form.html" + (url ? "?url=" + encodeURIComponent(url) : "")) });
async function ciz() {
  const kayit = await depo.al("profil");
  if (!kayit) return girisCiz();
  const [sekme] = await chrome.tabs.query({ active: true, currentWindow: true });
  const belge = sekme && sekme.url && (BELGE.test(sekme.url) || (/^file:/.test(sekme.url) && /\.(pdf|docx?)$/i.test(sekme.url)));
  const p = kayit.p, dolu = Object.keys(ALAN_ADI).filter(k => p[k]);
  kok.innerHTML = `<h2>${esc(p.firmaUnvani || "Firma bilgilerin")}</h2>
    <p class="muted">${esc(kayit.hesap || kayit.email)} · ${dolu.length}/${Object.keys(ALAN_ADI).length} bilgi dolu${kayit.kaynak === "site" ? " · sitedeki hesabından" : ""}</p>
    <p>Başvuru formunu aç, sonra aşağıdaki düğmeye bas. Doldurulan alanlar altın renkle işaretlenir; <b>kontrol edip formu kendin gönder.</b></p>
    ${belge ? `<button class="ana" id="belge">Bu PDF/Word formunu doldur</button><p class="muted" style="margin-top:6px">Doldurulmuş kopyası yeni sekmede açılır.</p>` : `<button class="ana" id="doldur">Bu sayfayı doldur</button>`}
    <div id="sonuc"></div>
    ${belge ? "" : `<button class="kucuk" id="pdf" style="width:100%;margin-top:8px">📄 PDF ya da Word başvuru formu doldur</button>`}
    <p class="muted" style="margin-top:10px">Bir alan dolmadıysa o alana sağ tıkla › <b>FonRota ile doldur</b> › bilgiyi seç.</p>
    <div class="satir"><button class="kucuk" id="yenile">Profili yenile</button><a href="${AYAR.SITE_URL}hesap.html?sekme=profil" target="_blank">Profili düzenle</a><button class="kucuk" id="cikis">Çıkış</button></div>`;
  if (belge) document.getElementById("belge").onclick = () => formSayfasi(sekme.url);
  else { document.getElementById("doldur").onclick = doldur; document.getElementById("pdf").onclick = () => formSayfasi(""); }
  document.getElementById("yenile").onclick = async () => {
    if (!(await depo.al("oturum"))) { chrome.tabs.create({ url: AYAR.SITE_URL + "hesap.html?sekme=profil" }); return goster(`<div class="sonuc">FonRota sitesini açtım. Sitede hangi hesapla giriş yaptıysan eklenti onun bilgilerini kullanır.</div>`); }
    try { await profilYenile(); ciz(); } catch (e) { goster(`<span class="hata">${esc(e.message)}</span>`); } };
  document.getElementById("cikis").onclick = async () => { await cikis(); ciz(); };
}
function girisCiz() {
  kok.innerHTML = `<h2>FonRota hesabınla giriş yap</h2>
    <p class="muted">Firma bilgilerin hesabından alınır. Hesabın yoksa <a href="${AYAR.SITE_URL}hesap.html?sekme=kayit" target="_blank">ücretsiz aç</a>.</p>
    <form id="f"><label for="e">E-posta</label><input id="e" type="email" autocomplete="username" required>
    <label for="s">Şifre</label><input id="s" type="password" autocomplete="current-password" required>
    <button class="ana" type="submit">Giriş yap</button><div class="hata" id="h"></div></form>`;
  document.getElementById("f").onsubmit = async ev => {
    ev.preventDefault(); const h = document.getElementById("h"); h.textContent = "Giriş yapılıyor…";
    try { await girisYap(document.getElementById("e").value.trim(), document.getElementById("s").value); ciz(); }
    catch (e) { h.textContent = e.message; }
  };
}
const goster = html => { const s = document.getElementById("sonuc"); if (s) s.innerHTML = html; };

async function doldur() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:|^file:/.test(tab.url || "")) return goster(`<div class="sonuc">Bu sayfa doldurulamaz. Başvuru formunun olduğu sekmeyi aç.</div>`);
    const p = (await depo.al("profil")).p;
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["doldur.js"] });
    const r = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: (p, a) => { const r = window.__fonrota.doldur(p, a); window.__fonrota.otomatik(p, a, ""); return r; }, args: [p, ALAN_ADI] });
    const dolan = [...new Set(r.flatMap(x => (x.result && x.result.dolan) || []))], bos = [...new Set(r.flatMap(x => (x.result && x.result.bos) || []))];
    goster(`<div class="sonuc">${dolan.length ? `<b class="ok">✓ ${dolan.length} alan dolduruldu</b>${esc(dolan.join(", "))}` : "<b>Tanıdığım bir alan bulamadım.</b>Alanlara sağ tıklayıp elle doldurabilirsin."}
      ${bos.length ? `<p class="muted" style="margin:6px 0 0">Profilinde boş olduğu için doldurulamadı: ${esc(bos.join(", "))}.</p>` : ""}</div>`);
  } catch (e) { goster(`<div class="sonuc hata">${esc(e.message.includes("Cannot access") ? "Tarayıcı bu sayfaya erişime izin vermiyor." : e.message)}</div>`); }
}
ciz();
