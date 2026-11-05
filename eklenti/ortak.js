/*! FonRota eklentisi — hesap ve profil (Supabase). Profil yalnızca bu tarayıcıdaki eklenti deposunda tutulur; "Çıkış" siler. */
// AYAR: tools/eklenti.py config.js'den yazar (ayar.js)
const ALAN_ADI = { firmaUnvani: "Firma ünvanı", vkn: "Vergi kimlik no", vergiDairesi: "Vergi dairesi", sirketTuru: "Şirket türü", kurulusYili: "Kuruluş yılı",
  naceKodu: "NACE kodu", calisan: "Çalışan sayısı", ciro: "Yıllık net satış", yetkili: "Yetkili adı soyadı", telefon: "Telefon", eposta: "E-posta", il: "İl", adres: "Adres" };

async function sb(yol, { method = "GET", body, token } = {}) {
  const r = await fetch(AYAR.SUPABASE_URL + yol, { method, headers: { apikey: AYAR.SUPABASE_ANON_KEY, Authorization: "Bearer " + (token || AYAR.SUPABASE_ANON_KEY), "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "Sunucu hatası (" + r.status + ")");
  return j;
}
const depo = { al: k => chrome.storage.local.get(k).then(o => o[k]), yaz: (k, v) => chrome.storage.local.set({ [k]: v }), sil: k => chrome.storage.local.remove(k) };

async function girisYap(email, password) {
  let o;
  try { o = await sb("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } }); }
  catch (e) { throw new Error(/invalid|credentials/i.test(e.message) ? "E-posta veya şifre hatalı." : /confirm/i.test(e.message) ? "Önce e-postana gelen onay bağlantısına tıkla." : e.message); }
  await depo.yaz("oturum", { access: o.access_token, refresh: o.refresh_token, bitis: Date.now() + (o.expires_in - 60) * 1000, id: o.user.id, email: o.user.email });
  return profilYenile();
}
async function token() {
  const s = await depo.al("oturum"); if (!s) throw new Error("Önce FonRota hesabınla giriş yap.");
  if (Date.now() < s.bitis) return s;
  const o = await sb("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh } });
  const y = { ...s, access: o.access_token, refresh: o.refresh_token, bitis: Date.now() + (o.expires_in - 60) * 1000 }; await depo.yaz("oturum", y); return y;
}
async function profilYenile() {
  const s = await token();
  const r = await sb(`/rest/v1/profiles?select=data,ad,email&id=eq.${encodeURIComponent(s.id)}`, { token: s.access });
  const p = (r[0] && r[0].data) || {}; if (!p.eposta) p.eposta = s.email; if (!p.yetkili && r[0] && r[0].ad) p.yetkili = r[0].ad;
  await depo.yaz("profil", { p, zaman: Date.now(), email: s.email }); return p;
}
async function cikis() { await depo.sil("oturum"); await depo.sil("profil"); }
