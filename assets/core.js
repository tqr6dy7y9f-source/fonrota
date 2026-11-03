/* Destek Bulucu – çekirdek: yardımcılar, veri, hesap, uygunluk, yapay zekâ, PDF */
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
const Store = {
  demo: !C.SUPABASE_URL,
  async user() {
    const s = await supa(); if (!s) return LS.get("user");
    const { data: { user } } = await s.auth.getUser(); return user ? { id: user.id, email: user.email, ad: user.user_metadata?.ad } : null;
  },
  async signUp({ email, password, ad, profil }) {
    const s = await supa();
    if (!s) { const accounts = LS.get("accounts", {}); if (accounts[email]) throw new Error("Bu e-posta ile zaten bir hesap var. Giriş yap."); accounts[email] = { ad, password }; LS.set("accounts", accounts); LS.set("user", { email, ad }); await this.saveProfile(profil); return; }
    const p = { ...profil }; const c = classify(num(p.calisan), num(p.ciro), num(p.bilanco)); if (c) { p.olcek = c.olcek; p.olcekAdi = OLCEK[c.olcek]; }
    LS.set("profile", p);
    // Profil, kayıtla birlikte gönderilir; veritabanındaki tetikleyici hesabı ve profili birlikte kaydeder.
    const { data, error } = await s.auth.signUp({ email, password, options: { data: { ad, profil: p }, emailRedirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "hesap.html" } });
    if (error) throw new Error(/registered|exists/i.test(error.message) ? "Bu e-posta ile zaten bir hesap var. Giriş yap." : /password/i.test(error.message) ? "Şifre çok zayıf. Daha uzun bir şifre seç." : error.message);
    if (data.user && !(data.user.identities || []).length) throw new Error("Bu e-posta ile zaten bir hesap var. Giriş yap.");
    if (!data.session) return { onayGerekli: true };
    await this.saveProfile(p);
  },
  async signIn({ email, password }) {
    const s = await supa();
    if (!s) { const a = LS.get("accounts", {})[email]; if (!a || a.password !== password) throw new Error("E-posta veya şifre hatalı."); LS.set("user", { email, ad: a.ad }); return; }
    const { error } = await s.auth.signInWithPassword({ email, password });
    if (error) throw new Error(/confirm/i.test(error.message) ? "Önce e-postana gelen onay bağlantısına tıkla." : "E-posta veya şifre hatalı.");
  },
  async signOut() { const s = await supa(); if (s) await s.auth.signOut(); LS.del("user"); },
  async profile() {
    const s = await supa(); const u = s && await this.user();
    if (u) { const { data: r } = await s.from("profiles").select("data").eq("id", u.id).maybeSingle(); if (r) return r.data; }
    return LS.get("profile");
  },
  async saveProfile(p) {
    p = { ...(await this.profile() || {}), ...p };
    const c = classify(num(p.calisan), num(p.ciro), num(p.bilanco)); if (c) { p.olcek = c.olcek; p.olcekAdi = OLCEK[c.olcek]; }
    LS.set("profile", p);
    const s = await supa(); const u = s && await this.user();
    if (u) await s.from("profiles").upsert({ id: u.id, data: p, notify_email: !!p.bildirimEposta, updated_at: new Date().toISOString() });
    return p;
  },
  async list(k) {
    const s = await supa(); const u = s && await this.user();
    if (u && k === "apps") { const { data: r } = await s.from("applications").select("*").eq("user_id", u.id); return (r || []).map(a => ({ id: a.program_id, durum: a.status, tarih: a.updated_at, values: a.values })); }
    if (u && k === "notifs") { const { data: r } = await s.from("notifications").select("*").eq("user_id", u.id).order("created_at", { ascending: false }); return (r || []).map(n => ({ nid: n.id, id: n.program_id, tarih: n.created_at, read: n.read })); }
    return LS.get(k, []);
  },
  async saveApp(a) {
    const apps = LS.get("apps", []); const i = apps.findIndex(x => x.id === a.id);
    const v = { ...(apps[i] || {}), ...a, tarih: new Date().toISOString() }; if (i >= 0) apps[i] = v; else apps.push(v); LS.set("apps", apps);
    const s = await supa(); const u = s && await this.user();
    if (u) await s.from("applications").upsert({ user_id: u.id, program_id: v.id, status: v.durum, values: v.values || {}, updated_at: v.tarih }, { onConflict: "user_id,program_id" });
    return v;
  },
  async markRead() {
    LS.set("notifs", LS.get("notifs", []).map(n => ({ ...n, read: true })));
    const s = await supa(); const u = s && await this.user(); if (u) await s.from("notifications").update({ read: true }).eq("user_id", u.id);
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
function check(x, p) {
  const r = []; if (!p) return { level: "none", r, score: 0 };
  const yil = new Date().getFullYear();
  if (p.olcek) r.push({ hard: true, ok: x.olcek.includes(p.olcek), t: "Ölçek: " + x.olcek.map(o => OLCEK[o]).join(", ") });
  if (p.sektorler && p.sektorler.length) r.push({ hard: true, ok: x.sektor.includes("tumu") || x.sektor.some(s => p.sektorler.includes(s)), t: "Sektör: " + x.sektor.map(s => SEKTOR[s] || s).join(", ") });
  if (p.il) r.push({ hard: true, ok: x.il.includes("tumu") || x.il.includes(p.il), t: "Bölge: " + (x.il.includes("tumu") ? "Türkiye geneli" : x.il.join(", ")) });
  if (x.firma_yasi_max && num(p.kurulusYili)) r.push({ hard: true, ok: yil - num(p.kurulusYili) <= x.firma_yasi_max, t: `İşletmenin en fazla ${x.firma_yasi_max} yıllık olması` });
  if (x.ihracat_gerekli) r.push({ hard: false, ok: !!p.ihracat, t: "İhracat yapıyor olmak" });
  if (p.borcYok === false) r.push({ hard: false, ok: false, t: "Vergi ve SGK borcu olmaması (çoğu destekte şart)" });
  const hardFail = r.some(c => c.hard && !c.ok), softFail = r.some(c => !c.hard && !c.ok);
  const level = !r.length ? "none" : hardFail ? "no" : softFail ? "mid" : "ok";
  const overlap = (x.amac || []).filter(a => (p.amaclar || []).includes(a)).length;
  return { level, r, score: ({ ok: 100, mid: 60, none: 40, no: 0 })[level] + overlap * 12 + (x.il.includes("tumu") ? 0 : 6) };
}
const LEVEL_TAG = { ok: `<span class="tag t-ok">Uygun</span>`, mid: `<span class="tag t-mid">Kısmen uygun</span>`, no: `<span class="tag t-no">Uygun değil</span>`, none: "" };
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
async function writePdf(doc, f, blocks, title) {
  const { rgb } = window.PDFLib; const W = 595.28, H = 841.89, M = 50; const ink = rgb(.07, .2, .23), mut = rgb(.36, .44, .41), seal = rgb(.72, .51, .16);
  let page, y;
  const newPage = () => { page = doc.addPage([W, H]); page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: seal }); page.drawText((C.SITE_ADI || "Destek Bulucu") + "  |  " + title, { x: M, y: H - 30, size: 8.5, font: f.r, color: mut }); y = H - 62; };
  const wrap = (text, font, size, width) => { const out = []; String(text).split("\n").forEach(par => { let line = ""; par.split(/\s+/).forEach(w => { const t = line ? line + " " + w : w; if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out; };
  const text = (t, { font = f.r, size = 10.5, color = ink, x = M, width = W - 2 * M, gap = 4 } = {}) => {
    for (const ln of wrap(t, font, size, width)) { if (y < M + size) newPage(); page.drawText(ln, { x, y, size, font, color }); y -= size + gap; }
  };
  newPage();
  for (const b of blocks) {
    if (b.h1) { text(b.h1, { font: f.b, size: 18, gap: 6 }); y -= 4; }
    if (b.h2) { y -= 10; if (y < M + 60) newPage(); text(b.h2, { font: f.b, size: 13, gap: 5 }); page.drawLine({ start: { x: M, y: y + 12 }, end: { x: W - M, y: y + 12 }, thickness: .6, color: rgb(.83, .86, .85) }); y -= 8; }
    if (b.p) { text(b.p); y -= 4; }
    if (b.small) { text(b.small, { size: 8.5, color: mut }); y -= 2; }
    if (b.kv) for (const [k, v] of b.kv) { const start = y; text(k, { size: 9.5, color: mut, width: 160 }); const after = y; y = start; text(v === "" || v == null ? "—" : String(v), { x: M + 170, width: W - 2 * M - 170, font: f.b, size: 10 }); y = Math.min(y, after) - 3; }
    if (b.ol) b.ol.forEach((it, i) => { const start = y; text(`${i + 1}.`, { width: 16 }); y = start; text(it, { x: M + 18, width: W - 2 * M - 18 }); });
    if (b.ul) for (const it of b.ul) { const start = y; text("•", { width: 10 }); y = start; text(it, { x: M + 14, width: W - 2 * M - 14 }); }
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
  // Doldurulamayan (taranmış) formlarda bilgileri ek sayfa olarak ekle
  if (!filled) await writePdf(doc, f, [{ h1: "Başvuru bilgileri (form eki)" }, { small: "Bu form otomatik doldurulamadı. Aşağıdaki bilgileri forma elle aktarın." }, { kv: x.alanlar.map(k => [ALANLAR[k]?.e || k, values[k]]) }], x.ad);
  return { bytes: await doc.save(), filled };
}

async function infoPdf(x, values, p) {
  const { PDFDocument } = await pdfLibs(); const doc = await PDFDocument.create(); const f = await fonts(doc);
  doc.setTitle(x.ad + " – başvuru bilgileri");
  const eksik = x.alanlar.filter(k => values[k] == null || values[k] === "");
  await writePdf(doc, f, [
    { h1: x.ad }, { small: `${x.kurum} · Hazırlanma tarihi ${today()}` },
    { p: x.ozet },
    { h2: "Başvuruda istenecek bilgiler" }, { kv: x.alanlar.map(k => [ALANLAR[k]?.e || k, ["ciro", "projeButcesi", "talepTutari"].includes(k) && num(values[k]) != null ? tl(num(values[k])) : values[k]]) },
    ...(eksik.length ? [{ small: "Eksik alanlar: " + eksik.map(k => ALANLAR[k]?.e || k).join(", ") }] : []),
    { h2: "Hazırlanması gereken belgeler" }, { ul: x.belgeler || [] },
    { h2: "Başvuru adımları" }, { ol: x.basvuru.adimlar || [] },
    { p: "Başvuru adresi: " + (x.basvuru.online || x.url) },
    { h2: "Koşullar" }, { ul: x.kosullar || [] },
    { small: "Bu rapor bilgilendirme amaçlıdır. Güncel koşulları kurumun resmi sayfasından kontrol edin." }
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

window.DB = { C, BUNDLE, $, $$, esc, low, tl, short, num, sfx, toast, today, ILLER, OLCEK, SEKTOR, AMAC, TUR, SIRKET, ALANLAR, params, href, link, go, data, byId, LS, Store, classify, check, LEVEL_TAG, daysLeft, ruleAnalyze, aiAvailable, ai, saveFile, fillForm, infoPdf, writePdf, pdfLibs, fonts, plan, chartSVG, checkNew, enablePush, asset, lang, setLang };
})();
