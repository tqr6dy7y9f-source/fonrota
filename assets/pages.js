/* Destek Bulucu – sayfalar */
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
      <a ${link("destekler")}${cur("destekler")}>Tüm destekler</a>
      <a ${link("bul")}${cur("bul")} class="hide-s">Uygunluk testi</a>
      <a ${link("hesap")}${cur("hesap")} id="nav-hesap">${u ? "Hesabım" : "Giriş yap"}</a>
      <button type="button" class="lang" id="lang" translate="no" aria-label="${D.lang() === "en" ? "Türkçeye geç" : "Switch to English"}">${D.lang() === "en" ? "TR" : "EN"}</button>
    </nav></div>`;
  $("#lang").onclick = () => D.setLang(D.lang() === "en" ? "tr" : "en");
  const n = await D.checkNew();
  if (n) $("#nav-hesap").insertAdjacentHTML("beforeend", `<span class="badge" aria-label="${n} yeni bildirim">${n}</span>`);
  const ft = $("#footer");
  if (ft) { const d = await D.data(); ft.innerHTML = `<div class="wrap"><span>Bilgiler kurumların resmi sitelerinden her gün otomatik toplanır. Başvurmadan önce koşulları kurumun sayfasından kontrol et.</span><span>Son güncelleme: ${new Date(d.guncelleme).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span></div>`; }
}
function sampleNotice(d) { return d.ornek ? `<div class="notice">Şu an örnek veri gösteriliyor. Günlük güncelleme çalıştığında kurumların sitelerindeki güncel ilanlar burada yer alır.</div>` : ""; }
function money(x) { return x.ust_limit ? `<span class="money">${short(x.ust_limit)}’ye kadar</span>` : x.destek_orani ? `<span class="money">%${x.destek_orani} destek</span>` : ""; }
function due(x) { const d = D.daysLeft(x.son_basvuru); return x.son_basvuru ? `<span class="due ${d <= 21 ? "soon" : ""}">Son başvuru: ${d <= 0 ? "bugün" : d + " gün kaldı"}</span>` : `<span class="due">Sürekli açık veya çağrıya bağlı</span>`; }
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
    { cap: "Hibe, kredi ve teşvikler tek haritada. Uygun olanlar yeşil.", html: `<div class="t1">Sana uyanlar haritada.</div><svg viewBox="0 0 600 220" style="width:62cqw;margin-top:2cqw">${["Makine ve yatırım", "İhracat", "Kredi", "Bölgesel hibe"].map((b, i) => { const y = 30 + i * 52; return `<path class="ln" d="M120 110 C 200 110, 200 ${y}, 270 ${y}" stroke="#E0AE57" stroke-width="3" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><g class="nd" opacity="0"><rect x="270" y="${y - 17}" width="200" height="34" rx="8" fill="#F3F6F4"/><text x="284" y="${y + 6}" font-size="16" font-family="Figtree" fill="#12343B" font-weight="600">${b}</text><circle cx="452" cy="${y}" r="7" fill="#2F7D5B"/></g>`; }).join("")}<rect x="10" y="88" width="110" height="44" rx="10" fill="#E0AE57"/><text x="65" y="116" font-size="17" text-anchor="middle" font-family="Figtree" font-weight="700" fill="#1b1305">İşletmen</text></svg>`,
      tick(e, t) { $$(".ln", e).forEach((l, i) => l.setAttribute("stroke-dashoffset", Math.max(0, 1 - Math.max(0, t - 1 - i * .9) / .8))); $$(".nd", e).forEach((n, i) => n.setAttribute("opacity", t > 1.8 + i * .9 ? 1 : 0)); } },
    { cap: "Bilgilerin başvuru formuna otomatik yazılır; PDF’i indirip kullanırsın.", html: `<div class="t1">Formun hazır.</div><div class="v-form">${["Firma ünvanı", "Vergi no", "Çalışan sayısı", "İşletme ölçeği", "Proje adı"].map(k => `<div><span>${k}</span><b>✓ dolduruldu</b></div>`).join("")}</div>`,
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
    $("#count").textContent = `${rows.length} destek listeleniyor` + (p ? `, ${rows.filter(r => r.c.level === "ok").length} tanesi sana uygun.` : ".");
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
      <p class="muted">Bölgesel destekler ve kuruluş yılına bağlı programlar için gerekli.</p>
      <div class="row">${fieldHTML("il", draft.il)}${fieldHTML("kurulusYili", draft.kurulusYili)}</div>
      ${fieldHTML("sirketTuru", draft.sirketTuru)}
      <label class="check"><input type="checkbox" id="ihracat" ${draft.ihracat ? "checked" : ""}> İhracat yapıyoruz veya bu yıl başlayacağız</label>
      <label class="check"><input type="checkbox" id="borcYok" ${draft.borcYok !== false ? "checked" : ""}> Vergi ve SGK borcumuz yok (veya yapılandırılmış)</label>
      <div class="nav-btns"><a class="btn ghost" ${link("bul", "adim=2")}>Geri</a><button class="btn seal" type="button" id="bitir">Uygun destekleri göster</button></div>`;
    $("#bitir").onclick = async () => {
      if (!$("#f-il").value) { toast("İlini seç."); $("#f-il").focus(); return; }
      save({ il: $("#f-il").value, kurulusYili: $("#f-kurulusYili").value, sirketTuru: $("#f-sirketTuru").value, ihracat: $("#ihracat").checked, borcYok: $("#borcYok").checked });
      await Store.saveProfile(D.LS.get("draft")); go("sonuclar");
    };
  }
};

/* ---------- Sonuçlar: hiyerarşik zihin haritası (merkez → kurumlar → net fırsatlar) ---------- */
function amount(x, butce) {
  const ad = x.tur === "kredi" ? "kredi" : x.tur === "vergi" ? "avantaj" : "hibe";
  if (butce > 0 && x.destek_orani && x.tur !== "vergi") { const n = Math.min(butce * x.destek_orani / 100, x.ust_limit || Infinity); return `${short(Math.round(n))} ${ad} (%${x.destek_orani})`; }
  if (x.ust_limit) return short(x.ust_limit) + "’ye kadar" + (x.destek_orani ? ` · %${x.destek_orani}` : "");
  if (x.destek_orani) return `%${x.destek_orani} ${x.tur === "kredi" ? "kredi" : x.tur === "vergi" ? "avantaj" : "hibe"}`;
  if (x.kredi) return x.kredi.faiz_yillik === 0 ? `Faizsiz kredi · ${x.kredi.vade_ay} ay vade` : `Kredi · ${x.kredi.vade_ay} ay vade`;
  return TUR[x.tur] || "Tutar ilanda";
}
function mindmap(root, goal, groups, wide, butce) {
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  if (!total) return `<div class="empty"><h2>Bu filtreyle destek kalmadı.</h2><p>Filtrelerden birini kapatınca harita yeniden dolar.</p></div>`;
  const col = { ok: "var(--ok)", mid: "var(--mid)", none: "var(--muted)", no: "var(--no)" };
  if (!wide) {
    return `<div class="tree mm-anim"><div class="tree-root"><b>${esc(root)}</b><span>${esc(goal)}</span></div>${groups.map((g, gi) => `<details open style="--d:${gi}"><summary>${esc(g.k)} <small>(${g.items.length})</small></summary>${g.items.map(({ x, c }) => `<a ${link("destek", "id=" + x.id)} style="border-left:4px solid ${col[c.level]}"><span>${esc(x.ad)}<small>${esc(amount(x, butce))}</small></span>${LEVEL_TAG[c.level]}</a>`).join("")}</details>`).join("")}</div>`;
  }
  const LEAF_W = 250, ROW = 50, GAP = 22;
  const sides = [[], []]; const h = [0, 0];
  groups.forEach(g => { const s = h[0] <= h[1] ? 0 : 1; sides[s].push(g); h[s] += g.items.length * ROW + GAP; });
  const H = Math.max(300, Math.max(...h) + 40), W = 1070, cx = W / 2, cy = H / 2;
  const trunc = (s, n) => s.length > n ? s.slice(0, n - 2) + "…" : s;
  let lines = "", kurum = "", leaves = "", gi = 0;
  sides.forEach((list, si) => {
    const dir = si === 0 ? 1 : -1; let y = (H - h[si]) / 2 + 20;
    list.forEach(g => {
      const top = y, bh = g.items.length * ROW; const gy = top + bh / 2 - ROW / 2 + 20;
      const gx = cx + dir * 172, lx = cx + dir * 272; const d1 = 0.3 + gi * 0.1;
      lines += `<path class="mm-l1" style="--d:${d1}s" pathLength="1" d="M${cx + dir * 95} ${cy} C ${cx + dir * 150} ${cy}, ${gx - dir * 60} ${gy}, ${gx - dir * 82} ${gy}" stroke="var(--seal)" stroke-width="2.5" fill="none"/>`;
      g.items.forEach(({ x, c }, i) => {
        const ly = top + i * ROW + 20; const bx = dir > 0 ? lx : lx - LEAF_W; const d2 = d1 + 0.4 + i * 0.07;
        lines += `<path class="mm-l2" style="--d:${d2}s" pathLength="1" d="M${gx + dir * 82} ${gy} C ${gx + dir * 105} ${gy}, ${lx - dir * 28} ${ly}, ${lx} ${ly}" stroke="var(--line)" stroke-width="1.5" fill="none"/>`;
        leaves += `<a class="mm-node mm-n2" style="--d:${(d2 + .2).toFixed(2)}s" ${link("destek", "id=" + x.id)}><title>${esc(x.ad)} – ${esc(x.kurum)}: ${esc(amount(x, butce))}</title><rect x="${bx}" y="${ly - 20}" width="${LEAF_W}" height="40" rx="8" fill="var(--surface)" stroke="var(--line)"/><rect x="${dir > 0 ? bx : bx + LEAF_W - 5}" y="${ly - 20}" width="5" height="40" rx="2" fill="${col[c.level]}"/><text x="${bx + 14}" y="${ly - 3}" font-size="13" fill="var(--ink)" font-family="Figtree, sans-serif">${esc(trunc(x.ad, 32))}</text><text x="${bx + 14}" y="${ly + 13}" font-size="13" font-weight="700" fill="var(--seal-ink)" font-family="Figtree, sans-serif">${esc(amount(x, butce))}</text></a>`;
      });
      kurum += `<g class="mm-n1" style="--d:${(d1 + .25).toFixed(2)}s"><rect x="${gx - 82}" y="${gy - 19}" width="164" height="38" rx="19" fill="var(--seal-soft)" stroke="var(--seal)"/><text x="${gx}" y="${gy + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--seal-ink)" font-family="Figtree, sans-serif">${esc(trunc(g.k, 20))} (${g.items.length})</text></g>`;
      y += bh + GAP; gi++;
    });
  });
  const center = `<g class="mm-n0"><rect x="${cx - 95}" y="${cy - 36}" width="190" height="72" rx="16" fill="var(--ink)"/><text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="16" font-weight="700" fill="var(--bg)" font-family="'Bricolage Grotesque', Figtree, sans-serif">${esc(trunc(root, 20))}</text><text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="12" fill="var(--bg)" font-family="Figtree, sans-serif">${esc(trunc(goal, 26))}</text><text x="${cx}" y="${cy + 27}" text-anchor="middle" font-size="11" fill="var(--bg)" opacity=".75" font-family="Figtree, sans-serif">${total} fırsat · ${groups.length} kurum</text></g>`;
  return `<svg class="mm-anim" width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px" role="img" aria-label="${esc(root)} için ${total} destek fırsatının kurumlara göre haritası">${lines}${kurum}${leaves}${center}</svg>`;
}
P.sonuclar = async () => {
  const p = await Store.profile(); const d = await D.data();
  if (!p || !p.olcek) { $("#res").innerHTML = `<div class="empty"><h2>Önce işletmeni tanıyalım.</h2><p>Üç kısa adımda sana uygun destekleri çıkaralım.</p><a class="btn seal" ${link("bul")}>Uygunluk testine başla</a></div>`; return; }
  $("#notice").innerHTML = sampleNotice(d);
  const rows = d.destekler.map(x => ({ x, c: D.check(x, p) })).sort((a, b) => b.c.score - a.c.score);
  const fit = rows.filter(r => r.c.level === "ok"), mid = rows.filter(r => r.c.level === "mid");
  const secim = D.LS.get("secim");
  $("#baslik").textContent = `Sana uygun ${fit.length} destek bulduk.`;
  $("#profil").innerHTML = `${esc(OLCEK[p.olcek])}, ${esc((p.sektorler || []).map(s => SEKTOR[s]).join(", ") || "tüm sektörler")}, ${esc(p.il)}. <a ${link("bul")}>Bilgileri değiştir</a>` + (mid.length ? `<br>${mid.length} destek de kısmen uygun: bir koşulu henüz karşılamıyorsun.` : "");
  const kurumAdi = k => k.replace(/^Türk Eximbank$/, "Eximbank").replace(/ ve anlaşmalı bankalar$/, "").replace(/^SGK \/ İŞKUR$/, "SGK");
  const okN = g => g.items.filter(r => r.c.level === "ok").length;
  const groupBy = list => { const m = {}; list.forEach(r => { const k = kurumAdi(r.x.kurum); (m[k] = m[k] || []).push(r); }); return Object.entries(m).map(([k, items]) => ({ k, items: items.sort((a, b) => (a.c.level === "ok" ? 0 : 1) - (b.c.level === "ok" ? 0 : 1) || b.c.score - a.c.score) })).sort((a, b) => okN(b) - okN(a) || b.items.length - a.items.length); };
  const goal = (p.amaclar || []).length ? AMAC[p.amaclar[0]].replace(/ ve .*$/, "") + " hedefi" + (p.amaclar.length > 1 ? ` +${p.amaclar.length - 1}` : "") : "Büyüme hedefi";
  const view = params().get("gorunum") || "harita";
  $$("#view button").forEach(b => { b.setAttribute("aria-pressed", b.dataset.v === view); b.onclick = () => go("sonuclar", "gorunum=" + b.dataset.v); });
  const all = [...fit, ...mid];
  if (view === "harita") {
    const F = { tam: false, kredisiz: false, hibe: false, ...D.LS.get("mmFiltre", {}) };
    const filtered = () => all.filter(r => (!F.tam || r.c.level === "ok") && (!F.kredisiz || r.x.tur !== "kredi") && (!F.hibe || r.x.tur === "hibe"));
    const draw = () => { const wide = $("#mm").clientWidth > 760; $("#mm").innerHTML = mindmap(p.firmaUnvani || "İşletmen", goal, groupBy(filtered()), wide, num($("#mm-butce").value)); };
    $("#mm-butce").value = p.projeButce || ""; let bt; $("#mm-butce").oninput = () => { clearTimeout(bt); bt = setTimeout(() => { Store.saveProfile({ projeButce: $("#mm-butce").value }); draw(); }, 350); };
    const fb = $("#mm-filtre"); fb.hidden = false; $("#mm-butce-box").hidden = false;
    const sync = () => $$("button", fb).forEach(b => b.setAttribute("aria-pressed", !!F[b.dataset.f]));
    $$("button", fb).forEach(b => b.onclick = () => { const k = b.dataset.f; F[k] = !F[k]; if (k === "hibe" && F.hibe) F.kredisiz = false; if (k === "kredisiz" && F.kredisiz) F.hibe = false; D.LS.set("mmFiltre", F); sync(); draw(); });
    sync();
    $("#mm").hidden = false; $("#mm-legend").hidden = false; draw();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 200); });
  } else {
    $("#liste").hidden = false;
    $("#liste").innerHTML = (fit.length ? `<h2 style="margin:18px 0 4px">Uygun</h2><ul class="list">${fit.map(r => itemRow(r.x, r.c)).join("")}</ul>` : "") +
      (mid.length ? `<h2 style="margin:28px 0 4px">Kısmen uygun</h2><p class="muted small">Bir koşulu karşılamıyorsun ama yakınsın. Ayrıntıya bakarak ne gerektiğini görebilirsin.</p><ul class="list">${mid.map(r => itemRow(r.x, r.c)).join("")}</ul>` : "");
  }
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
  const yontem = { pdf: "Form otomatik doldurulur", online: "Online başvuru, adım adım rehber", bilgi: "Başvuru bilgi raporu hazırlanır" }[x.basvuru.yontem];
  $("#detay").innerHTML = `
    <p class="crumb"><a ${link("destekler")}>Tüm destekler</a> / ${esc(x.kurum)}</p>
    <div class="two"><div>
      <h1 style="font-size:clamp(26px,4vw,38px)">${esc(x.ad)}</h1>
      <p class="muted">${esc(x.kurum)} ${LEVEL_TAG[c.level]}</p>
      <dl class="facts">
        <div><dt>Destek türü</dt><dd>${TUR[x.tur] || x.tur}</dd></div>
        <div><dt>Üst limit</dt><dd>${x.ust_limit ? tl(x.ust_limit) : "Projeye göre"}</dd></div>
        <div><dt>Destek oranı</dt><dd>${x.destek_orani ? "%" + x.destek_orani : "Belirtilmemiş"}</dd></div>
        <div><dt>Son başvuru</dt><dd>${x.son_basvuru ? new Date(x.son_basvuru).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "Sürekli / çağrıya bağlı"}</dd></div>
      </dl>
      <p style="font-size:17px">${esc(x.ozet)}</p>
      <section class="sec"><h2>${p ? "Sana uygunluk" : "Başvuru koşulları"}</h2>
        <ul class="fit">${c.r.map(r => `<li class="${r.ok ? "y" : "n"}">${esc(r.t)}</li>`).join("")}${(x.kosullar || []).map(k => `<li class="q">${esc(k)}</li>`).join("")}</ul>
        ${!p ? `<p class="small muted">Uygunluğunu görmek için <a ${link("bul")}>uygunluk testini</a> yap.</p>` : ""}</section>
      <section class="sec"><h2>Hazırlaman gereken belgeler</h2><ul>${(x.belgeler || []).map(b => `<li>${esc(b)}</li>`).join("")}</ul></section>
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
      $("#oz-not").textContent = (x.ust_limit && butce * x.destek_orani / 100 > x.ust_limit ? `Üst limit ${tl(x.ust_limit)} olduğu için hibe bu tutarda sabitlenir. ` : "") + `Hibe ödenene kadar (${ay} ay) ${tl(Math.round(bas))} nakit veya kredi gerekir. Oranlar ve limitler ilana göre değişebilir; kurumun sayfasından kontrol et.`;
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
    if (mode !== "bilgi") return `<div class="mode mid"><div><b>Bu başvuru kurumun sitesinden yapılıyor</b>Siteyi yeni sekmede açıyoruz. Aşağıdaki “Hangi alana ne yazılacak” listesinden bilgileri kopyalayıp yapıştır.</div></div>`;
    return `<div class="mode mid"><div><b>Bu destek için doğrudan bir form yok</b>Başvuruda istenecek tüm bilgileri, belgeleri ve adımları tek bir PDF rapor halinde hazırlıyoruz.</div></div>`;
  };
  const renderAct = () => {
    const e = eksik();
    $("#mode").innerHTML = modeBox();
    $("#act").innerHTML = `<h3>${pdfOk ? "Doldurulmuş form" : mode !== "bilgi" ? "Online başvuru" : "Başvuru bilgi raporu"}</h3>
      ${e.length ? `<p class="small missing">${e.length} alan boş: ${e.slice(0, 4).map(k => ALANLAR[k]?.e).join(", ")}${e.length > 4 ? "…" : ""}</p>` : `<p class="small" style="color:var(--ok)">Tüm alanlar dolu.</p>`}
      <div class="actions" style="flex-direction:column;margin:12px 0">
        ${pdfOk ? `<button class="btn seal" type="button" id="dl-form">Formu doldur ve indir (PDF)</button>` : ""}
        ${!pdfOk && mode !== "bilgi" ? `<a class="btn seal" href="${esc(x.basvuru.online)}" target="_blank" rel="noopener" id="open-site">Başvuru sitesini aç ↗</a>` : ""}
        <button class="btn ${pdfOk || mode !== "bilgi" ? "ghost" : "seal"}" type="button" id="dl-info">Bilgi raporunu indir (PDF)</button>
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
    $("#dl-info").onclick = async () => { const b = $("#dl-info"); b.disabled = true; try { await persist(); const bytes = await D.infoPdf(x, values, p); await D.saveFile(`${x.id}-basvuru-bilgileri.pdf`, bytes); } catch { toast("Rapor oluşturulamadı. Tekrar dene."); } b.disabled = false; };
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
          toast("Hesabın oluşturuldu."); go(prof.sektorler ? "sonuclar" : "bul");
        } else { await Store.signIn(v); toast("Hoş geldin."); go("hesap"); }
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
