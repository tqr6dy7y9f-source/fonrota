/*! FonRota — © 2026 [Ad Soyad]. Tüm hakları saklıdır. İzinsiz kopyalanamaz ve dağıtılamaz. */
/* FonRota – çekirdek: yardımcılar, veri, hesap, uygunluk, yapay zekâ, PDF */
(function () {
const C = window.CONFIG || {};
const BUNDLE = !!window.__BUNDLE__;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const low = s => String(s || "").toLocaleLowerCase("tr");
const tl = n => n == null || n === "" || isNaN(n) ? "" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
const short = n => n >= 1e9 ? (n / 1e9).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " milyar ₺" : n >= 1e6 ? (n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " milyon ₺" : tl(n);
const num = v => { if (v === "" || v == null) return null; const n = Number(String(v).replace(/\./g, "").replace(",", ".")); return isNaN(n) ? null : n; };
const today = () => new Date().toLocaleDateString("tr-TR");
function sfx(w) { const v = [...low(w)].reverse().find(c => "aeıioöuü".includes(c)); const back = "aıou".includes(v); const hard = "fstkçşhp".includes(low(w).slice(-1)); return (hard ? "t" : "d") + (back ? "a" : "e"); }
function toast(msg, ms = 3200) { const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), ms); }

const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Şırnak","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];
const OLCEK = { mikro: "Mikro işletme", kucuk: "Küçük işletme", orta: "Orta büyüklükte işletme", buyuk: "Büyük işletme" };
const SEKTOR = { imalat: "İmalat", tarim: "Tarım ve gıda", bilisim: "Yazılım ve bilişim", turizm: "Turizm", enerji: "Enerji", saglik: "Sağlık", ticaret: "Ticaret", hizmet: "Hizmet", insaat: "İnşaat", lojistik: "Lojistik", tumu: "Tüm sektörler" };
const AMAC = { yatirim: "Makine ve yatırım", arge: "Ar-Ge ve inovasyon", dijital: "Dijitalleşme", ihracat: "İhracat ve yurt dışı", istihdam: "İstihdam ve eğitim", finansman: "Kredi ve finansman", vergi: "Vergi ve prim avantajı", yesil: "Enerji ve yeşil dönüşüm", kurulus: "Kuruluş ve büyüme", bolgesel: "Bölgesel hibeler" };
const TUR = { hibe: "Hibe", kredi: "Kredi", vergi: "Vergi / prim avantajı" };
const SIRKET = ["Şahıs şirketi", "Limited şirket", "Anonim şirket", "Kooperatif", "Diğer"];

/* Profil alanları: etiket, tür, kayıtta sorulur mu */
const ALANLAR = {
  firmaUnvani: { e: "Firma ünvanı", k: true },
  vkn: { e: "Vergi kimlik no", k: true, ph: "10 haneli" },
  vergiDairesi: { e: "Vergi dairesi", k: true },
  sirketTuru: { e: "Şirket türü", k: true, sec: SIRKET },
  kurulusYili: { e: "Kuruluş yılı", k: true, t: "number" },
  naceKodu: { e: "NACE kodu", k: true, ph: "ör. 31.09", yardim: "Vergi levhanda ‘ana faaliyet kodu’ olarak yazar." },
  calisan: { e: "Çalışan sayısı", k: true, t: "number" },
  ciro: { e: "Yıllık net satış (TL)", k: true, t: "number" },
  yetkili: { e: "Yetkili adı soyadı", k: true },
  telefon: { e: "Telefon", k: true, t: "tel" },
  eposta: { e: "E-posta", k: true, t: "email" },
  il: { e: "İl", k: true, sec: ILLER },
  adres: { e: "Adres", k: true },
  projeAdi: { e: "Proje adı" },
  projeOzeti: { e: "Proje özeti", uzun: true },
  projeSuresi: { e: "Proje süresi (ay)", t: "number" },
  projeButcesi: { e: "Proje bütçesi (TL)", t: "number" },
  talepTutari: { e: "Talep edilen destek (TL)", t: "number" }
};

/* ---------- Sayfa geçişleri (çok sayfalı site; önizlemede tek dosya) ---------- */
function params() { return new URLSearchParams(BUNDLE ? (window.__Q || "") : location.search); }
function href(page, q = "") { return BUNDLE ? `#${page}` : `${page}.html${q ? "?" + q : ""}`; }
function link(page, q = "") { return `href="${href(page, q)}"` + (BUNDLE ? ` data-q="${esc(q)}"` : ""); }
function go(page, q = "") {
  if (!BUNDLE) { location.href = href(page, q); return; }
  window.__Q = q;
  if (location.hash === "#" + page) window.__route(); else location.hash = page;
}

/* ---------- Varlıklar (veri, PDF, font) ---------- */
function b64ToBuf(b) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
async function asset(path) {
  if (window.__ASSETS__ && window.__ASSETS__[path]) return b64ToBuf(window.__ASSETS__[path]);
  const r = await fetch(path); if (!r.ok) throw new Error(path + " okunamadı"); return r.arrayBuffer();
}
async function assetJSON(path) {
  if (window.__ASSETS__ && window.__ASSETS__[path]) return JSON.parse(new TextDecoder().decode(b64ToBuf(window.__ASSETS__[path])));
  try { const r = await fetch(path, { cache: "no-store" }); return r.ok ? await r.json() : null; } catch { return null; }
}
let _data;
async function data() {
  if (_data) return _data;
  let d = null;
  if (!BUNDLE) d = await assetJSON("data.json");
  if (!d || !Array.isArray(d.destekler)) d = window.__SEED__;
  // Şimdilik yalnızca mevcut şirketler ve KOBİ'ler
  d.destekler = d.destekler.filter(x => !(x.olcek || []).every(o => o === "arastirmaci" || o === "girisimci"));
  _data = d; return d;
}
const byId = async id => (await data()).destekler.find(x => x.id === id);

/* ---------- Tarayıcı deposu ---------- */
const LS = {
  get(k, d = null) { try { const v = localStorage.getItem("db." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("db." + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("db." + k); } catch {} }
};

/* ---------- Dil: İngilizce, Google Çeviri ile otomatik (yeni eklenen içerik de çevrilir) ---------- */
function lang() { return /(?:^|;\s*)googtrans=\/tr\/en/.test(document.cookie) ? "en" : "tr"; }
function setLang(l) {
  const exp = l === "en" ? "" : ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "googtrans=" + (l === "en" ? "/tr/en" : "") + ";path=/" + exp;
  document.cookie = "googtrans=" + (l === "en" ? "/tr/en" : "") + ";path=" + location.pathname.replace(/[^/]*$/, "") + exp;
  location.reload();
}
if (lang() === "en") {
  document.documentElement.lang = "en";
  const box = document.createElement("div"); box.id = "gt"; box.style.display = "none";
  (document.body || document.documentElement).appendChild(box);
  window.gtInit = () => new google.translate.TranslateElement({ pageLanguage: "tr", includedLanguages: "en", autoDisplay: false }, "gt");
  loadScript("https://translate.google.com/translate_a/element.js?cb=gtInit").catch(() => {});
}

/* ---------- Hesap ve kayıtlar: Supabase varsa orada, yoksa tarayıcıda (demo) ---------- */
let sb = null;
async function supa() {
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return null;
  if (sb) return sb;
  await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js");
  sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY); return sb;
}
/* Yönetici (test) hesabı: config.js'deki YONETICI_EPOSTALARI ile tanınır; şifresi kodda yoktur, hesap sahibi belirler.
   Yönetim sekmesini görür ama yalnızca kendi profilini görür, başka kullanıcıların verisine erişemez.
   Profili boşsa ilk girişte aşağıdaki örnek (test) profil yüklenir. */
const yonetici = email => (C.YONETICI_EPOSTALARI || []).map(e => e.toLowerCase()).includes(String(email || "").toLowerCase());
const TEST_PROFIL = { firmaUnvani: "TechNova Mobilya Ltd. Şti. (TEST)", vkn: "0000000000", vergiDairesi: "Samsun", sirketTuru: "Limited şirket",
  kurulusYili: "2018", naceKodu: "31.09", calisan: "25", ciro: "40000000", yetkili: "Test Yönetici", telefon: "0000 000 00 00",
  eposta: "test@fonrota.local", il: "Samsun", adres: "Test adresi", isletmeTipi: "sirket", sektorler: ["imalat"], amaclar: ["yatirim", "ihracat"],
  ihracat: true, borcYok: true, isTanimi: "Samsun’da 25 kişiyle mobilya üretiyoruz. CNC makinesi almak ve ihracata başlamak istiyoruz.", test: true };
/* Supabase bağlıyken hesap verileri tarayıcıda tutulmaz. Bu anahtarlar yalnızca hesapsız (misafir) test için
   kullanılır; giriş yapılınca hesaba aktarılır ve çıkışta silinir. */
function yerelHesapVerisiniSil(cikis = true) {
  ["profile", "draft", "apps", "notifs", "secim", "user", ...(cikis ? ["kars", "mmFiltre", "geri"] : [])].forEach(k => LS.del(k));
  try { Object.keys(localStorage).filter(k => k.startsWith("db.sart:")).forEach(k => localStorage.removeItem(k)); } catch {}
}
// Hesapsızken verilen "Kimler yararlanabilir?" cevapları (giriş yapılınca hesaba aktarılır)
function misafirSartlari() {
  const o = {}; try { Object.keys(localStorage).filter(k => k.startsWith("db.sart:")).forEach(k => { o[k.slice(8)] = JSON.parse(localStorage.getItem(k)); }); } catch {}
  return o;
}
const sbHata = m => /not authorized|sending|confirmation email/i.test(m) ? "Onay e-postası gönderilemedi, bu yüzden hesap şu an açılamıyor. Biraz sonra tekrar dene."
  : /rate limit|too many/i.test(m) ? "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene."
  : /invalid.*email|email.*invalid/i.test(m) ? "Bu e-posta adresi geçerli görünmüyor."
  : /network|fetch/i.test(m) ? "Sunucuya bağlanılamadı. İnternet bağlantını kontrol et." : m;
const Store = {
  demo: !C.SUPABASE_URL,
  _pr: null,  // sayfa içi profil önbelleği (aynı sayfada tekrar tekrar sunucuya gitmemek için; tarayıcıya yazılmaz)
  async user() {
    const s = await supa(); if (!s) return LS.get("user");
    const { data: { session } } = await s.auth.getSession(); const user = session && session.user;
    return user ? { id: user.id, email: user.email, ad: user.user_metadata?.ad, ...(yonetici(user.email) ? { rol: "admin" } : {}) } : null;
  },
  async signUp({ email, password, ad, profil }) {
    const s = await supa();
    if (!s) { const accounts = LS.get("accounts", {}); if (accounts[email]) throw new Error("Bu e-posta ile zaten bir hesap var. Giriş yap."); accounts[email] = { ad, password }; LS.set("accounts", accounts); LS.set("user", { email, ad, ...(yonetici(email) ? { rol: "admin" } : {}) }); await this.saveProfile(profil); return; }
    const p = { ...profil }; const c = classify(num(p.calisan), num(p.ciro), num(p.bilanco)); if (c) { p.olcek = c.olcek; p.olcekAdi = OLCEK[c.olcek]; }
    // Profil, kayıtla birlikte gönderilir; veritabanındaki tetikleyici hesabı ve profili birlikte kaydeder.
    const { data, error } = await s.auth.signUp({ email, password, options: { data: { ad, full_name: ad, display_name: ad, profil: p }, emailRedirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "hesap.html" } });
    if (error) throw new Error(/registered|exists/i.test(error.message) ? "Bu e-posta ile zaten bir hesap var. Giriş yap." : /password/i.test(error.message) ? "Şifre çok zayıf. Daha uzun bir şifre seç." : sbHata(error.message));
    if (data.user && !(data.user.identities || []).length) throw new Error("Bu e-posta ile zaten bir hesap var. Giriş yap.");
    if (!data.session) { yerelHesapVerisiniSil(false); return { onayGerekli: true }; }
    this._pr = null; await this.saveProfile({ ...p, sartlar: { ...misafirSartlari(), ...(p.sartlar || {}) } }, true); yerelHesapVerisiniSil(false);
  },
  async signIn({ email, password }) {
    const s = await supa();
    if (!s) {
      const a = LS.get("accounts", {})[email]; if (!a || a.password !== password) throw new Error("E-posta veya şifre hatalı.");
      LS.set("user", { email, ad: a.ad, ...(yonetici(email) ? { rol: "admin" } : {}) });
      if (yonetici(email)) { const pr = LS.get("profile"); if (!pr || !pr.olcek) await this.saveProfile(TEST_PROFIL); }
      return;
    }
    const misafir = LS.get("profile"), mSart = misafirSartlari();  // giriş öncesi hesapsız yapılan test ve cevaplar
    this._pr = null;
    const { error } = await s.auth.signInWithPassword({ email, password });
    if (error) throw new Error(/confirm/i.test(error.message) ? "Önce e-postana gelen onay bağlantısına tıkla." : /invalid|credentials/i.test(error.message) ? "E-posta veya şifre hatalı." : sbHata(error.message));
    // Hesapta henüz profil yoksa misafirken doldurulan test bilgileri hesaba aktarılır; sonra tarayıcıdan silinir.
    const pr = await this.profile();
    if ((!pr || !pr.olcek) && misafir && misafir.olcek) await this.saveProfile(misafir, true);
    else if ((!pr || !pr.olcek) && yonetici(email)) await this.saveProfile(TEST_PROFIL, true);
    if (Object.keys(mSart).length) { const p2 = await this.profile() || {}; await this.saveProfile({ sartlar: { ...mSart, ...(p2.sartlar || {}) } }); }
    yerelHesapVerisiniSil(false);
  },
  async testProfiliYukle() { return this.saveProfile(TEST_PROFIL, true); },
  async signOut() { const s = await supa(); this._pr = null; if (s) { await s.auth.signOut(); yerelHesapVerisiniSil(); } else LS.del("user"); },
  async profile() {
    const s = await supa(); const u = s && await this.user();
    if (u) {
      if (this._pr && this._pr.id === u.id) return this._pr.data ? structuredClone(this._pr.data) : null;
      const { data: r } = await s.from("profiles").select("data").eq("id", u.id).maybeSingle();
      const d = r && r.data && Object.keys(r.data).length ? r.data : null; this._pr = { id: u.id, data: d };
      return d ? structuredClone(d) : null;
    }
    return LS.get("profile");
  },
  // degistir=true: mevcut profille birleştirmeden baştan yaz
  async saveProfile(p, degistir = false) {
    p = degistir ? { ...p } : { ...(await this.profile() || {}), ...p };
    const c = classify(num(p.calisan), num(p.ciro), num(p.bilanco)); if (c) { p.olcek = c.olcek; p.olcekAdi = OLCEK[c.olcek]; }
    const s = await supa(); const u = s && await this.user();
    if (u) { const { error } = await s.from("profiles").upsert({ id: u.id, email: u.email, ad: u.ad || null, data: p, notify_email: !!p.bildirimEposta, updated_at: new Date().toISOString() }); if (error) throw new Error("Profil kaydedilemedi: " + sbHata(error.message)); this._pr = { id: u.id, data: structuredClone(p) }; }
    else LS.set("profile", p);  // hesapsız (misafir) test ya da demo modu
    return p;
  },
  async list(k) {
    const s = await supa(); const u = s && await this.user();
    if (u && k === "apps") { const { data: r } = await s.from("applications").select("*").eq("user_id", u.id); return (r || []).map(a => ({ id: a.program_id, durum: a.status, tarih: a.updated_at, values: a.values })); }
    if (u && k === "notifs") { const { data: r } = await s.from("notifications").select("*").eq("user_id", u.id).order("created_at", { ascending: false }); return (r || []).map(n => ({ nid: n.id, id: n.program_id, tarih: n.created_at, read: n.read })); }
    return LS.get(k, []);
  },
  async saveApp(a) {
    const s = await supa(); const u = s && await this.user();
    const apps = u ? await this.list("apps") : LS.get("apps", []); const i = apps.findIndex(x => x.id === a.id);
    const v = { ...(apps[i] || {}), ...a, tarih: new Date().toISOString() };
    if (u) { await s.from("applications").upsert({ user_id: u.id, program_id: v.id, status: v.durum, values: v.values || {}, updated_at: v.tarih }, { onConflict: "user_id,program_id" }); return v; }
    if (i >= 0) apps[i] = v; else apps.push(v); LS.set("apps", apps);
    return v;
  },
  async markRead() {
    const s = await supa(); const u = s && await this.user(); if (u) { await s.from("notifications").update({ read: true }).eq("user_id", u.id); return; }
    LS.set("notifs", LS.get("notifs", []).map(n => ({ ...n, read: true })));
  }
};

/* ---------- KOBİ ölçeği (Resmî Gazete, 7.8.2025) ---------- */
function classify(calisan, ciro, bilanco) {
  if (calisan == null || calisan < 0) return null;
  const L = C.KOBI_SINIRLARI;
  let i = L.findIndex(l => calisan < l.calisan);
  if (i < 0) return { olcek: "buyuk", neden: "250 veya daha fazla çalışan olduğu için KOBİ sayılmıyor." };
  const byEmp = i;
  const mali = [ciro, bilanco].filter(v => v != null && !isNaN(v));
  // Ciro veya bilançodan herhangi biri sınırın altındaysa o sınıfta kalır; ikisi de aşıyorsa bir üst sınıfa geçer
  while (i < L.length && mali.length && mali.every(v => v > L[i].mali)) i++;
  if (i >= L.length) return { olcek: "buyuk", neden: "Yıllık net satış ve bilanço 1 milyar TL’yi aştığı için KOBİ sayılmıyor." };
  const l = L[i];
  const neden = i === byEmp
    ? `${l.calisan} kişiden az çalışan` + (mali.length ? ` ve ${short(l.mali)} altında yıllık net satış veya bilanço` : "") + " olduğu için."
    : `Çalışan sayısına göre ${low(OLCEK[L[byEmp].olcek])} olurdun, ancak ciro ve bilanço ${short(L[byEmp].mali)} sınırını aştığı için bir üst sınıftasın.`;
  return { olcek: l.olcek, neden };
}

/* ---------- Uygunluk ---------- */
/* ---------- Terim sözlüğü (resmi metinlerdeki terimlerin üzerine gelince açıklama) ---------- */
const SOZLUK = {
  "KOBİ": "Küçük ve orta büyüklükteki işletme. Bu sitede güncel yönetmeliğe göre: 250 kişiden az çalışanı olan ve yıllık net satışı veya bilançosu 1 milyar TL’yi aşmayan işletmeler.",
  "hibe": "Geri ödenmeyen destek. Genellikle harcamayı önce sen yaparsın, kurum desteklenen kısmı sonra öder.",
  "geri ödemeli": "Faizsiz veya düşük faizli kredi gibi çalışan destek: kurumdan gelen tutarı belirli bir süre sonra geri ödersin.",
  "geri ödemesiz": "Geri ödenmeyen destek (hibe).",
  "destek oranı": "Uygun harcamaların yüzde kaçının kurum tarafından karşılandığı.",
  "üst limit": "Bir başvuruda veya bir gider kaleminde alınabilecek en yüksek destek tutarı.",
  "öz katkı": "Proje bütçesinin destek dışında kalan ve senin karşılaman gereken kısmı.",
  "eş finansman": "Proje bütçesinin destek dışında kalan ve senin karşılaman gereken kısmı.",
  "işbirliği kuruluş": "TİM, TOBB, ihracatçı birlikleri, ticaret ve sanayi odaları, OSB’ler, teknoparklar gibi kuruluşlar. Bazı desteklere yalnızca bunlar başvurabilir.",
  "ihracatçı birliği": "Aynı sektördeki ihracatçıların üye olduğu, Türkiye İhracatçılar Meclisi’ne (TİM) bağlı birlik.",
  "ÇKS": "Çiftçi Kayıt Sistemi: tarım desteklerinden yararlanmak için çiftçilerin kayıtlı olması gereken sistem.",
  "Çiftçi Kayıt Sistemi": "Tarım desteklerinden yararlanmak için çiftçilerin kayıtlı olması gereken sistem (ÇKS).",
  "DYS": "Destek Yönetim Sistemi: Ticaret Bakanlığı’nın ihracat desteklerine başvurulan sistem.",
  "Destek Yönetim Sistemi": "Ticaret Bakanlığı’nın ihracat desteklerine başvurulan sistem (DYS).",
  "PRODİS": "TÜBİTAK’ın proje başvuru ve takip sistemi. Proje göndermeden önce kuruluş ön kaydı gerekir.",
  "PRODIS": "TÜBİTAK’ın proje başvuru ve takip sistemi. Proje göndermeden önce kuruluş ön kaydı gerekir.",
  "KAYS": "Kalkınma Ajansları Yönetim Sistemi: kalkınma ajansı desteklerine başvurulan sistem.",
  "KEP": "Kayıtlı Elektronik Posta: resmi yazışmalarda kullanılan, hukuken geçerli e-posta.",
  "e-imza": "Elektronik imza: ıslak imzanın yerine geçen, kişiye özel dijital imza.",
  "NACE": "Ekonomik faaliyet sınıflaması. İşletmenin faaliyet kodu vergi levhasında yazar.",
  "teşvik belgesi": "Yatırım teşvik sistemi kapsamında verilen, vergi ve prim avantajları sağlayan belge.",
  "döviz kazandırıcı": "Yurt dışına mal veya hizmet satarak ülkeye döviz getiren faaliyetler (ör. yazılım, müşavirlik, turizm).",
  "sermaye şirket": "Anonim şirket (A.Ş.) ve limited şirket (Ltd. Şti.) gibi şirketler. Şahıs işletmeleri bu kapsama girmez.",
  "tüzel kişi": "Şirket, dernek, vakıf, kooperatif gibi kendi adına hak ve borç sahibi olabilen kuruluşlar.",
  "gerçek kişi": "Bireyler. Şahıs işletmeleri de gerçek kişi sayılır.",
  "fizibilite": "Bir yatırımın yapılabilir ve kârlı olup olmadığını inceleyen ön çalışma.",
  "KOBİ Bilgi Beyannamesi": "İşletmenin KOBİ olduğunu ve ölçeğini gösteren, KOSGEB sistemine verilen beyan. Her mali yıl sonrası güncellenir."
};
// Metni (önce HTML güvenli hale getirip) terimleri açıklamalı işaretler; her terim yalnızca ilk geçtiği yerde işaretlenir
const _SOZ_RE = (() => { const v = []; Object.keys(SOZLUK).forEach(k => { v.push(k); const u = k[0].toLocaleUpperCase("tr") + k.slice(1); if (u !== k) v.push(u); });
  v.sort((a, b) => b.length - a.length);
  return new RegExp("(^|[^\\p{L}])(" + v.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + (s === s.toLocaleUpperCase("tr") ? "(?![\\p{Lu}])" : "")).join("|") + ")", "gu"); })();
function terim(t) {
  const kul = new Set();
  return esc(t).replace(_SOZ_RE, (m, on, w) => {
    const key = Object.keys(SOZLUK).find(k => k.toLocaleLowerCase("tr") === w.toLocaleLowerCase("tr"));
    if (!key || kul.has(key)) return m; kul.add(key);
    // Açıklama öznitelikte değil sayfa metninde: Google Çeviri (EN) yalnızca metni çevirir
    return `${on}<span class="terim" tabindex="0">${w}<span class="terim-tip" role="tooltip">${esc(SOZLUK[key])}</span></span>`;
  });
}

/* ---------- Takvime ekle (.ics): son başvurudan 7 gün önce hatırlatır ---------- */
function icsDosya(x, url) {
  const d = x.son_basvuru.replace(/-/g, ""), d2 = new Date(Date.parse(x.son_basvuru + "T00:00:00Z") + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
  const e = s => String(s).replace(/([,;\\])/g, "\\$1");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FonRota//TR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${x.id}@fonrota`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${d2}`,
    `SUMMARY:${e("Son başvuru: " + x.ad)}`, `DESCRIPTION:${e(x.kurum + " – " + url)}`, `URL:${url}`,
    "BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY", `DESCRIPTION:${e("Son başvuruya 7 gün kaldı: " + x.ad)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
function indir(ad, icerik, tip) { const url = URL.createObjectURL(new Blob([icerik], { type: tip })); const a = Object.assign(document.createElement("a"), { href: url, download: ad }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
function siteUrl(yol) { return location.href.split("#")[0].split("?")[0].replace(/[^/]*$/, "") + yol; }

/* ---------- Profil doluluğu ---------- */
const DOLULUK_ALAN = ["firmaUnvani", "vkn", "vergiDairesi", "sirketTuru", "kurulusYili", "naceKodu", "calisan", "ciro", "yetkili", "telefon", "eposta", "il", "adres"];
function profilDoluluk(p) {
  p = p || {};
  const eksik = DOLULUK_ALAN.filter(k => p[k] == null || p[k] === "").map(k => ALANLAR[k].e);
  if (!p.isletmeTipi) eksik.push("Başvuruyu kim yapacak (uygunluk testi)");
  if (!(p.amaclar || []).length) eksik.push("Hedeflerin (uygunluk testi)");
  const top = DOLULUK_ALAN.length + 2;
  return { yuzde: Math.round((top - eksik.length) / top * 100), eksik };
}

/* ---------- Başvuru öncesi ön koşullar (beyanname, kayıtlar) ----------
   Kaynaklar: KOSGEB KOBİ Bilgi Sistemi, Ticaret Bakanlığı DYS genelgeleri, TÜBİTAK PRODİS ön kayıt kılavuzu,
   kalkınma ajansları KAYS başvuru rehberleri, Çiftçi Kayıt Sistemi Yönetmeliği. Yalnızca resmi kaynaklarda doğrulanan genel bilgiler. */
const ON_KOSUL = {
  kobi: { ad: "KOSGEB kaydı ve güncel KOBİ Bilgi Beyannamesi",
    nasil: "e-Devlet şifrenle KOSGEB e-Hizmetler / KOBİ Bilgi Sistemi’ne gir, işletmeni kaydet ve KOBİ Bilgi Beyannamesi’ni doldur. Kayıtlı işletmeler beyannameyi her mali yıl kapandıktan sonra bir önceki yılın kesinleşmiş bilgileriyle günceller. Onaylanmış bir beyannameyi değiştirmek için bağlı olduğun KOSGEB müdürlüğüne başvurman gerekebilir.",
    link: "https://www.kosgeb.gov.tr" },
  dys: { ad: "Ticaret Bakanlığı Destek Yönetim Sistemi (DYS) kaydı ve ihracatçı birliği üyeliği",
    nasil: "Ticaret Bakanlığı’nın ihracat desteklerine başvurular Destek Yönetim Sistemi (DYS) üzerinden yapılır ve yararlanıcıların DYS’ye kayıt olması zorunludur. Desteklerin çoğunda bir ihracatçı birliğine üye olmak da gerekir; şart desteğin genelgesine göre değişir.",
    link: "https://ticaret.gov.tr/destekler/destek-yonetim-sistemi-dys" },
  prodis: { ad: "TÜBİTAK PRODİS kuruluş ön kaydı onayı",
    nasil: "Proje önerisi göndermeden önce kuruluşun PRODİS’te “Firma Ön Kayıt Sorumlusu” rolüyle kuruluş bazlı ön kayıt yapması ve onay alması gerekir. Ön kayıt evrakı çağrı kapanışından en az bir iş günü önce TÜBİTAK’a ulaşmalı; onay 2-3 gün sürebilir. Çağrının açılmasını beklemeye gerek yok, bir kez onay alan kuruluş her çağrıda tekrar yapmaz.",
    link: "https://tubitak.gov.tr/sites/default/files/2025-07/on_kayit_kullanici_kilavuzu.pdf" },
  kays: { ad: "Kalkınma Ajansları Yönetim Sistemi (KAYS) kaydı ve e-imza",
    nasil: "Kalkınma ajansı başvuruları KAYS üzerinden yapılır. Kurumun KAYS’ta kaydı yoksa önce kurum kaydı oluşturulur, yetkili ve irtibat kişileri tanımlanır; giriş e-Devlet ile yapılır. Başvuru, KAYS’ta üretilen taahhütnamenin e-imzayla imzalanmasıyla tamamlanır. Adres ve ayrıntılar ajansın başvuru rehberinde yazar." },
  cks: { ad: "Çiftçi Kayıt Sistemi (ÇKS) kaydı",
    nasil: "İlk kayıt arazinin bulunduğu ilçe tarım ve orman müdürlüğüne (arazi merkez ilçedeyse il müdürlüğüne) yapılır; kayıt yenileme e-Devlet üzerinden de yapılabilir. Başvuru dönemleri her yıl Bakanlıkça duyurulur.",
    link: "https://www.tarimorman.gov.tr" },
  banka: { ad: "Aracı banka ile görüşme",
    nasil: "Bu kredi aracı bankalar üzerinden kullandırılır; başvuruyu çalıştığın bankaya yaparsın. Banka kendi kredi değerlendirmesini ve teminat şartlarını uygular." }
};
function onKosullar(x) {
  const metin = low([x.ad, x.kurum, ...(x.resmi?.bolumler || []).map(b => b.metin), x.sayfa?.metin || ""].join(" "));
  const k = low(x.kurum || ""), out = [];
  const var_ = (...w) => w.some(s => metin.includes(s));
  if (k.includes("kosgeb") || var_("kobi bilgi beyanname", "kobi beyanname")) out.push("kobi");
  if ((k.includes("ticaret bakanlığı") && var_("destek yönetim sistemi", "dys", "ihracatçı birliği")) || var_("destek yönetim sistemi")) out.push("dys");
  if (var_("prodis", "teydeb") || (k.includes("tübitak") && /\b1[5-8]\d\d\b/.test(x.ad))) out.push("prodis");
  if (k.includes("kalkınma ajansı") || var_("kays", "kalkınma ajansları yönetim sistemi")) out.push("kays");
  if (var_("çiftçi kayıt sistemi", "çks")) out.push("cks");
  if (var_("aracı banka")) out.push("banka");
  return out;
}
const TEMEL_BELGE = ["Vergi levhası", "İmza sirküleri", "Ticaret sicil gazetesi", "Faaliyet belgesi (oda kaydı)", "Vergi ve SGK borcu yoktur yazıları"];

/* ---------- Hedef kitle: resmi "Kimler yararlanabilir?" metninden kimlerin başvurabileceği ---------- */
/* Resmi "Kimler yararlanabilir?" metninden hedef kitle. Dönen küme: bu programa kimler başvurabilir.
   null => metin genel ("Şirketler", "gerçek veya tüzel kişiler") ya da metin yok: herkese gösterilir. */
function hedefKitle(x) {
  const ham = x.resmi && (x.resmi.bolumler.find(b => b.baslik.startsWith("Kimler")) || {}).metin;
  if (!ham) return null;
  const k = ham.replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
  const K = new Set();
  const var_ = (...w) => w.some(s => k.includes(s));
  // "İşbirliği kuruluşları (TİM, TOBB, ihracatçı birlikleri, OSB...)" ile başlayan programlara yalnızca bu kuruluşlar başvurur
  if (/^[•\s]*(i̇|i)şbirliği kuruluşlar|^[•\s]*iş birliği kuruluşlar/.test(k)) return new Set(["isbirligi"]);
  if (var_("işbirliği kuruluş", "iş birliği kuruluş")) K.add("isbirligi");
  if (var_("çiftçi", "yetiştirici", "üretici belgesi", "hayvan bilgi sistemi", "su ürünleri bilgi sistemi", "orman köylü", "üretici örgüt", "tarımsal amaçlı örgüt")) K.add("ciftci");
  if (var_("özel sektör işveren")) K.add("isveren");
  if (var_("ihracatçı", "ihracata yönelik", "imalatçı-ihracatçı", "döviz kazandırıcı", "ihracat yapan", "ihraç", "döviz karşılığı", "yurt dışında yerleşiklere")) K.add("ihracatci");
  if (var_("serbest bölge")) K.add("serbest");
  if (var_("müteahhit")) K.add("muteahhit");
  if (var_("turizm yatırım", "turizm sektör", "seyahat acenta", "konaklama", "turizm işletme")) K.add("turizm");
  if (var_("film yönetmen", "yapımcı", "medya hizmet", "yayıncı", "yayımcı", "kültür girişimi", "senaryo")) K.add("medya");
  if (var_("nakliyat", "lojistik işletme", "taşıma organizatör")) K.add("lojistik");
  if (var_("gemi inşa")) K.add("gemi");
  if (var_("dış ticaret sermaye", "sektörel dış ticaret")) K.add("dts");
  if (var_("kooperatif")) K.add("kooperatif");
  if (var_("kamu kurum", "üniversite", "yükseköğretim", "belediye", "araştırmacı", "doktora", "eğitim ve araştırma hastane", "köy tüzel", "dernek", "vakıf")) K.add("kamu");
  // Genel ifade varsa (ör. "Şirketler", "gerçek veya tüzel kişiler", "firma") her işletme de başvurabilir
  if (/(^|[\s•,;])(şirketler|tüzel firmalar)\b/.test(k) || var_("gerçek veya tüzel kişi", "gerçek ve tüzel kişi", "sermaye şirket", "özel kuruluş", "özel sektör kuruluş", "kobi", "sanayi kuruluş", "ticari faaliyette bulunan şirket", "yerleşik şirket", "yerleşik firma", "firmalar başvurabilir", "tasarımcı şirket", "gelir ve kurumlar vergisi mükellef")) K.add("genel");
  return K.size && !K.has("genel") ? K : null;
}
/* İşletmenin özellikleri (uygunluk testi): hangi kitlelere giriyor? */
function profilKitle(p) {
  const S = new Set();
  const tip = p.isletmeTipi || "sirket";
  if (tip === "ciftci") S.add("ciftci");
  if (tip === "kooperatif") { S.add("kooperatif"); S.add("ciftci"); }
  if (tip === "isbirligi") S.add("isbirligi");
  if (tip === "kamu") S.add("kamu");
  if (p.ihracat) S.add("ihracatci");
  if ((Number(String(p.calisan || 0).replace(/\D/g, "")) || 0) > 0) S.add("isveren");
  (p.ozelDurum || []).forEach(d => S.add(d));
  return S;
}
/* Bakanlığın alanı veya program adı belirli bir sektörü gösteriyorsa (ör. Tarım ve Orman Bakanlığı -> tarım) */
function alanSektor(x) {
  const k = (x.kurum || "").toLowerCase(), a = (x.ad || "").replace(/İ/g, "i").toLowerCase();
  if (k.includes("tarım ve orman")) return ["tarim"];
  if (/serbest bölge/.test(a)) return ["serbest"];
  if (/tgb|teknopark|teknoloji geliştirme bölge|ar-ge ve tasarım merkez/.test(a)) return ["argemerkezi"];
  if (/dernek|vakıf|belediye/.test(a)) return ["kamu"];
  if (/turizm/.test(a)) return ["turizm"];
  if (/sinema|film|dizi|yayım|yayın|eser|kültür varlığı/.test(a)) return ["medya"];
  if (k.includes("kültür ve turizm")) return ["medya", "turizm"];
  if (/gemi|yat sektör/.test(a)) return ["gemi"];
  if (/bilişim/.test(a)) return ["bilisim"];
  return null;
}
function kitleUyar(x, p) {
  const S = profilKitle(p);
  const sek = alanSektor(x);
  if (sek && !sek.some(s => (p.sektorler || []).includes(s) || S.has(s) || (s === "tarim" && (S.has("ciftci") || S.has("kooperatif"))))) return false;
  const K = hedefKitle(x); if (!K) return true;
  for (const k of K) if (S.has(k)) return true;
  return false;
}
const KITLE_AD = { isbirligi: "işbirliği kuruluşları (TİM, TOBB, OSB, ihracatçı birlikleri…)", ciftci: "çiftçi kayıt sistemine kayıtlı üreticiler",
  isveren: "sigortalı çalışanı olan özel sektör işverenleri", ihracatci: "ihracatçılar ve ihracata yönelik üreticiler", serbest: "serbest bölge kullanıcıları",
  muteahhit: "yurt dışında müteahhitlik yapan firmalar", turizm: "turizm belgeli işletmeler", medya: "film, medya, yayın ve kültür işletmeleri",
  lojistik: "uluslararası nakliyat ve lojistik firmaları", gemi: "gemi inşa firmaları", dts: "dış ticaret şirketleri", kooperatif: "kooperatifler",
  kamu: "kamu kurumları, üniversiteler, dernek ve vakıflar", argemerkezi: "Ar-Ge/tasarım merkezi veya teknopark firmaları", tarim: "tarım sektörü", bilisim: "bilişim sektörü" };
function kitleMetni(x) { const s = new Set([...(alanSektor(x) || []), ...(hedefKitle(x) || [])]); return s.size ? [...s].map(k => KITLE_AD[k] || k).join("; ") : ""; }

function check(x, p) {
  const r = []; if (!p) return { level: "none", r, score: 0 };
  const yil = new Date().getFullYear();
  if (p.olcek) r.push({ hard: true, ok: x.olcek.includes(p.olcek), t: "Ölçek: " + x.olcek.map(o => OLCEK[o]).join(", ") });
  if (p.sektorler && p.sektorler.length) r.push({ hard: true, ok: x.sektor.includes("tumu") || x.sektor.some(s => p.sektorler.includes(s)), t: "Sektör: " + x.sektor.map(s => SEKTOR[s] || s).join(", ") });
  if (p.il) r.push({ hard: true, ok: x.il.includes("tumu") || x.il.includes(p.il), t: "Bölge: " + (x.il.includes("tumu") ? "Türkiye geneli" : x.il.join(", ")) });
  if (x.firma_yasi_max && num(p.kurulusYili)) r.push({ hard: true, ok: yil - num(p.kurulusYili) <= x.firma_yasi_max, t: `İşletmenin en fazla ${x.firma_yasi_max} yıllık olması` });
  if (x.ihracat_gerekli) r.push({ hard: false, ok: !!p.ihracat, t: "İhracat yapıyor olmak" });
  if (p.isletmeTipi && kitleMetni(x)) r.push({ hard: true, ok: kitleUyar(x, p), kitle: true, t: "Kimler başvurabilir: " + kitleMetni(x) });
  if (p.borcYok === false) r.push({ hard: false, ok: false, t: "Vergi ve SGK borcu olmaması (çoğu destekte şart)" });
  const hardFail = r.some(c => c.hard && !c.ok), softFail = r.some(c => !c.hard && !c.ok);
  const level = !r.length ? "none" : hardFail ? "no" : softFail ? "mid" : "ok";
  const overlap = (x.amac || []).filter(a => (p.amaclar || []).includes(a)).length;
  return { level, r, score: ({ ok: 100, mid: 60, none: 40, no: 0 })[level] + overlap * 12 + (x.il.includes("tumu") ? 0 : 6) };
}
const LEVEL_TAG = { ok: `<span class="tag t-ok">Uygun olabilir</span>`, mid: `<span class="tag t-mid">Kısmen uygun</span>`, no: `<span class="tag t-no">Uygun değil</span>`, none: "" };
function daysLeft(s) { return s ? Math.ceil((new Date(s + "T23:59") - new Date()) / 864e5) : null; }

/* ---------- Kural tabanlı iş fikri analizi (yapay zekâ yoksa) ---------- */
const KURAL_SEKTOR = { imalat: ["üret", "imalat", "fabrika", "atölye", "makine", "mobilya", "tekstil", "döküm", "metal", "plastik", "cnc"], tarim: ["tarım", "gıda", "süt ", "sera", "hayvan", "zeytin", "fındık", "çiftlik", "un fabrika", "arıcılık"], bilisim: ["yazılım", "uygulama", "web", "e-ticaret", "dijital", "saas", "oyun", "yapay zek"], turizm: ["otel", "pansiyon", "turizm", "tur ", "konaklama"], enerji: ["güneş", " ges", "enerji", "rüzgar", "şarj"], saglik: ["sağlık", "klinik", "medikal", "tıbbi", "eczane"], ticaret: ["mağaza", "toptan", "perakende", "satış"], hizmet: ["danışmanlık", "hizmet", "ajans", "eğitim"], insaat: ["inşaat", "yapı", "müteahhit"], lojistik: ["lojistik", "nakliye", "kargo", "depo"] };
const KURAL_AMAC = { yatirim: ["makine", "tesis", "kapasite", "yatırım", "cnc", "hat ", "ekipman"], arge: ["ar-ge", "arge", "yeni ürün", "patent", "inovasyon", "geliştir", "prototip"], dijital: ["dijital", "yazılım", "e-ticaret", "otomasyon", "erp", "web"], ihracat: ["ihracat", "yurt dışı", "yurtdışı", "export", "avrupa", "fuar"], istihdam: ["personel", "eleman", "istihdam", "çalışan al", "işe al", "eğitim"], finansman: ["kredi", "finansman", "nakit", "sermaye", "borç"], yesil: ["enerji", "güneş", "ges", "verimlilik", "atık", "yeşil", "karbon"], kurulus: ["yeni kurdu", "yeni kurulan", "kuruluş", "büyü"] };
function ruleAnalyze(t) {
  const s = low(t);
  const sek = Object.entries(KURAL_SEKTOR).filter(([, w]) => w.some(x => s.includes(x))).map(([k]) => k).slice(0, 2);
  const am = Object.entries(KURAL_AMAC).filter(([, w]) => w.some(x => s.includes(x))).map(([k]) => k);
  return { ozet: "", sektorler: sek, amaclar: am.length ? am : ["yatirim", "finansman"], nace_onerisi: "", ipucu: "", kaynak: "kural" };
}

/* ---------- Yapay zekâ: önizlemede Claude, sitede api/ai.js ---------- */
let _sample;
async function sampler() {
  if (_sample !== undefined) return _sample;
  _sample = null;
  if (window.claude && window.claude.use) { try { _sample = await window.claude.use("sample"); } catch { _sample = null; } }
  return _sample;
}
async function aiAvailable() { return !!(C.AI_ENDPOINT || await sampler()); }
async function ai(task, d) {
  const parse = t => { const c = String(t).replace(/```json|```/g, "").trim(); try { return JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1)); } catch { return null; } };
  const wantsJSON = task === "analiz" || task === "yorum";
  if (C.AI_ENDPOINT) {
    const r = await fetch(C.AI_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, data: d }) });
    if (!r.ok) throw new Error("Yapay zekâ şu an yanıt vermiyor.");
    const j = await r.json(); return wantsJSON ? parse(j.text) : j.text;
  }
  const s = await sampler(); if (!s) return null;
  const res = await s(window.PROMPTS[task](d), { modelTier: "default" });
  return wantsJSON ? parse(res.text) : res.text.trim();
}

/* ---------- Dosya indirme ---------- */
async function saveFile(filename, bytes) {
  if (window.claude && window.claude.use) {
    try { const dl = await window.claude.use("downloads"); if (dl) { await dl.save({ filename, data: new Blob([bytes]) }); return true; } }
    catch (e) { if (e && e.code === "declined") return false; }
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000); return true;
}

/* ---------- PDF: form doldurma ve rapor ---------- */
function loadScript(src) { return new Promise((res, rej) => { if ($$(`script[src="${src}"]`).length) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Kütüphane yüklenemedi")); document.head.append(s); }); }
async function pdfLibs() {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js");
  return window.PDFLib;
}
async function fonts(doc) {
  doc.registerFontkit(window.fontkit);
  return { r: await doc.embedFont(await asset("assets/fonts/DejaVuSans.ttf")), b: await doc.embedFont(await asset("assets/fonts/DejaVuSans-Bold.ttf")) };
}
const GUESS = [["unvan", "firmaUnvani"], ["vergi_no", "vkn"], ["vkn", "vkn"], ["vergi_daire", "vergiDairesi"], ["yetkili", "yetkili"], ["telefon", "telefon"], ["tel", "telefon"], ["posta", "eposta"], ["mail", "eposta"], ["adres", "adres"], ["il", "il"], ["kurulus", "kurulusYili"], ["nace", "naceKodu"], ["calisan", "calisan"], ["personel", "calisan"], ["ciro", "ciro"], ["satis", "ciro"], ["olcek", "olcekAdi"], ["proje_adi", "projeAdi"], ["ozet", "projeOzeti"], ["sure", "projeSuresi"], ["butce", "projeButcesi"], ["talep", "talepTutari"], ["tarih", "bugun"], ["turu", "sirketTuru"]];
const ascii = s => low(s).replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");

/* Akan metinle çok sayfalı PDF yazar. blocks: {h1|h2|p|small|kv|ul} */
// Görünmez sahiplik izi: üretilen PDF'lerin dosya bilgileri (Dosya > Özellikler)
function pdfImza(doc, kendi = true) {
  const sahip = C.SAHIP || C.SITE_ADI || "FonRota";
  try { doc.setProducer(`${C.SITE_ADI || "FonRota"} © ${new Date().getFullYear()} ${sahip}`); if (kendi) { doc.setCreator(C.SITE_ADI || "FonRota"); doc.setAuthor(sahip); doc.setKeywords([C.SITE_ADI || "FonRota", sahip]); } } catch {}
}
async function writePdf(doc, f, blocks, title) {
  pdfImza(doc, !doc.getAuthor || !doc.getAuthor());
  const { rgb } = window.PDFLib; const W = 595.28, H = 841.89, M = 50; const ink = rgb(.07, .2, .23), mut = rgb(.36, .44, .41), seal = rgb(.72, .51, .16);
  let page, y;
  const newPage = () => { page = doc.addPage([W, H]); page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: seal }); page.drawText((C.SITE_ADI || "FonRota") + "  |  " + title, { x: M, y: H - 30, size: 8.5, font: f.r, color: mut }); y = H - 62; };
  // Satır kaydırma; tek başına sığmayan uzun kelimeler (ör. bağlantılar) harf harf bölünür
  const kir = (w, font, size, width) => { const parts = []; let cur = ""; for (const ch of w) { if (font.widthOfTextAtSize(cur + ch, size) > width && cur) { parts.push(cur); cur = ch; } else cur += ch; } if (cur) parts.push(cur); return parts; };
  const wrap = (text, font, size, width) => { const out = []; String(text).split("\n").forEach(par => { let line = ""; par.split(/\s+/).flatMap(w => font.widthOfTextAtSize(w, size) > width ? kir(w, font, size, width) : [w]).forEach(w => { const t = line ? line + " " + w : w; if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out; };
  const yer = (n = 40) => { if (y < M + n) newPage(); };  // madde işareti ile metni aynı sayfada tut
  const text = (t, { font = f.r, size = 10.5, color = ink, x = M, width = W - 2 * M, gap = 4 } = {}) => {
    for (const ln of wrap(t, font, size, width)) { if (y < M + size) newPage(); page.drawText(ln, { x, y, size, font, color }); y -= size + gap; }
  };
  newPage();
  for (const b of blocks) {
    if (b.h1) { text(b.h1, { font: f.b, size: 18, gap: 6 }); y -= 4; }
    if (b.h2) { y -= 10; if (y < M + 60) newPage(); text(b.h2, { font: f.b, size: 13, gap: 5 }); page.drawLine({ start: { x: M, y: y + 12 }, end: { x: W - M, y: y + 12 }, thickness: .6, color: rgb(.83, .86, .85) }); y -= 8; }
    if (b.p) { text(b.p); y -= 4; }
    if (b.small) { text(b.small, { size: 8.5, color: mut }); y -= 2; }
    if (b.kv) for (const [k, v] of b.kv) { yer(); const start = y; text(k, { size: 9.5, color: mut, width: 160 }); const after = y; y = start; text(v === "" || v == null ? "—" : String(v), { x: M + 170, width: W - 2 * M - 170, font: f.b, size: 10 }); y = Math.min(y, after) - 3; }
    if (b.ol) b.ol.forEach((it, i) => { yer(); const start = y; text(`${i + 1}.`, { width: 16 }); y = start; text(it, { x: M + 18, width: W - 2 * M - 18 }); });
    if (b.ul) for (const it of b.ul) { yer(); const start = y; text("•", { width: 10 }); y = start; text(it, { x: M + 14, width: W - 2 * M - 14 }); }
  }
  const pages = doc.getPages(); pages.forEach((pg, i) => pg.drawText(`${today()}   ·   Sayfa ${i + 1} / ${pages.length}`, { x: M, y: 26, size: 8, font: f.r, color: mut }));
}

async function fillForm(x, values) {
  const { PDFDocument, PDFTextField } = await pdfLibs();
  const doc = await PDFDocument.load(await asset(x.basvuru.form));
  const f = await fonts(doc); const form = doc.getForm();
  const base = x.basvuru.form.split("/").pop().replace(/\.pdf$/i, "");
  const map = (await assetJSON(`forms/maps/${base}.json`)) || {};
  const v = { ...values, bugun: today() };
  let filled = 0;
  for (const fld of form.getFields()) {
    if (!(fld instanceof PDFTextField)) continue;
    const name = fld.getName(); const key = map[name] || (GUESS.find(([w]) => ascii(name).includes(w)) || [])[1];
    let val = key && v[key]; if (val == null || val === "") continue;
    if (["ciro", "projeButcesi", "talepTutari"].includes(key) && num(val) != null) val = new Intl.NumberFormat("tr-TR").format(num(val));
    fld.setText(String(val)); filled++;
  }
  if (form.getFields().length) form.updateFieldAppearances(f.r);
  pdfImza(doc, false);  // kurumun resmi formu: yalnızca "üreten" bilgisi, yazar alanına dokunulmaz
  // Doldurulamayan (taranmış) formlarda bilgileri ek sayfa olarak ekle
  if (!filled) await writePdf(doc, f, [{ h1: "Başvuru bilgileri (form eki)" }, { small: "Bu form otomatik doldurulamadı. Aşağıdaki bilgileri forma elle aktarın." }, { kv: x.alanlar.map(k => [ALANLAR[k]?.e || k, values[k]]) }], x.ad);
  return { bytes: await doc.save(), filled };
}

/* Her program için doldurulmuş "Başvuru hazırlık formu" (resmi PDF formu olmayan programlar dahil).
   Firma bilgileri + resmi "Kimler yararlanabilir?" maddeleri ve kullanıcının cevapları + başvuru dönemi/yeri + resmi belgeler. */
async function infoPdf(x, values, p) {
  const { PDFDocument } = await pdfLibs(); const doc = await PDFDocument.create(); const f = await fonts(doc);
  doc.setTitle(x.ad + " – başvuru hazırlık formu");
  const eksik = x.alanlar.filter(k => values[k] == null || values[k] === "");
  const bolum = ad => x.resmi && (x.resmi.bolumler.find(b => b.baslik.startsWith(ad)) || {}).metin;
  const kimler = (bolum("Kimler") || "").split("\n").map(l => l.trim()).filter(Boolean);
  const cev = LS.get("sart:" + x.id, {}); const CEV = { e: "[Evet]", h: "[Hayır]", b: "[Emin değilim]" };
  let qi = 0;
  const sartlar = kimler.map((l, i) => { const t = l.replace(/^[•–]\s*/, ""); if (/[:;]$/.test(l)) return t; return `${CEV[cev[i]] || "[Cevaplanmadı]"}  ${t}`; });
  const resmiBelge = (x.resmi?.belgeler || []).map(d => `${d.ad}  –  ${d.url}`);
  const yer = bolum("Başvuru yeri"), donem = bolum("Başvuru dönemi");
  await writePdf(doc, f, [
    { h1: x.ad }, { small: `${x.kurum} · Hazırlanma tarihi ${today()} · FonRota başvuru hazırlık formu` },
    { small: "Bu belge kurumun resmi başvuru formu değildir. Başvuruyu hazırlaman ve kurumun sisteminde istenen bilgileri hızlıca doldurman için bilgilerinle hazırlandı." },
    { h2: "1. Başvuru sahibi ve firma bilgileri" }, { kv: x.alanlar.map(k => [ALANLAR[k]?.e || k, ["ciro", "projeButcesi", "talepTutari"].includes(k) && num(values[k]) != null ? tl(num(values[k])) : values[k]]) },
    ...(eksik.length ? [{ small: "Boş alanlar: " + eksik.map(k => ALANLAR[k]?.e || k).join(", ") }] : []),
    ...(sartlar.length ? [{ h2: "2. Kimler yararlanabilir? (resmi metin) ve cevapların" }, { ul: sartlar }, { small: "Maddeler Sanayi ve Teknoloji Bakanlığı Destekler Platformu’ndaki özet bilgi formundan değiştirilmeden alındı. Bu maddeler çoğunlukla alternatif başvuru sahibi türleridir; birine uymak yeterlidir, açıkça zorunluluk bildiren maddeler ise mutlaka karşılanmalıdır. Cevaplar senin işaretlemelerindir." }]
      : x.kosullar?.length ? [{ h2: "2. Koşullar" }, { ul: x.kosullar }] : []),
    ...(onKosullar(x).length ? [{ h2: "Başvurmadan önce hazır olması gerekenler" }, { ul: onKosullar(x).map(id => `${(values.hazirlik || p?.hazirlik || {})[id] ? "[Hazır]" : "[Eksik]"}  ${ON_KOSUL[id].ad}: ${ON_KOSUL[id].nasil}`) }] : []),
    ...(donem ? [{ h2: "3. Başvuru dönemi" }, { p: donem }] : []),
    { h2: (donem ? "4" : "3") + ". Nereye ve nasıl başvurulur?" },
    ...(yer ? [{ p: yer }] : []), ...((x.basvuru.adimlar || []).length && !yer ? [{ ol: x.basvuru.adimlar }] : []),
    { p: (x.resmi && x.basvuru.online === x.resmi.sayfa ? "Resmi program sayfası: " : "Başvuru adresi: ") + (x.basvuru.online || x.url) },
    { h2: "Temel belgeler (çoğu başvuruda istenir)" }, { ul: TEMEL_BELGE.map(b => `${(values.belgeler || p?.belgeler || {})[b] ? "[Hazır]" : "[Eksik]"}  ${b}`) },
    ...((x.belgeler || []).length ? [{ h2: "Bu destek için hazırlanacak belgeler" }, { ul: x.belgeler }] : []),
    ...(resmiBelge.length ? [{ h2: "Resmi belgeler (çağrı metni, genelge, özet form)" }, { ul: resmiBelge }] : []),
    ...(x.sayfa?.metin ? [{ h2: "Kurumun sayfasından" }, { p: x.sayfa.metin }, { small: "Kaynak: " + x.sayfa.url }] : []),
    { small: "Güncel koşulları ve son başvuru tarihini kurumun resmi sayfasından kontrol et. FonRota kamu kurumlarıyla resmi bağı olmayan bağımsız bir bilgilendirme platformudur." }
  ], x.ad);
  return doc.save();
}

/* ---------- Kredi geri ödeme planı ---------- */
function plan(P, k) {
  const n = k.vade_ay - k.geri_odemesiz_ay, i = (k.faiz_yillik || 0) / 1200;
  const taksit = i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n; const rows = []; let kalan = P;
  for (let m = 1; m <= k.vade_ay; m++) { if (m <= k.geri_odemesiz_ay) { rows.push({ m, odeme: 0, kalan }); continue; } const faiz = kalan * i; kalan = Math.max(0, kalan - (taksit - faiz)); rows.push({ m, odeme: taksit, kalan }); }
  return { taksit, toplam: taksit * n, rows };
}
function chartSVG(p, P) {
  const W = Math.max(320, p.rows.length * 12), H = 150, pad = 22, bw = (W - pad) / p.rows.length;
  const bars = p.rows.map((r, j) => { const h = (r.kalan / P) * (H - pad - 10); return `<rect x="${pad + j * bw + 1}" y="${H - pad - h}" width="${Math.max(1, bw - 2)}" height="${h}" rx="1" fill="${r.odeme ? "var(--seal)" : "var(--line)"}"><title>${r.m}. ay, kalan ${tl(Math.round(r.kalan))}</title></rect>`; }).join("");
  const ticks = p.rows.filter(r => r.m % 12 === 0).map(r => `<text x="${pad + (r.m - .5) * bw}" y="${H - 6}" font-size="11" text-anchor="middle" fill="var(--muted)">${r.m / 12}. yıl</text>`).join("");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Aylara göre kalan borç">${bars}${ticks}</svg>`;
}

/* Öz kaynak grafiği: üstte bütçenin dağılımı, altta aylara göre nakit durumu */
function ozChart({ hibe, oz, kdv, ay }) {
  const W = 640, top = 34, tot = hibe + oz + kdv || 1, x0 = 0, bw = W;
  const seg = [[hibe, "var(--ok)", "Hibe"], [oz, "var(--seal)", "Öz kaynak"], [kdv, "var(--mid)", "KDV"]];
  let x = x0, bar = "", leg = "";
  seg.forEach(([v, c, t], i) => { const w = v / tot * bw; if (w > 0) bar += `<rect x="${x}" y="0" width="${w}" height="${top}" fill="${c}"><title>${t}: ${tl(Math.round(v))}</title></rect>` + (w > 70 ? `<text x="${x + 8}" y="22" font-size="13" font-weight="700" fill="#fff">%${Math.round(v / tot * 100)}</text>` : ""); x += w;
    leg += `<g transform="translate(${i * 150},${top + 20})"><rect width="11" height="11" rx="2" fill="${c}"/><text x="17" y="10" font-size="12.5" fill="var(--muted)">${t} ${tl(Math.round(v))}</text></g>`; });
  const n = Math.max(ay + 2, 6), CH = 120, cy0 = top + 72, cw = W / n, lo = -(hibe + oz + kdv);
  const yv = v => cy0 + 8 + (v / lo) * (CH - 30);
  let cols = "";
  for (let m = 0; m < n; m++) { const v = m < ay ? lo : lo + hibe; const y = yv(0), h = yv(v) - y;
    cols += `<rect x="${m * cw + 3}" y="${y}" width="${cw - 6}" height="${Math.max(1, h)}" rx="3" fill="${m < ay ? "var(--no)" : "var(--seal)"}" opacity="${m < ay ? .75 : .9}"><title>${m}. ay: cebinden çıkmış ${tl(Math.round(-v))}</title></rect><text x="${m * cw + cw / 2}" y="${cy0 + CH + 4}" font-size="11" text-anchor="middle" fill="var(--muted)">${m === 0 ? "Başlangıç" : m + ". ay"}</text>`; }
  const lab = (m, v, c) => `<text x="${m * cw + cw / 2}" y="${yv(0) + 18}" font-size="12" font-weight="700" text-anchor="middle" fill="#fff">${short(Math.round(-v)).replace(" milyon", " mn")}</text>`;
  cols += lab(0, lo) + (ay < n ? lab(ay, lo + hibe) : "");
  const ok = `<text x="0" y="${top + 50}" font-size="11.5" fill="var(--muted)">Aylara göre cebinden çıkan para</text><text x="${ay * cw + 4}" y="${cy0 - 4}" font-size="11.5" font-weight="700" fill="var(--ok)">↑ hibe geldi</text>`;
  return `<svg width="100%" viewBox="0 0 ${W} ${cy0 + CH + 12}" role="img" aria-label="Bütçenin hibe, öz kaynak ve KDV dağılımı ve aylara göre cebinden çıkan tutar"><g>${bar}</g>${leg}<line x1="0" x2="${W}" y1="${yv(0)}" y2="${yv(0)}" stroke="var(--line)"/>${cols}${ok}</svg>`;
}

/* ---------- Bildirimler: yeni ve uygun destekleri bul ---------- */
async function checkNew() {
  const u = await Store.user(); const p = await Store.profile(); if (!u || !p) return 0;
  const d = await data(); const fit = d.destekler.filter(x => ["ok", "mid"].includes(check(x, p).level)).map(x => x.id);
  if (!Store.demo) return (await Store.list("notifs")).filter(n => !n.read).length; // sunucu (notify.py) üretir
  let seen = LS.get("seen"); const notifs = LS.get("notifs", []);
  if (!seen) { LS.set("seen", fit); return notifs.filter(n => !n.read).length; }
  const yeni = fit.filter(id => !seen.includes(id));
  if (yeni.length) {
    yeni.forEach(id => notifs.unshift({ id, tarih: new Date().toISOString(), read: false }));
    LS.set("notifs", notifs); LS.set("seen", [...seen, ...yeni]);
    if (p.bildirimAnlik && "Notification" in window && Notification.permission === "granted") {
      const x = d.destekler.find(z => z.id === yeni[0]);
      try { new Notification("Sana uygun yeni destek", { body: x.ad + (yeni.length > 1 ? ` ve ${yeni.length - 1} destek daha` : "") }); } catch {}
    }
  }
  return notifs.filter(n => !n.read).length;
}
async function enablePush() {
  if (!("Notification" in window)) { toast("Tarayıcın bildirimleri desteklemiyor."); return false; }
  const perm = await Notification.requestPermission(); if (perm !== "granted") { toast("Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsin."); return false; }
  const s = await supa();
  if (s && C.VAPID_PUBLIC_KEY && "serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.register("sw.js");
    const key = Uint8Array.from(atob(C.VAPID_PUBLIC_KEY.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - C.VAPID_PUBLIC_KEY.length % 4) % 4)), c => c.charCodeAt(0));
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const u = await Store.user(); await s.from("push_subscriptions").upsert({ user_id: u.id, endpoint: sub.endpoint, keys: sub.toJSON().keys });
  }
  return true;
}

try { console.info(`%c${C.SITE_ADI || "FonRota"}%c © ${new Date().getFullYear()} ${C.SAHIP || ""}. Tüm hakları saklıdır.`, "font-weight:700;color:#B9832A", "color:inherit"); } catch {}
window.DB = { C, BUNDLE, $, $$, esc, low, tl, short, num, sfx, toast, today, ILLER, OLCEK, SEKTOR, AMAC, TUR, SIRKET, ALANLAR, params, href, link, go, data, byId, LS, Store, classify, check, LEVEL_TAG, daysLeft, ruleAnalyze, aiAvailable, ai, saveFile, fillForm, infoPdf, writePdf, pdfLibs, fonts, plan, chartSVG, ozChart, checkNew, enablePush, asset, lang, setLang, kitleUyar, kitleMetni, ON_KOSUL, onKosullar, TEMEL_BELGE, yonetici, SOZLUK, terim, icsDosya, indir, siteUrl, profilDoluluk };
})();
