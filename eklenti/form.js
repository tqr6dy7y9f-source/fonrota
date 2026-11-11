/*! FonRota eklentisi — PDF/Word başvuru formu doldurma sayfası.
   form.html?url=<adres>: o adresteki formu indirip doldurur (kurum sitesindeki bağlantı ya da açık PDF sekmesi).
   Adres yoksa ya da indirilemezse kullanıcı dosyayı kendisi yükler. */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
FormDoldur.kok = chrome.runtime.getURL("");
let profil = null, sonBlob = null;

async function hazirla() {
  const kayit = await depo.al("profil");
  if (!kayit) {
    $("#profil").innerHTML = `<b>Önce FonRota hesabınla giriş yap.</b><span class="muted">FonRota sitesinde giriş yaptığında bilgilerin eklentiye kendiliğinden gelir. <a href="${AYAR.SITE_URL}hesap.html" target="_blank">FonRota’yı aç</a></span>`;
    $("#birak").hidden = true; return;
  }
  profil = kayit.p;
  const dolu = Object.keys(ALAN_ADI).filter(k => profil[k]).length;
  $("#profil").innerHTML = `<b>${esc(profil.firmaUnvani || "Firma bilgilerin")}</b><span class="muted">${esc(kayit.hesap || kayit.email || "")} · ${dolu}/${Object.keys(ALAN_ADI).length} bilgi dolu · <a href="${AYAR.SITE_URL}hesap.html?sekme=profil" target="_blank">profili düzenle</a></span>`;
  const url = new URLSearchParams(location.search).get("url");
  if (url) await adrestenDoldur(url);
}

async function adrestenDoldur(url) {
  const ad = decodeURIComponent(url.split("?")[0].split("/").pop() || "basvuru-formu");
  $("#kaynak").hidden = false;
  $("#kaynak").innerHTML = `<b>Form: ${esc(ad)}</b><span class="muted">${esc(url)}</span>`;
  durum("Form indiriliyor…");
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error("Sunucu " + r.status + " döndü");
    await doldur(await r.arrayBuffer(), ad);
  } catch (e) {
    const dosya = url.startsWith("file:");
    durum(dosya
      ? "Bilgisayarındaki dosyayı okumak için izin gerekiyor: chrome://extensions › FonRota › Ayrıntılar › “Dosya URL’lerine erişime izin ver”i aç. Ya da dosyayı aşağıya sürükle."
      : "Form bu adresten indirilemedi (" + e.message + "). Formu bilgisayarına indirip aşağıya sürükle.", true);
  }
}

function durum(t, hata = false) { $("#durum").textContent = t; $("#durum").style.color = hata ? "var(--no)" : ""; }

async function doldur(bytes, ad) {
  $("#sonuc").innerHTML = ""; durum("Form dolduruluyor…");
  try {
    const r = await FormDoldur.doldur(bytes, ad, profil, ALAN_ADI);
    if (sonBlob) URL.revokeObjectURL(sonBlob);
    sonBlob = URL.createObjectURL(r.blob);
    const yeniAd = FormDoldur.dosyaAdi(ad, r.uzanti);
    durum("");
    $("#sonuc").innerHTML = `<div class="kutu">
      ${r.dolan.length ? `<b class="ok">✓ ${r.dolan.length} alan dolduruldu</b>` : `<b>Bu formda tanıdığım bir alan bulamadım.</b><span class="muted">Form taranmış bir resim olabilir ya da etiketleri alışılmışın dışında olabilir. Dosyayı yine de indirebilir, alanları elle doldurabilirsin.</span>`}
      <div class="dugmeler">
        ${r.uzanti === "pdf" ? `<a href="${sonBlob}" target="_blank" rel="noopener">Doldurulmuş PDF’i aç</a>` : ""}
        <a href="${sonBlob}" download="${esc(yeniAd)}" class="${r.uzanti === "pdf" ? "ikincil" : ""}">İndir (${r.uzanti.toUpperCase()})</a>
      </div>
      ${r.uzanti === "docx" ? `<p class="muted">Word’de açıp kontrol et. Kurum PDF istiyorsa Word’de <b>Dosya › Farklı Kaydet › PDF</b> ile kaydet.</p>` : ""}
      ${r.dolan.length ? `<table><tr><th>Formdaki etiket</th><th>Yazılan</th></tr>${r.dolan.map(d => `<tr><td>${esc(d.etiket)}${d.sayfa ? ` <span class="muted">(s. ${d.sayfa})</span>` : ""}</td><td class="d">${esc(d.deger)}</td></tr>`).join("")}</table>` : ""}
      ${r.bos.length ? `<p class="muted" style="margin-top:8px">Formda var ama profilinde boş ya da geçersiz: ${esc(r.bos.join(", "))}. <a href="${AYAR.SITE_URL}hesap.html?sekme=profil" target="_blank">Profilini tamamla</a></p>` : ""}
    </div>`;
  } catch (e) { durum(e.message, true); }
}

const birak = $("#birak");
$("#dosya").onchange = async e => { const f = e.target.files[0]; if (f) { $("#kaynak").hidden = true; await doldur(await f.arrayBuffer(), f.name); } e.target.value = ""; };
["dragenter", "dragover"].forEach(t => birak.addEventListener(t, e => { e.preventDefault(); birak.classList.add("uzerinde"); }));
["dragleave", "drop"].forEach(t => birak.addEventListener(t, e => { e.preventDefault(); birak.classList.remove("uzerinde"); }));
birak.addEventListener("drop", async e => { const f = e.dataTransfer.files[0]; if (f) { $("#kaynak").hidden = true; await doldur(await f.arrayBuffer(), f.name); } });
hazirla();
