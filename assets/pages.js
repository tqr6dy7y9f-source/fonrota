/* FonRota – sayfalar */
(function () {
const D = window.DB; let ROOT = document;
const $ = (s, r) => (r || ROOT).querySelector(s) || (r ? null : document.querySelector(s));
const $$ = (s, r) => [...(r || ROOT).querySelectorAll(s)];
const { esc, tl, short, num, sfx, toast, link, go, params, Store, OLCEK, SEKTOR, AMAC, TUR, ALANLAR, ILLER, SIRKET, LEVEL_TAG, C } = D;

/* ---------- Üst menü ve alt bilgi ---------- */
async function layout(page) {
  const top = $("#top"); if (!top) return;
  const u = await Store.user();
  const cur = p => p === page ? ' aria-current="page"' : "";
  top.innerHTML = `<div class="wrap">
    <a class="brand" ${link("index")}><i aria-hidden="true"></i><span>${esc(C.SITE_ADI)}</span></a>
    <nav class="nav" aria-label="Ana menü">
      <a ${D.BUNDLE ? link("index") : 'href="index.html#nasil"'} class="hide-m">Nasıl çalışır?</a>
      <a ${link("destekler")}${cur("destekler")} class="hide-s">Tüm destekler</a>
      <a ${link("bul")}${cur("bul")} class="hide-m">Uygunluk testi</a>
      ${u ? `<a ${link("hesap")}${cur("hesap")} id="nav-hesap">Hesabım</a>`
          : `<a ${link("hesap", "sekme=giris")}${cur("hesap")} id="nav-hesap">Giriş yap</a><a class="btn sm seal nav-cta" ${link("hesap", "sekme=kayit")}><span class="uzun">Ücretsiz hesap aç</span><span class="kisa">Hesap aç</span></a>`}
      <button type="button" class="lang" id="lang" translate="no" aria-label="${D.lang() === "en" ? "Türkçeye geç" : "Switch to English"}">${D.lang() === "en" ? "TR" : "EN"}</button>
    </nav></div>`;
  $("#lang").onclick = () => D.setLang(D.lang() === "en" ? "tr" : "en");
  const n = await D.checkNew();
  if (n) $("#nav-hesap").insertAdjacentHTML("beforeend", `<span class="badge" aria-label="${n} yeni bildirim">${n}</span>`);
  const ft = $("#footer");
  if (ft) { const d = await D.data(); ft.innerHTML = `<div class="wrap"><span>Bilgiler T.C. Sanayi ve Teknoloji Bakanlığı Destekler Platformu’ndan ve kurumların (KOSGEB, TÜBİTAK, kalkınma ajansları…) sitelerinden her hafta otomatik toplanır. Başvurmadan önce koşulları kurumun sayfasından kontrol et.</span><span>Son güncelleme: ${new Date(d.guncelleme).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}${surum() ? ` · Sürüm ${surum()}` : ""}</span></div>`; }
}
// Sürüm numarası: sayfadaki script bağlantısının ?v= değeri (tools/surum.py yeniler)
function surum() { const m = [...document.scripts].map(x => x.src.match(/pages\.js\?v=(\d+)/)).find(Boolean); return m ? m[1] : ""; }
function sampleNotice(d) { return d.ornek ? `<div class="notice">Şu an örnek veri gösteriliyor. Haftalık güncelleme çalıştığında kurumların sitelerindeki güncel ilanlar burada yer alır.</div>` : ""; }
function money(x) { return x.ust_limit ? `<span class="money">${short(x.ust_limit)}’ye kadar</span>` : x.destek_orani ? `<span class="money">%${x.destek_orani} destek</span>` : ""; }
// Destekler Platformu "sürekli açık" programlar için 30.12.2030 gibi uzak bir yer tutucu tarih kullanıyor
const tarihli = x => x.son_basvuru && x.son_basvuru < "2030-01-01";
function due(x) { const d = D.daysLeft(x.son_basvuru); return tarihli(x) ? `<span class="due ${d <= 21 ? "soon" : ""}">Son başvuru: ${d <= 0 ? "bugün" : d + " gün kaldı"}</span>` : `<span class="due">${x.sayfa ? "Tarih için kurumun sayfasına bak" : "Sürekli açık veya çağrıya bağlı"}</span>`; }
function itemRow(x, c) {
  return `<li class="item"><a ${link("destek", "id=" + x.id)}>
    <h3>${esc(x.ad)}</h3><span class="meta">${esc(x.kurum)}, ${D.low(TUR[x.tur] || x.tur)}</span>
    <span class="ozet">${esc(x.ozet)}</span>
    <span class="side">${money(x)}${LEVEL_TAG[c.level]}${due(x)}</span></a></li>`;
}
function fieldHTML(k, v, opt = {}) {
  const a = ALANLAR[k] || { e: k }; const id = (opt.pre || "f-") + k; const req = opt.req ? " required" : "";
  let input;
  if (a.sec) input = `<select class="input" id="${id}" name="${k}"${req}><option value="">Seç</option>${a.sec.map(s => `<option${s === v ? " selected" : ""}>${esc(s)}</option>`).join("")}</select>`;
  else if (a.uzun) input = `<textarea class="input" id="${id}" name="${k}"${req}>${esc(v)}</textarea>`;
  else input = `<input class="input" id="${id}" name="${k}" type="${a.t || "text"}" value="${esc(v)}" ${a.ph ? `placeholder="${esc(a.ph)}"` : ""}${a.t === "number" ? ' inputmode="numeric" min="0"' : ""}${req}>`;
  return `<label class="field" for="${id}"><span>${esc(a.e)}</span>${input}${a.yardim ? `<small>${esc(a.yardim)}</small>` : ""}</label>`;
}
const formValues = form => Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));

/* ---------- Tanıtım videosu (60 sn, kendi kendine oynayan animasyon) ---------- */
function player(el, { autoplay = false } = {}) {
  const tabs = ["KOSGEB", "TÜBİTAK", "Kalkınma ajansı", "Ticaret Bakanlığı", "TKDK", "SGK teşvikleri", "Eximbank", "Sanayi Bakanlığı", "KGF", "İŞKUR", "AB fonları", "Teşvik belgesi"];
  const pos = tabs.map((_, i) => [6 + (i % 4) * 22 + (i * 7) % 6, 40 + Math.floor(i / 4) * 11 + (i * 5) % 4]);
  const typed = "Samsun’da 12 kişiyle mobilya üretiyoruz. CNC makinesi almak ve ihracata başlamak istiyoruz.";
  const S = [
    { cap: "Onlarca kurum, yüzlerce sayfa, her birinin kuralı farklı.", html: `<div class="t1">Devlet desteği çok. Bulmak zor.</div>${tabs.map((t, i) => `<span class="v-tab" style="left:${pos[i][0]}%;top:${pos[i][1]}%;opacity:0">${t}</span>`).join("")}`,
      tick(e, t) { $$(".v-tab", e).forEach((x, i) => { const on = t > 1 + i * .55; x.style.opacity = on ? 1 : 0; x.style.transform = on ? `rotate(${(i % 5) - 2}deg)` : "scale(.6)"; }); } },
    { cap: "Yapay zekâ sektörünü ve neye ihtiyacın olduğunu çıkarır.", html: `<div class="t1">Önce işini anlat.</div><div class="v-type"></div>`,
      tick(e, t) { $(".v-type", e).textContent = typed.slice(0, Math.max(0, Math.floor((t - .8) * 14))); } },
    { cap: "Ölçeğini güncel KOBİ yönetmeliğine göre biz belirleriz.", html: `<div class="t1">Çalışan sayını gir.</div><div class="v-count">0</div><div><span class="v-pill">Küçük işletme</span></div>`,
      tick(e, t) { $(".v-count", e).textContent = Math.min(12, Math.floor(t * 4)); $(".v-pill", e).classList.toggle("on", t > 4); } },
    { cap: "Hibe, kredi ve teşvikler kurum kurum. Sana uymayanlar elenir.", html: `<div class="t1">Sana uyanlar kurum kurum.</div><div class="v-kolon">${[["KOSGEB", ["Yapay Zekâ Kredisi", "Stratejik Ürün Desteği"]], ["TÜBİTAK", ["1702 Patent Tabanlı", "1831 Yeşil İnovasyon"]], ["Ticaret Bak.", ["Pazara Giriş Belgesi", "Fuar Desteği"]]].map(([k, l]) => `<div><b>${k}</b>${l.map(t => `<span class="vk">${t}</span>`).join("")}</div>`).join("")}</div>`,
      tick(e, t) { $$(".vk", e).forEach((n, i) => n.classList.toggle("on", t > 1 + i * .6)); } },
    { cap: "Her destek için bilgilerinle doldurulmuş başvuru hazırlık formu; resmi form varsa o doldurulur.", html: `<div class="t1">Formun hazır.</div><div class="v-form">${["Firma ünvanı", "Vergi no", "Çalışan sayısı", "İşletme ölçeği", "Proje adı"].map(k => `<div><span>${k}</span><b>✓ dolduruldu</b></div>`).join("")}</div>`,
      tick(e, t) { $$(".v-form b", e).forEach((b, i) => b.classList.toggle("on", t > 1.2 + i * .9)); } },
    { cap: "Ücretsiz hesap aç, sana uygun destekleri kaçırma.", html: `<div class="t1">Yeni destek çıkınca ilk sen öğren.</div><div class="t2">${esc(C.SITE_ADI)}</div><div class="v-note"><b>Sana uygun yeni destek</b>Mali Destek Programı yayımlandı. Profiline uyuyor.</div>`,
      tick(e, t) { $(".v-note", e).classList.toggle("on", t > 1.5); } }
  ];
  const DUR = 10, TOTAL = S.length * DUR;
  el.innerHTML = `<div class="time" aria-hidden="true"></div>${S.map(s => `<div class="scene">${s.html}</div>`).join("")}<div class="cap" aria-live="polite"></div><div class="bar"></div><button class="pause" type="button" hidden>Durdur</button><button class="ctrl" type="button" aria-label="Tanıtım videosunu oynat"><span aria-hidden="true">▶</span></button>`;
  const scenes = $$(".scene", el); let t = 0, last = 0, playing = false, raf, cur = -1;
  const draw = () => {
    const i = Math.min(S.length - 1, Math.floor(t / DUR)); const lt = t - i * DUR;
    if (i !== cur) { scenes.forEach((s, j) => s.classList.toggle("on", j === i)); $(".cap", el).textContent = S[i].cap; cur = i; }
    S[i].tick(scenes[i], lt); $(".bar", el).style.width = (t / TOTAL * 100) + "%";
    $(".time", el).textContent = `0:${String(Math.floor(t)).padStart(2, "0")} / 1:00`;
  };
  const loop = now => { if (!playing) return; t += Math.max(0, now - last) / 1000; last = now; if (t >= TOTAL) { t = TOTAL - .01; draw(); stop(true); return; } draw(); raf = requestAnimationFrame(loop); };
  const start = () => { if (t >= TOTAL - .1) { t = 0; cur = -1; } playing = true; last = performance.now(); $(".ctrl", el).hidden = true; $(".pause", el).hidden = false; raf = requestAnimationFrame(loop); };
  const stop = end => { playing = false; cancelAnimationFrame(raf); $(".ctrl", el).hidden = false; $(".pause", el).hidden = true; $(".ctrl span", el).textContent = end ? "↺" : "▶"; };
  $(".ctrl", el).onclick = start; $(".pause", el).onclick = () => stop(false);
  draw(); if (autoplay) start();
  return { start, seek: s => { t = s; draw(); } };
}

/* ---------- Ana sayfa ---------- */
const P = {};
P.index = async () => {
  const d = await D.data(); const kurum = new Set(d.destekler.map(x => x.kurum)).size;
  $("#stat").textContent = `${d.destekler.length} destek programı, ${kurum} kurum`;
  const pl = player($("#video"), { autoplay: params().get("oynat") === "1" });
  // Sayfa açılınca kendiliğinden başlasın: video ekranda görünür olduğu an (telefonda aşağı kaydırınca) bir kez oynar.
  // "Hareketi azalt" ayarı açık olanlarda başlatılmaz; onlar ▶ ile başlatır.
  if (params().get("oynat") !== "1" && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); pl.start(); } }, { threshold: 0.5 });
      io.observe($("#video"));
    } else pl.start();
  }
  window.__player = pl;
};

/* ---------- Tüm destekler ---------- */
P.destekler = async () => {
  const d = await D.data(); const prof = await Store.profile();
  $("#notice").innerHTML = sampleNotice(d);
  const st = { tur: "", il: prof?.il || "", olcek: prof?.olcek || "", q: "", sort: "uygun" };
  $("#f-il").innerHTML = `<option value="">Tüm iller</option>` + ILLER.map(i => `<option${i === st.il ? " selected" : ""}>${i}</option>`).join("");
  $("#f-olcek").innerHTML = `<option value="">Tüm ölçekler</option>` + Object.entries(OLCEK).map(([k, v]) => `<option value="${k}"${k === st.olcek ? " selected" : ""}>${v}</option>`).join("");
  const render = () => {
    const p = st.il || st.olcek ? { ...(prof || {}), il: st.il, olcek: st.olcek } : prof;
    let rows = d.destekler.map(x => ({ x, c: D.check(x, p) })).filter(({ x }) => (!st.tur || x.tur === st.tur) && (!st.q || D.low(x.ad + " " + x.kurum + " " + x.ozet).includes(D.low(st.q))));
    rows.sort((a, b) => st.sort === "tarih" ? (a.x.son_basvuru || "9999").localeCompare(b.x.son_basvuru || "9999") : st.sort === "tutar" ? (b.x.ust_limit || 0) - (a.x.ust_limit || 0) : b.c.score - a.c.score);
    const hedefe = r => (prof?.amaclar || []).some(a => (r.x.amac || []).includes(a));
    $("#count").innerHTML = `${rows.length} destek listeleniyor.` + (p ? ` Uygunluk testindeki bilgilerine göre <strong>${rows.filter(r => r.c.level === "ok" && hedefe(r)).length}</strong> tanesi hedefine uyuyor ve ölçeğin elenmiyor. Kesin şartlar her desteğin resmi metninde. <a href="#" id="profil-sil">Test bilgilerimi sil</a>` : "");
    const ps = $("#profil-sil"); if (ps) ps.onclick = async e => { e.preventDefault(); D.LS.del("profile"); D.LS.del("draft"); D.LS.del("mmFiltre"); toast("Test bilgilerin bu tarayıcıdan silindi."); setTimeout(() => location.reload(), 600); };
    $("#list").innerHTML = rows.length ? rows.map(r => itemRow(r.x, r.c)).join("") : `<li class="empty">Bu filtrelerle eşleşen destek yok.</li>`;
  };
  $$("#f-tur .chip").forEach(b => b.onclick = () => { $$("#f-tur .chip").forEach(c => c.setAttribute("aria-pressed", c === b)); st.tur = b.dataset.v; render(); });
  $("#f-il").onchange = e => { st.il = e.target.value; render(); };
  $("#f-olcek").onchange = e => { st.olcek = e.target.value; render(); };
  $("#f-q").oninput = e => { st.q = e.target.value; render(); };
  $("#f-sort").onchange = e => { st.sort = e.target.value; render(); };
  if (!prof) $("#cta-test").hidden = false;
  render();
};

/* ---------- Uygunluk testi (3 adım) ---------- */
P.bul = async () => {
  const adim = Math.min(3, Math.max(1, +params().get("adim") || 1));
  const draft = { ...(await Store.profile() || {}), ...D.LS.get("draft", {}) };
  const save = v => D.LS.set("draft", { ...D.LS.get("draft", {}), ...v });
  $$(".progress i").forEach((i, n) => i.classList.toggle("on", n < adim));
  $("#adim-no").textContent = `Adım ${adim} / 3`;
  const box = $("#wizard");
  const chipsHTML = (obj, sel, name) => `<div class="chips" data-name="${name}">${Object.entries(obj).filter(([k]) => k !== "tumu").map(([k, v]) => `<button type="button" class="chip" data-v="${k}" aria-pressed="${(sel || []).includes(k)}">${v}</button>`).join("")}</div>`;
  if (adim === 1) {
    box.innerHTML = `<h1>İşini birkaç cümleyle anlat.</h1>
      <p class="muted">Ne ürettiğini veya sattığını, nerede olduğunu ve ne yapmak istediğini yaz. Sektörünü ve ihtiyaçlarını biz çıkaralım.</p>
      <label class="field" for="metin"><span>İşin ve hedefin</span><textarea class="input" id="metin" placeholder="ör. Samsun’da 12 kişiyle mobilya üretiyoruz. CNC makinesi almak ve ihracata başlamak istiyoruz.">${esc(draft.isTanimi)}</textarea></label>
      <button class="btn seal" type="button" id="analiz">İşimi analiz et</button>
      <div id="sonuc"></div>
      <div class="nav-btns"><span></span><button class="btn" type="button" id="ileri">Devam et</button></div>`;
    const showResult = r => {
      $("#sonuc").innerHTML = `<div class="ai-box">
        ${r.ozet ? `<h3>Anladığımız kadarıyla</h3><p>${esc(r.ozet)}</p>` : `<h3>İşine göre seçtiklerimiz</h3>`}
        <p class="small muted" style="margin-top:12px">Sektörün (yanlışsa değiştir)</p>${chipsHTML(SEKTOR, r.sektorler, "sektorler")}
        <p class="small muted" style="margin-top:12px">Neye ihtiyacın var?</p>${chipsHTML(AMAC, r.amaclar, "amaclar")}
        ${r.nace_onerisi ? `<p class="small" style="margin-top:12px">Olası faaliyet kodu: <strong>${esc(r.nace_onerisi)}</strong></p>` : ""}
        ${r.ipucu ? `<p class="small">İpucu: ${esc(r.ipucu)}</p>` : ""}
        ${r.kaynak === "kural" ? `<p class="small muted">Anahtar kelimelere göre seçildi.</p>` : ""}</div>`;
      $$("#sonuc .chip").forEach(c => c.onclick = () => c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true"));
    };
    const collect = () => { const g = n => $$(`#sonuc [data-name=${n}] .chip[aria-pressed=true]`).map(c => c.dataset.v); return $("#sonuc .chips") ? { sektorler: g("sektorler"), amaclar: g("amaclar") } : {}; };
    if (draft.sektorler || draft.amaclar) showResult({ ozet: draft.isOzet, sektorler: draft.sektorler, amaclar: draft.amaclar, nace_onerisi: draft.naceOneri });
    $("#analiz").onclick = async () => {
      const metin = $("#metin").value.trim(); if (metin.length < 15) { toast("Biraz daha ayrıntı yaz: en az bir cümle."); return; }
      const b = $("#analiz"); b.disabled = true; b.textContent = "Analiz ediliyor…";
      let r = null; try { if (await D.aiAvailable()) r = await D.ai("analiz", { metin }); } catch {}
      if (!r) r = D.ruleAnalyze(metin);
      r.sektorler = (r.sektorler || []).filter(k => SEKTOR[k]); r.amaclar = (r.amaclar || []).filter(k => AMAC[k]);
      save({ isTanimi: metin, isOzet: r.ozet, naceOneri: r.nace_onerisi }); showResult(r);
      b.disabled = false; b.textContent = "Tekrar analiz et";
    };
    $("#ileri").onclick = () => { const v = collect(); save({ isTanimi: $("#metin").value.trim(), ...v }); go("bul", "adim=2"); };
  }
  if (adim === 2) {
    box.innerHTML = `<h1>İşletmen ne büyüklükte?</h1>
      <p class="muted">Ölçeğini güncel KOBİ yönetmeliğine göre biz belirleriz. Ciroyu bilmiyorsan boş bırakabilirsin.</p>
      <div class="row">${fieldHTML("calisan", draft.calisan)}${fieldHTML("ciro", draft.ciro)}</div>
      <label class="field" for="f-bilanco"><span>Yıllık bilanço toplamı (TL, isteğe bağlı)</span><input class="input" id="f-bilanco" type="number" inputmode="numeric" min="0" value="${esc(draft.bilanco)}"></label>
      <div id="olcek" aria-live="polite"></div>
      <div class="nav-btns"><a class="btn ghost" ${link("bul", "adim=1")}>Geri</a><button class="btn" type="button" id="ileri">Devam et</button></div>`;
    const upd = () => { const c = D.classify(num($("#f-calisan").value), num($("#f-ciro").value), num($("#f-bilanco").value));
      $("#olcek").innerHTML = c ? `<div class="size-result"><strong>${OLCEK[c.olcek]}</strong><span class="small">${esc(c.neden)}</span></div>` : ""; };
    $$("#wizard input").forEach(i => i.oninput = upd); upd();
    $("#ileri").onclick = () => { if (num($("#f-calisan").value) == null) { toast("Çalışan sayısını gir."); $("#f-calisan").focus(); return; } save({ calisan: $("#f-calisan").value, ciro: $("#f-ciro").value, bilanco: $("#f-bilanco").value }); go("bul", "adim=3"); };
  }
  if (adim === 3) {
    box.innerHTML = `<h1>Son birkaç bilgi.</h1>
      <p class="muted">Desteklerin çoğu yalnızca belirli kuruluşlara açık (ör. ihracatçılar, çiftçiler, işbirliği kuruluşları). Bu bilgilerle sana uymayanları eleriz.</p>
      <div class="row">${fieldHTML("il", draft.il)}${fieldHTML("kurulusYili", draft.kurulusYili)}</div>
      ${fieldHTML("sirketTuru", draft.sirketTuru)}
      <label class="field" for="f-tip"><span>Başvuruyu kim yapacak?</span><select class="input" id="f-tip">${[["sirket", "Şirket veya şahıs işletmesi"], ["ciftci", "Çiftçi / tarımsal üretici (ÇKS kayıtlı)"], ["kooperatif", "Kooperatif veya üretici birliği"], ["isbirligi", "Oda, borsa, ihracatçı birliği, OSB veya sektör derneği"], ["kamu", "Kamu kurumu, üniversite, dernek veya vakıf"]].map(([v, t]) => `<option value="${v}"${(draft.isletmeTipi || "sirket") === v ? " selected" : ""}>${t}</option>`).join("")}</select><small>Birçok desteğe yalnızca belirli kuruluşlar başvurabiliyor; buna göre eleriz.</small></label>
      <label class="check"><input type="checkbox" id="ihracat" ${draft.ihracat ? "checked" : ""}> İhracat yapıyoruz veya bu yıl başlayacağız</label>
      <p class="small muted" style="margin:16px 0 6px">Sende hangileri var? (varsa işaretle)</p>
      <div class="chips" id="ozel">${[["serbest", "Serbest bölgede faaliyet"], ["argemerkezi", "Ar-Ge/tasarım merkezi veya teknoparktayız"], ["turizm", "Turizm belgeli işletme"], ["medya", "Film, medya, yayıncılık veya kültür"], ["muteahhit", "Yurt dışında müteahhitlik"], ["lojistik", "Uluslararası nakliyat/lojistik"], ["gemi", "Gemi/yat inşa"], ["dts", "Dış ticaret şirketiyiz (DTSŞ/SDTŞ)"]].map(([v, t]) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${(draft.ozelDurum || []).includes(v)}">${t}</button>`).join("")}</div>
      <label class="check"><input type="checkbox" id="borcYok" ${draft.borcYok !== false ? "checked" : ""}> Vergi ve SGK borcumuz yok (veya yapılandırılmış)</label>
      <div class="nav-btns"><a class="btn ghost" ${link("bul", "adim=2")}>Geri</a><button class="btn seal" type="button" id="bitir">Uygun destekleri göster</button></div>`;
    $$("#ozel .chip").forEach(c => c.onclick = () => c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true"));
    $("#bitir").onclick = async () => {
      if (!$("#f-il").value) { toast("İlini seç."); $("#f-il").focus(); return; }
      save({ il: $("#f-il").value, kurulusYili: $("#f-kurulusYili").value, sirketTuru: $("#f-sirketTuru").value, ihracat: $("#ihracat").checked, borcYok: $("#borcYok").checked,
        isletmeTipi: $("#f-tip").value, ozelDurum: $$("#ozel .chip[aria-pressed=true]").map(c => c.dataset.v) });
      await Store.saveProfile(D.LS.get("draft")); go("sonuclar");
    };
  }
};

/* ---------- Sonuçlar: kurumlara göre sütunlar ---------- */
function amount(x, butce) {
  const ad = x.tur === "kredi" ? "kredi" : x.tur === "vergi" ? "avantaj" : "hibe";
  if (butce > 0 && x.destek_orani && x.tur !== "vergi") { const n = Math.min(butce * x.destek_orani / 100, x.ust_limit || Infinity); return `${short(Math.round(n))} ${ad} (%${x.destek_orani})`; }
  if (x.ust_limit) return short(x.ust_limit) + "’ye kadar" + (x.oran_metin ? ` · ${x.oran_metin}` : x.destek_orani ? ` · %${x.destek_orani}` : "");
  if (x.oran_metin) return `${x.oran_metin} ${x.geri_odemeli ? "geri ödemeli destek" : ad}`;
  if (x.destek_orani) return `%${x.destek_orani} ${x.geri_odemeli ? "geri ödemeli destek" : ad}`;
  if (x.kredi) return x.kredi.faiz_yillik === 0 ? `Faizsiz kredi · ${x.kredi.vade_ay} ay vade` : `Kredi · ${x.kredi.vade_ay} ay vade`;
  return TUR[x.tur] || "Tutar ilanda";
}
/* Kurumlara göre sütunlar: her sütun bir kurum, kartlar fırsatlar. Uzun sütunlar ilk 5 kartla başlar. */
function kolonlar(root, goal, groups, butce, acik, kilit = new Set()) {
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  if (!total) return `<div class="empty"><h2>Bu filtreyle destek kalmadı.</h2><p>Filtrelerden birini kapatınca sütunlar yeniden dolar.</p></div>`;
  const col = { ok: "var(--ok)", mid: "var(--mid)", none: "var(--line)", no: "var(--no)" };
  const ILK = 5;
  return `<div class="k-ozet"><b>${esc(root)}</b><span>${esc(goal)}</span><span>${total} fırsat · ${groups.length} kurum</span></div>
    <div class="kolonlar mm-anim" role="list">${groups.map((g, gi) => {
      const hepsi = acik.includes(g.k), gor = hepsi ? g.items : g.items.slice(0, ILK);
      return `<section class="kolon" role="listitem" style="--d:${gi}" aria-label="${esc(g.k)}">
        <h3>${esc(g.k)} <small>${g.items.length}</small></h3>
        ${gor.map(({ x, c }) => kilit.has(x.id) ? `<button type="button" class="kart kilitli" data-kilit="1" aria-label="Kilitli destek: görmek için ücretsiz hesap aç">
          <span class="k-ad" aria-hidden="true">${esc(x.ad)}</span><span class="k-tutar" aria-hidden="true">${esc(amount(x, butce))}</span>
          <span class="k-kilit">🔒 Hesap açınca görünür</span></button>` : `<button type="button" class="kart" data-id="${esc(x.id)}" style="border-left-color:${col[c.level]}">
          <span class="k-ad">${esc(x.ad)}</span><span class="k-tutar">${esc(amount(x, butce))}</span>
          <span class="k-alt">${x.resmi ? "Resmi özet var" : x.sayfa ? "Kurum sayfasından" : ""}${tarihli(x) ? ` · ${D.daysLeft(x.son_basvuru)} gün kaldı` : x.resmi ? " · Sürekli açık" : ""}</span></button>`).join("")}
        ${g.items.length > ILK ? `<button type="button" class="k-daha" data-k="${esc(g.k)}">${hepsi ? "Daha az göster" : `+${g.items.length - ILK} tane daha`}</button>` : ""}
      </section>`; }).join("")}</div>`;
}

/* Bir başvuru için gerekenler: resmi metindeki "Kimler yararlanabilir?" maddeleri tek tek sorulur (metin aynen). */
function sartSatirlari(x) {
  const kimler = x.resmi && (x.resmi.bolumler.find(b => b.baslik.startsWith("Kimler")) || {}).metin;
  return (kimler || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => ({ metin: l.replace(/^[•–]\s*/, ""), alt: l.startsWith("–"), baslik: /[:;]$/.test(l) }));
}
function gerekenlerHTML(x) {
  const satir = sartSatirlari(x); const cev = D.LS.get("sart:" + x.id, {});
  const bolum = ad => x.resmi && (x.resmi.bolumler.find(b => b.baslik.startsWith(ad)) || {}).metin;
  const sorular = satir.map((r, i) => r.baslik ? `<p class="s-baslik">${esc(r.metin)}</p>` :
    `<fieldset class="soru${r.alt ? " alt" : ""}"><legend>${esc(r.metin)}</legend>${[["e", "Evet"], ["h", "Hayır"], ["b", "Emin değilim"]].map(([v, t]) => `<label><input type="radio" name="s${i}" value="${v}"${cev[i] === v ? " checked" : ""}> ${t}</label>`).join("")}</fieldset>`).join("");
  return `<p class="crumb">${esc(x.kurum)}</p><h2 id="g-baslik">${esc(x.ad)}</h2>
    <p class="small muted">${x.resmi ? `Sorular Bakanlığın özet bilgi formundaki “Kimler yararlanabilir?” maddelerinden <strong>aynen</strong> alındı.` : `Bu program için Bakanlığın özet formu yok; şartları kurumun sayfasından kontrol et.`}</p>
    ${satir.length ? `<h3>Bu şartları karşılıyor musun?</h3><form id="g-form">${sorular}</form><div id="g-sonuc" aria-live="polite"></div>` : ""}
    ${!satir.length && x.sayfa && x.sayfa.metin ? `<h3>Kurumun sayfasından</h3><div class="resmi-metin">${esc(x.sayfa.metin)}</div>` : ""}
    ${bolum("Başvuru dönemi") ? `<h3>Başvuru dönemi</h3><div class="resmi-metin">${esc(bolum("Başvuru dönemi"))}</div>` : ""}
    ${bolum("Başvuru yeri") ? `<h3>Nereye başvurulur?</h3><div class="resmi-metin">${esc(bolum("Başvuru yeri"))}</div>` : ""}
    ${x.resmi && x.resmi.belgeler.length ? `<h3>Resmi belgeler</h3><ul class="docs">${x.resmi.belgeler.map(d => `<li><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.ad)}</a></li>`).join("")}</ul>` : ""}
    <div class="actions"><a class="btn seal" ${link("destek", "id=" + x.id)}>Tüm ayrıntılar</a><a class="btn ghost" href="${esc((x.resmi && x.resmi.sayfa) || (x.sayfa && x.sayfa.url) || x.url)}" target="_blank" rel="noopener">Resmi sayfa ↗</a></div>`;
}
// Kullanıcının resmi şartlara verdiği cevaplara göre durum: "tam" (hepsine evet), "hayir" (en az bir hayır) veya null
function sartDurum(x) {
  const n = sartSatirlari(x).filter(r => !r.baslik).length; const cev = Object.values(D.LS.get("sart:" + x.id, {}));
  if (cev.includes("h")) return "hayir";
  return n && cev.length >= n && cev.every(v => v === "e") ? "tam" : null;
}
function kaydolHTML(n, kalan) {
  const say = t => kalan.filter(r => r.x.tur === t).length;
  const parca = [["hibe", "hibe"], ["kredi", "kredi"], ["vergi", "vergi/prim avantajı"]].map(([t, ad]) => say(t) ? `${say(t)} ${ad}` : "").filter(Boolean).join(", ");
  return `<h2 id="g-baslik">🔒 Hedefine uyan ${n} destekten 2’sini görüyorsun</h2>
    <p style="font-size:17px">${kalan.length} destek daha${parca ? ` (${parca})` : ""} seni bekliyor. Tamamını görmek ve başvuru için gerekenleri tek tek kontrol etmek için <strong>ücretsiz hesap aç</strong>.</p>
    <div class="g-durum"><b>Neden hesap?</b> Hesap açarsan daha net ve doğru sonuç veririz. Bazı desteklerin şartları (kuruluş yılı, ihracat yapmış olmak, Ar-Ge personeli çalıştırmak gibi) genel bilgilerle kesinleşmiyor. Hesabında bu şartları tek tek cevaplarsın; sana uymayanları eleyip yalnızca uyanları gösteririz. Girdiğin bilgiler kaybolmaz, hesabına aktarılır.</div>
    <div class="actions"><a class="btn seal" id="k-kayit" ${link("hesap", "sekme=kayit")}>Ücretsiz hesap aç</a><a class="btn ghost" id="k-giris" ${link("hesap", "sekme=giris")}>Hesabım var, giriş yap</a><button type="button" class="btn ghost" id="k-sonra">Şimdilik 2 desteğe bak</button></div>`;
}
function gerekenlerBagla(x, kutu) {
  const f = $("#g-form", kutu); if (!f) return;
  const satir = sartSatirlari(x);
  const ozet = () => {
    const cev = {}; satir.forEach((r, i) => { const v = f.querySelector(`input[name=s${i}]:checked`); if (v) cev[i] = v.value; });
    D.LS.set("sart:" + x.id, cev);
    Store.user().then(async u => { if (!u) return; const pr = await Store.profile() || {}; Store.saveProfile({ sartlar: { ...(pr.sartlar || {}), [x.id]: cev } }); });
    const n = satir.filter(r => !r.baslik).length, e = Object.values(cev).filter(v => v === "e").length, h = Object.values(cev).filter(v => v === "h").length, b = Object.values(cev).filter(v => v === "b").length;
    $("#g-sonuc", kutu).innerHTML = !Object.keys(cev).length ? "" : h ? `<div class="g-durum no"><b>${h} şartı karşılamadığını belirttin.</b> Bu desteğe şu an uygun görünmüyorsun; şartın tam metnini resmi formdan kontrol et.</div>`
      : e + b < n ? `<div class="g-durum">${n - e - b} şart daha cevaplanmadı.</div>`
      : b ? `<div class="g-durum mid"><b>${b} şarttan emin değilsin.</b> Bunları kurumdan veya resmi metinden teyit et.</div>`
      : `<div class="g-durum ok"><b>Tüm şartları karşıladığını belirttin.</b> Kesin karar kurumun değerlendirmesiyle verilir. <a ${link("basvuru", "id=" + x.id)}>Başvuruya hazırla →</a></div>`;
  };
  f.onchange = ozet; ozet();
}
P.sonuclar = async () => {
  const p = await Store.profile(); const d = await D.data();
  if (!p || !p.olcek) { $("#res").innerHTML = `<div class="empty"><h2>Önce işletmeni tanıyalım.</h2><p>Üç kısa adımda sana uygun destekleri çıkaralım.</p><a class="btn seal" ${link("bul")}>Uygunluk testine başla</a></div>`; return; }
  $("#notice").innerHTML = sampleNotice(d);
  const rows = d.destekler.map(x => ({ x, c: D.check(x, p) })).sort((a, b) => b.c.score - a.c.score);
  const fit = rows.filter(r => r.c.level === "ok"), mid = rows.filter(r => r.c.level === "mid");
  const secim = D.LS.get("secim");
  const hedefN = all => all.filter(r => !(p.amaclar || []).length || (r.x.amac || []).some(a => p.amaclar.includes(a))).length;
  $("#baslik").textContent = `Hedefine uyan ${hedefN(fit)} destek bulduk.`;
  const kitleElenen = p.isletmeTipi ? rows.filter(r => r.c.r.some(q => q.kitle && !q.ok)).length : 0;
  $("#profil").innerHTML = `${esc(OLCEK[p.olcek])}, ${esc((p.sektorler || []).map(s => SEKTOR[s]).join(", ") || "tüm sektörler")}, ${esc(p.il)}. <a ${link("bul")}>Bilgileri değiştir</a>` + (mid.length ? `<br>${mid.length} destek de kısmen uygun: bir koşulu henüz karşılamıyorsun.` : "") + `<br><span class="small">Ön eleme ölçek, il, hedef ve “Kimler yararlanabilir?” bilgisine göre yapılır${kitleElenen ? `; ${kitleElenen} destek yalnızca başka tür kuruluşlara (ör. çiftçiler, işbirliği kuruluşları, ihracatçılar) açık olduğu için elendi` : ""}. ${p.isletmeTipi ? "" : `<a ${link("bul", "adim=3")}>İşletme türünü belirt</a>, sonuçlar daralsın. `}Kesin başvuru şartları için her desteğin resmi metnine bak.</span>`;
  const kurumAdi = k => k.replace(/^Türk Eximbank$/, "Eximbank").replace(/ ve anlaşmalı bankalar$/, "").replace(/^SGK \/ İŞKUR$/, "SGK");
  const okN = g => g.items.filter(r => r.c.level === "ok").length;
  const groupBy = list => { const m = {}; list.forEach(r => { const k = kurumAdi(r.x.kurum); (m[k] = m[k] || []).push(r); }); return Object.entries(m).map(([k, items]) => ({ k, items: items.sort((a, b) => (a.c.level === "ok" ? 0 : 1) - (b.c.level === "ok" ? 0 : 1) || b.c.score - a.c.score) })).sort((a, b) => okN(b) - okN(a) || b.items.length - a.items.length); };
  const goal = (p.amaclar || []).length ? AMAC[p.amaclar[0]].replace(/ ve .*$/, "") + " hedefi" + (p.amaclar.length > 1 ? ` +${p.amaclar.length - 1}` : "") : "Büyüme hedefi";
  const view = params().get("gorunum") || "harita";
  $$("#view button").forEach(b => { b.setAttribute("aria-pressed", b.dataset.v === view); b.onclick = () => go("sonuclar", "gorunum=" + b.dataset.v); });
  const all = [...fit, ...mid];
  const u = await Store.user(); const misafir = !u;
  Object.entries(p.sartlar || {}).forEach(([id, c]) => { if (!D.LS.get("sart:" + id)) D.LS.set("sart:" + id, c); });
  const hedefeUy = r => !(p.amaclar || []).length || (r.x.amac || []).some(a => p.amaclar.includes(a));
  // Misafire hedefine uyanlardan en uyumlu 2 tanesi açık gösterilir (resmi özeti olanlar önce)
  const acikIki = new Set(all.filter(hedefeUy).sort((a, b) => b.c.score - a.c.score || !!b.x.resmi - !!a.x.resmi).slice(0, 2).map(r => r.x.id));
  const kilit = new Set(misafir ? all.map(r => r.x.id).filter(id => !acikIki.has(id)) : []);
  const dlg = $("#gerekenler");
  $("#g-kapat").onclick = () => dlg.close();
  dlg.onclick = e => { if (e.target === dlg) dlg.close(); };
  const kaydolAc = () => {
    const hedefli = all.filter(hedefeUy);
    $("#g-icerik").innerHTML = kaydolHTML(hedefli.length, hedefli.filter(r => !acikIki.has(r.x.id)));
    ["#k-kayit", "#k-giris"].forEach(sel => $(sel).addEventListener("click", () => D.LS.set("geri", "sonuclar")));
    $("#k-sonra").onclick = () => dlg.close();
    dlg.showModal();
  };
  if (misafir) {
    $("#kilit-bant").hidden = false;
    $("#kilit-bant").innerHTML = `<span>🔒 Hedefine uyan <b>${all.filter(hedefeUy).length}</b> destekten <b>2</b>’sini görüyorsun. Hesap açarsan şartları tek tek kontrol edip sana uymayanları eleriz.</span><button type="button" class="btn sm seal" id="bant-ac">Tamamını gör</button>`;
    $("#bant-ac").onclick = kaydolAc;
    let gosterildi = false; try { gosterildi = sessionStorage.getItem("kaydolGosterildi"); sessionStorage.setItem("kaydolGosterildi", "1"); } catch {}
    if (!gosterildi) setTimeout(kaydolAc, 900);
  }
  if (view === "harita") {
    const F = { hedef: true, tam: false, kredisiz: false, hibe: false, ...D.LS.get("mmFiltre", {}) };
    const hedefe = r => !(p.amaclar || []).length || (r.x.amac || []).some(a => p.amaclar.includes(a));
    const filtered = () => all.filter(r => (!F.hedef || hedefe(r)) && (!F.tam || r.c.level === "ok") && (!F.kredisiz || r.x.tur !== "kredi") && (!F.hibe || r.x.tur === "hibe") && (misafir || F.hayirGoster || sartDurum(r.x) !== "hayir"));
    const acik = [];
    const draw = () => {
      // Kayıtlı kullanıcı: tüm şartlarına "Evet" dediği destekler en üstte; "Hayır" dedikleri gizlenir
      if (!misafir) {
        const tam = all.filter(r => sartDurum(r.x) === "tam"), hayir = all.filter(r => sartDurum(r.x) === "hayir").length;
        $("#onayli").hidden = false;
        $("#onayli").innerHTML = `<h2>Şartlarını karşıladığın destekler <small>${tam.length}</small></h2>` + (tam.length
          ? `<div class="onayli-liste">${tam.map(({ x }) => `<button type="button" class="kart" data-id="${esc(x.id)}" style="border-left-color:var(--ok)"><span class="k-ad">${esc(x.ad)}</span><span class="k-tutar">${esc(amount(x, num($("#mm-butce").value)))}</span><span class="k-alt">${esc(x.kurum)}</span></button>`).join("")}</div>`
          : `<p class="small muted">Henüz yok. Aşağıdan bir desteğe tıkla ve resmi şartlarını cevapla; tüm şartlara “Evet” dediğin destekler burada toplanır.</p>`)
          + (hayir ? `<p class="small muted">Şartlarına “Hayır” dediğin ${hayir} destek sütunlardan kaldırıldı. <a href="#" id="hayir-goster">${F.hayirGoster ? "Gizle" : "Göster"}</a></p>` : "");
        const hg = $("#hayir-goster"); if (hg) hg.onclick = e => { e.preventDefault(); F.hayirGoster = !F.hayirGoster; draw(); };
        $$("#onayli .kart").forEach(b => b.onclick = () => gerekenlerAc(d.destekler.find(z => z.id === b.dataset.id)));
      }
      $("#mm").innerHTML = kolonlar(p.firmaUnvani || "İşletmen", goal, groupBy(filtered()), num($("#mm-butce").value), acik, kilit);
      $$("#mm .kart[data-kilit]").forEach(b => b.onclick = kaydolAc);
      $$("#mm .k-daha").forEach(b => b.onclick = () => { const k = b.dataset.k; const i = acik.indexOf(k); i < 0 ? acik.push(k) : acik.splice(i, 1); draw(); });
      $$("#mm .kart[data-id]").forEach(b => b.onclick = () => gerekenlerAc(d.destekler.find(z => z.id === b.dataset.id)));
    };
    const gerekenlerAc = x => { $("#g-icerik").innerHTML = gerekenlerHTML(x); gerekenlerBagla(x, $("#g-icerik")); dlg.showModal(); $("#g-icerik").scrollTop = 0; dlg.onclose = () => { dlg.onclose = null; if (!misafir) draw(); }; };
    $("#mm-butce").value = p.projeButce || ""; let bt; $("#mm-butce").oninput = () => { clearTimeout(bt); bt = setTimeout(() => { Store.saveProfile({ projeButce: $("#mm-butce").value }); draw(); }, 350); };
    const fb = $("#mm-filtre"); fb.hidden = false; $("#mm-butce-box").hidden = false;
    const sync = () => $$("button", fb).forEach(b => b.setAttribute("aria-pressed", !!F[b.dataset.f]));
    $$("button", fb).forEach(b => b.onclick = () => { const k = b.dataset.f; F[k] = !F[k]; if (k === "hibe" && F.hibe) F.kredisiz = false; if (k === "kredisiz" && F.kredisiz) F.hibe = false; D.LS.set("mmFiltre", F); sync(); draw(); });
    sync();
    $("#mm").hidden = false; $("#mm-legend").hidden = false; draw();
  } else {
    $("#liste").hidden = false;
    const satir = r => kilit.has(r.x.id) ? `<li class="item kilitli-satir"><button type="button" data-kilit="1"><span aria-hidden="true">${esc(r.x.ad)}</span><span class="k-kilit">🔒 Hesap açınca görünür</span></button></li>` : itemRow(r.x, r.c);
    $("#liste").innerHTML = (fit.length ? `<h2 style="margin:18px 0 4px">Uygun olabilir</h2><ul class="list">${fit.map(satir).join("")}</ul>` : "") +
      (mid.length ? `<h2 style="margin:28px 0 4px">Kısmen uygun</h2><p class="muted small">Bir koşulu karşılamıyorsun ama yakınsın. Ayrıntıya bakarak ne gerektiğini görebilirsin.</p><ul class="list">${mid.map(satir).join("")}</ul>` : "");
  }
  $$("#liste [data-kilit]").forEach(b => b.onclick = kaydolAc);
  // Yapay zekâ yorumu
  if (await D.aiAvailable()) {
    $("#ai").hidden = false;
    $("#ai-btn").onclick = async () => {
      const b = $("#ai-btn"); b.disabled = true; b.textContent = "Yorumlanıyor…";
      try {
        const r = await D.ai("yorum", { profil: { olcek: p.olcekAdi, sektorler: p.sektorler, amaclar: p.amaclar, il: p.il, isTanimi: p.isTanimi }, destekler: all.slice(0, 20).map(({ x, c }) => ({ id: x.id, ad: x.ad, kurum: x.kurum, ozet: x.ozet, uygunluk: c.level })) });
        if (!r) throw 0;
        $("#ai-out").innerHTML = `<p>${esc(r.giris)}</p><ol class="how">${(r.oneriler || []).map(o => { const x = d.destekler.find(z => z.id === o.id); return x ? `<li><a ${link("destek", "id=" + x.id)}><strong>${esc(x.ad)}</strong></a>: ${esc(o.neden)}</li>` : ""; }).join("")}</ol>`;
        b.hidden = true;
      } catch { toast("Yapay zekâ şu an yanıt vermedi. Biraz sonra tekrar dene."); b.disabled = false; b.textContent = "Yapay zekâ yorumlasın"; }
    };
  }
  $("#rapor-btn").onclick = () => { if (!secim) D.LS.set("secim", fit.slice(0, 8).map(r => r.x.id)); go("rapor"); };
};

/* ---------- Destek ayrıntısı ---------- */
P.destek = async () => {
  const x = await D.byId(params().get("id")); const p = await Store.profile();
  if (!x) { $("#detay").innerHTML = `<div class="empty"><h2>Bu destek bulunamadı.</h2><p>Kaldırılmış veya süresi dolmuş olabilir.</p><a class="btn" ${link("destekler")}>Tüm desteklere dön</a></div>`; return; }
  document.title = x.ad + " – " + C.SITE_ADI;
  const c = D.check(x, p); const secim = D.LS.get("secim", []);
  const yontem = { pdf: "Kurumun resmi formu bilgilerinle doldurulur", online: "Bilgilerinle doldurulmuş başvuru hazırlık formu ve online başvuru rehberi", bilgi: "Bilgilerinle doldurulmuş başvuru hazırlık formu" }[x.basvuru.yontem];
  $("#detay").innerHTML = `
    <p class="crumb"><a ${link("destekler")}>Tüm destekler</a> / ${esc(x.kurum)}</p>
    <div class="two"><div>
      <h1 style="font-size:clamp(26px,4vw,38px)">${esc(x.ad)}</h1>
      <p class="muted">${esc(x.kurum)} ${LEVEL_TAG[c.level]}</p>
      <dl class="facts">
        <div><dt>Destek türü</dt><dd>${TUR[x.tur] || x.tur}</dd></div>
        <div><dt>Üst limit</dt><dd>${x.ust_limit ? tl(x.ust_limit) : x.resmi ? "Resmi metne bak" : "Projeye göre"}</dd></div>
        <div><dt>Destek oranı</dt><dd>${x.oran_metin || (x.destek_orani ? "%" + x.destek_orani : "Belirtilmemiş")}${x.geri_odemeli ? " (geri ödemeli)" : ""}</dd></div>
        <div><dt>Son başvuru</dt><dd>${tarihli(x) ? new Date(x.son_basvuru).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : x.sayfa ? "Kurumun sayfasına bak" : "Sürekli / çağrıya bağlı"}</dd></div>
      </dl>
      <p style="font-size:17px">${esc(x.ozet)}</p>
      ${x.sayfa ? `<section class="sec resmi"><h2>Kurumun sayfasından</h2>
        <p class="small muted">Bu program Bakanlığın Destekler Platformu’nda yok; bilgiler <a href="${esc(x.sayfa.url)}" target="_blank" rel="noopener">${esc(x.sayfa.kaynak)} sayfasından</a> otomatik alındı ve <strong>değiştirilmeden</strong> gösteriliyor. Başvuru tarihleri ve şartlar için kurumun sayfasını mutlaka kontrol et. Son kontrol: ${new Date(x.sayfa.kontrol).toLocaleDateString("tr-TR")}.</p>
        ${x.sayfa.metin ? `<div class="resmi-metin">${esc(x.sayfa.metin)}</div>` : ""}</section>` : ""}
      ${x.resmi ? `<section class="sec resmi"><h2>Resmi özet bilgi formu</h2>
        <p class="small muted">Aşağıdaki metin <a href="${esc(x.resmi.sayfa)}" target="_blank" rel="noopener">${esc(x.resmi.kaynak)}</a> sayfasındaki özet bilgi formundan <strong>değiştirilmeden</strong> alınmıştır.${x.resmi.guncelleme ? ` Kaynağın güncellenme tarihi: ${new Date(x.resmi.guncelleme).toLocaleDateString("tr-TR")}.` : ""} Son kontrol: ${new Date(x.resmi.kontrol).toLocaleDateString("tr-TR")}.</p>
        ${x.resmi.bolumler.length ? x.resmi.bolumler.map(b => `<h3>${esc(b.baslik)}</h3><div class="resmi-metin">${esc(b.metin)}</div>`).join("") : `<p>Bu program için platformda özet bilgi formu yok. Ayrıntılar için aşağıdaki resmi belgelere bak.</p>`}
        ${x.resmi.belgeler.length ? `<h3>Resmi belgeler</h3><ul class="docs">${x.resmi.belgeler.map(d => `<li><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.ad)}</a></li>`).join("")}</ul>` : ""}</section>` : ""}
      <section class="sec"><h2>${p ? "Sana uygunluk" : "Başvuru koşulları"}</h2>
        <ul class="fit">${c.r.map(r => `<li class="${r.ok ? "y" : "n"}">${esc(r.t)}</li>`).join("")}${x.resmi || x.sayfa ? "" : (x.kosullar || []).map(k => `<li class="q">${esc(k)}</li>`).join("")}</ul>
        ${x.resmi || x.sayfa ? `<p class="small muted">Ölçek ve tür bilgisi metinden otomatik okundu. Kesin şartlar için yukarıdaki metni ve kurumun sayfasını esas al.</p>` : ""}
        ${!p ? `<p class="small muted">Uygunluğunu görmek için <a ${link("bul")}>uygunluk testini</a> yap.</p>` : ""}</section>
      ${(x.belgeler || []).length ? `<section class="sec"><h2>Hazırlaman gereken belgeler</h2><ul>${x.belgeler.map(b => `<li>${esc(b)}</li>`).join("")}</ul></section>` : ""}
      <section class="sec"><h2>Nasıl başvurulur?</h2><ol class="how">${(x.basvuru.adimlar || []).map(a => `<li>${esc(a)}</li>`).join("")}</ol></section>
      ${x.destek_orani && x.tur !== "vergi" ? `<section class="sec calc" id="oz"><h2>Öz kaynak hesaplayıcı</h2>
        <p class="small muted">Hibeler çoğunlukla harcamayı sen yaptıktan sonra geri ödenir. Projeyi başlatmak için ne kadar paran olması gerektiğini ve sonunda cebinden ne kadar çıkacağını gör.</p>
        <label for="oz-b" class="small muted">Proje bütçesi (KDV hariç): <strong id="oz-bv"></strong></label>
        <input type="range" id="oz-b" min="50000" max="${Math.max(1e6, Math.ceil((x.ust_limit ? x.ust_limit / x.destek_orani * 100 * 1.5 : 1e7) / 50000) * 50000)}" step="50000">
        <div class="row" style="margin-top:8px"><label class="field" for="oz-ay"><span>Hibenin hesabına geçme süresi</span><select class="input" id="oz-ay">${[1, 2, 3, 4, 6, 9, 12].map(m => `<option value="${m}"${m === 3 ? " selected" : ""}>${m} ay</option>`).join("")}</select></label>
          <label class="check" style="align-self:end"><input type="checkbox" id="oz-kdv" checked> KDV’yi ekle (%20, genelde desteklenmez)</label></div>
        <div class="oz-grid"><div><span>Başta gereken nakit</span><b id="oz-bas"></b></div><div><span>Kurumdan geri gelecek</span><b id="oz-hibe" style="color:var(--ok)"></b></div><div><span>Net öz kaynağın</span><b id="oz-net" style="color:var(--seal-ink)"></b></div></div>
        <div class="chart" id="oz-chart"></div><p class="small muted" id="oz-not"></p></section>` : ""}
      ${x.kredi ? `<section class="sec calc"><h2>Geri ödeme hesaplayıcı</h2>
        <label for="amt" class="small muted">Kullanmak istediğin tutar: <strong id="amtv"></strong></label>
        <input type="range" id="amt" min="${Math.min(100000, x.ust_limit || 5e6)}" max="${x.ust_limit || 5e6}" step="50000" value="${Math.round((x.ust_limit || 5e6) / 2 / 50000) * 50000}">
        <p style="margin:10px 0 0">Aylık taksit</p><div class="big" id="taksit"></div><p class="small muted" id="calcnote"></p><div class="chart" id="chart"></div></section>` : ""}
    </div>
    <aside class="panel sticky">
      <h3>Başvurunu hazırlayalım</h3><p class="small muted">${yontem}. Bilgilerin profilinden otomatik gelir.</p>
      <div class="actions" style="flex-direction:column;margin:16px 0 8px">
        <a class="btn seal" ${link("basvuru", "id=" + x.id)}>Başvuruya hazırla</a>
        <button class="btn ghost" type="button" id="sec">${secim.includes(x.id) ? "Rapordan çıkar" : "Özet rapora ekle"}</button>
        <a class="btn ghost" href="${esc(x.url)}" target="_blank" rel="noopener">Kurumun sayfası ↗</a>
      </div></aside></div>`;
  $("#sec").onclick = () => { let s = D.LS.get("secim", []); s = s.includes(x.id) ? s.filter(i => i !== x.id) : [...s, x.id]; D.LS.set("secim", s); $("#sec").textContent = s.includes(x.id) ? "Rapordan çıkar" : "Özet rapora ekle"; toast(s.includes(x.id) ? "Özet rapora eklendi." : "Rapordan çıkarıldı."); };
  if ($("#oz")) {
    const B = $("#oz-b"); B.value = Math.min(+B.max, Math.max(50000, num(p && p.projeButce) || Math.min(1e6, +B.max / 2)));
    const upd = () => {
      const butce = +B.value, kdv = $("#oz-kdv").checked ? butce * 0.2 : 0, ay = +$("#oz-ay").value;
      const hibe = Math.min(butce * x.destek_orani / 100, x.ust_limit || Infinity), bas = butce + kdv, net = bas - hibe;
      $("#oz-bv").textContent = tl(butce); $("#oz-bas").textContent = tl(Math.round(bas)); $("#oz-hibe").textContent = tl(Math.round(hibe)); $("#oz-net").textContent = tl(Math.round(net));
      $("#oz-chart").innerHTML = D.ozChart({ hibe, oz: butce - hibe, kdv, ay });
      $("#oz-not").textContent = (x.ust_limit && butce * x.destek_orani / 100 > x.ust_limit ? `Üst limit ${tl(x.ust_limit)} olduğu için hibe bu tutarda sabitlenir. ` : "") + `Hibe ödenene kadar (${ay} ay) ${tl(Math.round(bas))} nakit veya kredi gerekir. ` + (x.oran_metin ? `Oran ${x.oran_metin} arasında değişiyor; hesap en düşük oranla (%${x.destek_orani}) yapıldı. ` : "") + (x.geri_odemeli ? "Bu destek geri ödemeli: kurumdan gelen tutarı daha sonra geri ödersin. " : "") + `Oranlar ve limitler ilana göre değişebilir; kurumun sayfasından kontrol et.`;
    };
    B.oninput = upd; $("#oz-kdv").onchange = upd; $("#oz-ay").onchange = upd; upd();
  }
  if (x.kredi) { const upd = () => { const P2 = +$("#amt").value, pl = D.plan(P2, x.kredi); $("#amtv").textContent = tl(P2); $("#taksit").textContent = tl(Math.round(pl.taksit)); $("#calcnote").textContent = `İlk ${x.kredi.geri_odemesiz_ay} ay ödeme yok, sonra ${x.kredi.vade_ay - x.kredi.geri_odemesiz_ay} taksit. Toplam geri ödeme ${tl(Math.round(pl.toplam))}` + (x.kredi.faiz_yillik ? ` (örnek yıllık %${x.kredi.faiz_yillik} faizle).` : " (faizsiz)."); $("#chart").innerHTML = D.chartSVG(pl, P2); }; $("#amt").oninput = upd; upd(); }
};

/* ---------- Başvuru hazırlama: form doldur → online rehber → bilgi raporu ---------- */
P.basvuru = async () => {
  const x = await D.byId(params().get("id")); if (!x) { go("destekler"); return; }
  const u = await Store.user(); const p = await Store.profile() || {};
  const apps = await Store.list("apps"); const app = apps.find(a => a.id === x.id) || {};
  const values = { ...p, eposta: p.eposta || u?.email, ...(app.values || {}) };
  const firma = x.alanlar.filter(k => ALANLAR[k]?.k), ozel = x.alanlar.filter(k => !ALANLAR[k]?.k);
  const eksik = () => x.alanlar.filter(k => !values[k]);
  $("#bas").innerHTML = `
    <p class="crumb"><a ${link("destek", "id=" + x.id)}>${esc(x.ad)}</a> / Başvuru</p>
    <h1 style="font-size:clamp(26px,4vw,36px)">Başvurunu hazırlayalım.</h1>
    ${!u ? `<div class="notice"><a ${link("hesap", "sekme=kayit")}><strong>Ücretsiz hesap aç</strong></a>, bu bilgiler bir dahaki başvurunda otomatik dolsun ve sana uygun yeni destekler çıktığında haber verelim.</div>` : ""}
    <div id="mode"></div>
    <form id="vals" class="two" novalidate><div>
      <section class="sec"><h2>Firma bilgilerin</h2><p class="small muted">Profilinden geldi. Gerekirse burada düzelt.</p><div class="row">${firma.map(k => fieldHTML(k, values[k])).join("")}</div></section>
      ${ozel.length ? `<section class="sec"><h2>Bu başvuruya özel</h2>${ozel.map(k => fieldHTML(k, values[k])).join("")}<button class="btn ghost sm" type="button" id="ai-ozet" hidden>Proje özetini yapay zekâ taslak olarak yazsın</button></section>` : ""}
    </div><aside class="panel sticky" id="act"></aside></form>`;
  const form = $("#vals");
  const persist = async (durum) => { Object.assign(values, formValues(form)); await Store.saveApp({ id: x.id, durum: durum || app.durum || "Hazırlanıyor", values: Object.fromEntries(ozel.map(k => [k, values[k]])) }); await Store.saveProfile(Object.fromEntries(firma.map(k => [k, values[k]]))); };
  form.oninput = () => { Object.assign(values, formValues(form)); renderAct(); };
  const mode = x.basvuru.yontem;
  let pdfOk = mode === "pdf";
  const modeBox = () => {
    if (pdfOk) return `<div class="mode"><div><b>Form otomatik doldurulacak</b>Kurumun başvuru formunu senin bilgilerinle dolduruyoruz. İndirip imzalaman ve sisteme yüklemen yeterli.</div></div>`;
    if (mode !== "bilgi") return `<div class="mode"><div><b>Başvuru hazırlık formun hazır</b>Bu destek için kurum indirilebilir bir form yayımlamıyor; başvuru kurumun kendi sisteminden yapılıyor. Bilgilerinle doldurulmuş hazırlık formunu indir, kurumun sisteminde istenenleri aşağıdaki listeden kopyalayıp yapıştır.</div></div>`;
    return `<div class="mode"><div><b>Başvuru hazırlık formun hazır</b>Bu destek için doğrudan bir form yok. Başvuruda istenecek bilgileri, şartları, belgeleri ve adımları bilgilerinle doldurulmuş tek bir PDF’te hazırlıyoruz.</div></div>`;
  };
  const renderAct = () => {
    const e = eksik();
    $("#mode").innerHTML = modeBox();
    $("#act").innerHTML = `<h3>${pdfOk ? "Doldurulmuş resmi form" : "Doldurulmuş başvuru hazırlık formu"}</h3>
      ${e.length ? `<p class="small missing">${e.length} alan boş: ${e.slice(0, 4).map(k => ALANLAR[k]?.e).join(", ")}${e.length > 4 ? "…" : ""}</p>` : `<p class="small" style="color:var(--ok)">Tüm alanlar dolu.</p>`}
      <div class="actions" style="flex-direction:column;margin:12px 0">
        ${pdfOk ? `<button class="btn seal" type="button" id="dl-form">Formu doldur ve indir (PDF)</button>` : ""}
        <button class="btn ${pdfOk ? "ghost" : "seal"}" type="button" id="dl-info">${pdfOk ? "Hazırlık formunu da indir (PDF)" : "Hazırlık formunu indir (PDF)"}</button>
        ${!pdfOk && mode !== "bilgi" ? `<a class="btn ghost" href="${esc(x.basvuru.online)}" target="_blank" rel="noopener" id="open-site">Kurumun başvuru sitesini aç ↗</a>` : ""}
      </div>
      <label class="small muted" for="durum">Başvuru durumu</label>
      <select class="input" id="durum">${["Hazırlanıyor", "Form hazır", "Başvurdum", "Sonuçlandı"].map(s => `<option${s === (app.durum || "Hazırlanıyor") ? " selected" : ""}>${s}</option>`).join("")}</select>
      ${!pdfOk && mode !== "bilgi" ? `<h3 style="margin-top:22px">Hangi alana ne yazılacak</h3><ul class="copy-list">${x.alanlar.map(k => `<li><span>${esc(ALANLAR[k]?.e)}</span><span>${values[k] ? esc(values[k]) : '<em class="missing">boş</em>'}</span>${values[k] ? `<button class="btn ghost sm" type="button" data-copy="${esc(values[k])}">Kopyala</button>` : "<span></span>"}</li>`).join("")}</ul>` : ""}`;
    $("#durum").onchange = async e => { app.durum = e.target.value; await persist(e.target.value); toast("Durum kaydedildi."); };
    $$("[data-copy]").forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Kopyalandı"; setTimeout(() => b.textContent = "Kopyala", 1500); } catch { toast("Kopyalanamadı; metni seçip kopyala."); } });
    if ($("#open-site")) $("#open-site").onclick = () => persist("Hazırlanıyor");
    if ($("#dl-form")) $("#dl-form").onclick = async () => {
      const b = $("#dl-form"); b.disabled = true; b.textContent = "Form hazırlanıyor…";
      try { await persist(); const { bytes, filled } = await D.fillForm(x, values); if (await D.saveFile(`${x.id}-basvuru-formu.pdf`, bytes)) { await persist("Form hazır"); app.durum = "Form hazır"; $("#durum").value = "Form hazır"; toast(filled ? `${filled} alan dolduruldu. İmzalayıp kuruma yükle.` : "Form doldurulamadı; bilgiler forma ek sayfa olarak eklendi."); } }
      catch (err) { pdfOk = false; renderAct(); toast("Form şu an alınamadı. Online başvuru rehberine geçtik."); }
      finally { if ($("#dl-form")) { $("#dl-form").disabled = false; $("#dl-form").textContent = "Formu doldur ve indir (PDF)"; } }
    };
    $("#dl-info").onclick = async () => { const b = $("#dl-info"); b.disabled = true; try { await persist(); const bytes = await D.infoPdf(x, values, p); await D.saveFile(`${x.id}-basvuru-hazirlik-formu.pdf`, bytes); } catch { toast("Hazırlık formu oluşturulamadı. Tekrar dene."); } b.disabled = false; };
  };
  renderAct();
  if ($("#ai-ozet") && await D.aiAvailable()) {
    $("#ai-ozet").hidden = false;
    $("#ai-ozet").onclick = async () => {
      const b = $("#ai-ozet"); b.disabled = true; b.textContent = "Yazılıyor…";
      try { const t = await D.ai("proje_ozeti", { profil: { olcek: p.olcekAdi, sektorler: p.sektorler, il: p.il, isTanimi: p.isTanimi, calisan: values.calisan, projeAdi: $("#f-projeAdi")?.value }, destek: { ad: x.ad, kurum: x.kurum, ozet: x.ozet } }); if (t) { $("#f-projeOzeti").value = t; form.oninput(); toast("Taslak yazıldı. Köşeli parantezli yerleri doldur."); } }
      catch { toast("Yapay zekâ şu an yanıt vermedi."); }
      b.disabled = false; b.textContent = "Tekrar yazsın";
    };
  }
};

/* ---------- Başvuru özet raporu ---------- */
P.rapor = async () => {
  const p = await Store.profile(); const d = await D.data();
  if (!p || !p.olcek) { go("bul"); return; }
  let ids = D.LS.get("secim", []); if (!ids.length) ids = d.destekler.filter(x => D.check(x, p).level === "ok").slice(0, 8).map(x => x.id);
  const list = ids.map(id => d.destekler.find(x => x.id === id)).filter(Boolean).map(x => ({ x, c: D.check(x, p) }));
  const belgeler = [...new Set(list.flatMap(r => r.x.belgeler || []))];
  const sirali = [...list].sort((a, b) => (a.x.son_basvuru || "9999").localeCompare(b.x.son_basvuru || "9999") || b.c.score - a.c.score);
  const sz = D.classify(num(p.calisan), num(p.ciro), num(p.bilanco));
  const profKV = [["Firma", p.firmaUnvani], ["İş tanımı", p.isTanimi], ["Sektör", (p.sektorler || []).map(s => SEKTOR[s]).join(", ")], ["İl", p.il], ["Kuruluş yılı", p.kurulusYili], ["Çalışan sayısı", p.calisan], ["Yıllık net satış", p.ciro ? tl(num(p.ciro)) : ""], ["İhtiyaçlar", (p.amaclar || []).map(a => AMAC[a]).join(", ")]];
  let giris = "";
  const render = () => {
    $("#rapor").innerHTML = `<div class="report">
      <h1>Başvuru özet raporu</h1><p class="muted">${esc(p.firmaUnvani || "İşletme")} · ${D.today()}</p>
      ${giris ? `<p style="font-size:17px">${esc(giris)}</p>` : ""}
      <h2>1. İşletme profili</h2><dl class="facts">${profKV.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <h2>2. Ölçek değerlendirmesi</h2><p><strong>${esc(OLCEK[p.olcek])}.</strong> ${esc(sz?.neden || "")} (KOBİ Yönetmeliği, 7 Ağustos 2025 değişikliği)</p>
      <h2>3. Önerilen destekler (${list.length})</h2>
      <ul class="list">${list.map(r => itemRow(r.x, r.c)).join("")}</ul>
      <h2>4. Başvuru yol haritası</h2><div class="timeline">${sirali.map((r, i) => `<div><strong>${i + 1}. ${esc(r.x.ad)}</strong><br><span class="small muted">${r.x.son_basvuru ? "Son başvuru " + new Date(r.x.son_basvuru).toLocaleDateString("tr-TR") : "Çağrıya bağlı / sürekli"} · ${({ pdf: "form doldurulur", online: "online başvuru", bilgi: "bilgi raporu" })[r.x.basvuru.yontem]}</span></div>`).join("")}</div>
      <h2>5. Hazırlanması gereken belgeler</h2><ul>${belgeler.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
      <p class="small muted" style="margin-top:20px">Bu rapor bilgilendirme amaçlıdır; tutar, oran ve tarihleri kurumların resmi sayfalarından doğrula.</p></div>`;
  };
  render();
  if (await D.aiAvailable()) { $("#ai-giris").hidden = false; $("#ai-giris").onclick = async () => { const b = $("#ai-giris"); b.disabled = true; b.textContent = "Yazılıyor…"; try { giris = await D.ai("rapor_giris", { profil: { olcek: p.olcekAdi, sektorler: p.sektorler, il: p.il, isTanimi: p.isTanimi }, destekler: list.map(r => r.x.ad) }) || ""; render(); b.hidden = true; } catch { toast("Yapay zekâ şu an yanıt vermedi."); b.disabled = false; b.textContent = "Yapay zekâ giriş paragrafı yazsın"; } }; }
  $("#pdf").onclick = async () => {
    const b = $("#pdf"); b.disabled = true; b.textContent = "Hazırlanıyor…";
    try {
      const { PDFDocument } = await D.pdfLibs(); const doc = await PDFDocument.create(); const f = await D.fonts(doc); doc.setTitle("Başvuru özet raporu");
      await D.writePdf(doc, f, [
        { h1: "Başvuru özet raporu" }, { small: `${p.firmaUnvani || "İşletme"} · ${D.today()}` }, ...(giris ? [{ p: giris }] : []),
        { h2: "1. İşletme profili" }, { kv: profKV.filter(([, v]) => v) },
        { h2: "2. Ölçek değerlendirmesi" }, { p: `${OLCEK[p.olcek]}. ${sz?.neden || ""} (KOBİ Yönetmeliği, 7 Ağustos 2025 değişikliği)` },
        { h2: `3. Önerilen destekler (${list.length})` }, ...list.flatMap(r => [{ p: `${r.x.ad} – ${r.x.kurum}` }, { small: `${TUR[r.x.tur]}${r.x.ust_limit ? ", üst limit " + tl(r.x.ust_limit) : ""}${r.x.destek_orani ? ", destek oranı %" + r.x.destek_orani : ""}. ${r.x.ozet}` }]),
        { h2: "4. Başvuru yol haritası" }, { ol: sirali.map(r => `${r.x.ad} (${r.x.son_basvuru ? "son başvuru " + new Date(r.x.son_basvuru).toLocaleDateString("tr-TR") : "çağrıya bağlı / sürekli"})`) },
        { h2: "5. Hazırlanması gereken belgeler" }, { ul: belgeler },
        { small: "Bu rapor bilgilendirme amaçlıdır; tutar, oran ve tarihleri kurumların resmi sayfalarından doğrula." }
      ], "Başvuru özet raporu");
      await D.saveFile("basvuru-ozet-raporu.pdf", await doc.save());
    } catch { toast("Rapor oluşturulamadı. Tekrar dene."); }
    b.disabled = false; b.textContent = "PDF olarak indir";
  };
};

/* ---------- Hesap: giriş, kayıt, profil, başvurular, bildirimler ---------- */
P.hesap = async () => {
  const u = await Store.user(); const box = $("#hesap"); const sekme = params().get("sekme");
  const sonra = varsayilan => { const g = D.LS.get("geri"); D.LS.del("geri"); go(g || varsayilan); };
  if (u && D.LS.get("geri")) { sonra("hesap"); return; }  // e-posta onay bağlantısından dönüş
  if (!u) {
    const kayit = sekme === "kayit"; const draft = { ...(await Store.profile() || {}), ...D.LS.get("draft", {}) };
    const kayitAlan = ["firmaUnvani", "vkn", "vergiDairesi", "sirketTuru", "kurulusYili", "naceKodu", "calisan", "ciro", "yetkili", "telefon", "il", "adres"];
    box.innerHTML = `<div class="tabs"><a ${link("hesap", "sekme=giris")} aria-current="${!kayit}">Giriş yap</a><a ${link("hesap", "sekme=kayit")} aria-current="${kayit}">Ücretsiz hesap aç</a></div>
      ${Store.demo ? `<p class="small muted">Demo modu: hesap bu tarayıcıda saklanır. Supabase bağlandığında gerçek hesaplara geçer.</p>` : ""}
      <form id="auth" class="narrow" novalidate>
        ${kayit ? `<label class="field" for="ad"><span>Adın soyadın</span><input class="input" id="ad" name="ad" required value="${esc(draft.yetkili)}"></label>` : ""}
        <label class="field" for="email"><span>E-posta</span><input class="input" id="email" name="email" type="email" autocomplete="email" required></label>
        <label class="field" for="pw"><span>Şifre</span><input class="input" id="pw" name="password" type="password" autocomplete="${kayit ? "new-password" : "current-password"}" minlength="6" required>${kayit ? "<small>En az 6 karakter.</small>" : ""}</label>
        ${kayit ? `<h2 style="margin-top:28px">Firma bilgilerin</h2><p class="muted small">Başvuru formların bu bilgilerle otomatik dolar. Sonra da değiştirebilirsin.</p><div class="row">${kayitAlan.map(k => fieldHTML(k, draft[k], { pre: "k-" })).join("")}</div>
          <label class="check"><input type="checkbox" id="bAnlik" checked> Bana uygun yeni destek çıkınca anlık bildirim gönder</label>
          <label class="check"><input type="checkbox" id="bEposta" checked> E-posta ile de haber ver</label>` : ""}
        <p id="err" class="missing" role="alert"></p>
        <button class="btn seal" type="submit">${kayit ? "Hesabımı oluştur" : "Giriş yap"}</button>
      </form>`;
    $("#auth").onsubmit = async e => {
      e.preventDefault(); const v = formValues(e.target); $("#err").textContent = "";
      if (!/^\S+@\S+\.\S+$/.test(v.email)) { $("#err").textContent = "Geçerli bir e-posta yaz."; return; }
      if ((v.password || "").length < 6) { $("#err").textContent = "Şifre en az 6 karakter olmalı."; return; }
      try {
        if (kayit) {
          const prof = { ...draft, ...Object.fromEntries(kayitAlan.map(k => [k, v[k] || ""])), eposta: v.email, yetkili: v.yetkili || v.ad, bildirimAnlik: $("#bAnlik").checked, bildirimEposta: $("#bEposta").checked };
          const r = await Store.signUp({ email: v.email, password: v.password, ad: v.ad, profil: prof });
          if (r && r.onayGerekli) { box.innerHTML = `<div class="narrow" style="margin-top:26px"><h1>E-postanı kontrol et</h1><p>Hesabın oluşturuldu. <b>${esc(v.email)}</b> adresine bir onay bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.</p><a class="btn seal" ${link("hesap", "sekme=giris")}>Giriş sayfasına git</a></div>`; return; }
          if (prof.bildirimAnlik) await D.enablePush();
          toast("Hesabın oluşturuldu."); sonra(prof.olcek || prof.sektorler ? "sonuclar" : "bul");
        } else { await Store.signIn(v); toast("Hoş geldin."); sonra("hesap"); }
      } catch (err) { $("#err").textContent = err.message || "Bir şey ters gitti. Tekrar dene."; }
    };
    return;
  }
  const s = ["profil", "basvurular", "bildirimler"].includes(sekme) ? sekme : "profil";
  const p = await Store.profile() || {}; const d = await D.data();
  const notifs = await Store.list("notifs"); const unread = notifs.filter(n => !n.read).length;
  box.innerHTML = `<h1 style="margin-top:26px">Merhaba ${esc(u.ad || "")}</h1>
    <div class="tabs"><a ${link("hesap", "sekme=profil")} aria-current="${s === "profil"}">Firma profili</a><a ${link("hesap", "sekme=basvurular")} aria-current="${s === "basvurular"}">Başvurularım</a><a ${link("hesap", "sekme=bildirimler")} aria-current="${s === "bildirimler"}">Bildirimler${unread ? ` (${unread})` : ""}</a></div><div id="tab"></div>`;
  const tab = $("#tab");
  if (s === "profil") {
    const alan = ["firmaUnvani", "vkn", "vergiDairesi", "sirketTuru", "kurulusYili", "naceKodu", "calisan", "ciro", "yetkili", "telefon", "eposta", "il", "adres"];
    tab.innerHTML = `<form id="pf" class="narrow"><p class="muted">Ölçeğin: <strong>${esc(OLCEK[p.olcek] || "henüz belirlenmedi")}</strong>. Sektör ve ihtiyaçlarını değiştirmek için <a ${link("bul")}>uygunluk testini</a> tekrar yap.</p><div class="row">${alan.map(k => fieldHTML(k, p[k])).join("")}</div>
      <div class="actions"><button class="btn seal" type="submit">Kaydet</button><button class="btn ghost" type="button" id="cikis">Çıkış yap</button></div></form>`;
    $("#pf").onsubmit = async e => { e.preventDefault(); await Store.saveProfile(formValues(e.target)); toast("Profilin kaydedildi."); };
    $("#cikis").onclick = async () => { await Store.signOut(); go("index"); };
  }
  if (s === "basvurular") {
    const apps = await Store.list("apps");
    tab.innerHTML = apps.length ? `<div class="scroll-x"><table class="apps"><thead><tr><th>Destek</th><th>Durum</th><th>Son işlem</th><th></th></tr></thead><tbody>${apps.map(a => { const x = d.destekler.find(z => z.id === a.id); return x ? `<tr><td>${esc(x.ad)}<br><span class="small muted">${esc(x.kurum)}</span></td><td>${esc(a.durum)}</td><td>${new Date(a.tarih).toLocaleDateString("tr-TR")}</td><td><a class="btn ghost sm" ${link("basvuru", "id=" + x.id)}>Devam et</a></td></tr>` : ""; }).join("")}</tbody></table></div>`
      : `<div class="empty"><p>Henüz bir başvuru hazırlamadın.</p><a class="btn seal" ${link("sonuclar")}>Uygun desteklerime bak</a></div>`;
  }
  if (s === "bildirimler") {
    const izin = "Notification" in window ? Notification.permission : "unsupported";
    tab.innerHTML = `<div class="panel" style="margin-bottom:18px"><h3>Bildirim ayarları</h3>
      <label class="check"><input type="checkbox" id="bAnlik" ${p.bildirimAnlik ? "checked" : ""}> Anlık bildirim (tarayıcı)${izin === "denied" ? ' <span class="missing small">Tarayıcıda engelli</span>' : ""}</label>
      <label class="check"><input type="checkbox" id="bEposta" ${p.bildirimEposta ? "checked" : ""}> E-posta (${esc(p.eposta || u.email)})</label>
      <p class="small muted">Her sabah yeni destekler taranır; profiline uyan bir destek çıkınca haber veririz.</p></div>
      ${notifs.length ? notifs.map(n => { const x = d.destekler.find(z => z.id === n.id); return x ? `<div class="notif ${n.read ? "read" : "unread"}"><span class="dot"></span><div><b>Sana uygun yeni destek: ${esc(x.ad)}</b><div class="small muted">${esc(x.kurum)} · ${new Date(n.tarih).toLocaleDateString("tr-TR")}</div><a class="small" ${link("destek", "id=" + x.id)}>Ayrıntıya bak</a></div></div>` : ""; }).join("") : `<p class="muted">Henüz bildirim yok. Profiline uyan yeni bir destek yayımlandığında burada göreceksin.</p>`}`;
    $("#bAnlik").onchange = async e => { if (e.target.checked && !(await D.enablePush())) e.target.checked = false; await Store.saveProfile({ bildirimAnlik: e.target.checked }); };
    $("#bEposta").onchange = async e => { await Store.saveProfile({ bildirimEposta: e.target.checked }); toast(e.target.checked ? "E-posta bildirimleri açık." : "E-posta bildirimleri kapalı."); };
    if (unread) await Store.markRead();
  }
};

/* ---------- Başlatma ---------- */
async function run(page) {
  window.scrollTo(0, 0);
  ROOT = document.querySelector(`main[data-page="${page}"]`) || document;
  await layout(page);
  try { await (P[page] || P.index)(); } catch (e) { console.error(e); }
}
if (D.BUNDLE) {
  window.__route = () => { const page = (location.hash.slice(1) || "index"); document.querySelectorAll("main[data-page]").forEach(m => m.hidden = m.dataset.page !== page); run(page); };
  document.addEventListener("click", e => { const a = e.target.closest("a[data-q]"); if (a) window.__Q = a.dataset.q; else if (e.target.closest('a[href^="#"]')) window.__Q = ""; if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); window.__route(); } });
  addEventListener("hashchange", window.__route); window.__route();
} else run(document.body.dataset.page);
})();
