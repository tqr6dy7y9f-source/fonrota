/*! FonRota — PDF ve Word başvuru formu doldurucu.
   Kurumun formunu (PDF ya da .docx) kullanıcının profil bilgileriyle doldurup yeni bir dosya üretir.
   Dosya hiçbir sunucuya gönderilmez; her şey tarayıcıda yapılır. Kurumun formu değiştirilmez, yalnızca
   boş alanlara yazılır.
   - Doldurulabilir PDF (AcroForm): alan adlarından tanır.
   - Düz PDF (kurumların çoğu): sayfadaki etiketleri ("İşletme Ünvanı" gibi) ve tablo çizgilerini bulur,
     değeri etiketin sağındaki boş hücreye ya da etiketin yanına yazar.
   - Word (.docx): tabloda etiketin yanındaki boş hücreyi ve "Etiket: ……" satırlarını doldurur.
   Gerekenler: window.__fonrota (doldur.js: etiket kuralları), PDFLib + fontkit, pdfjsLib, JSZip. */
(() => {
  if (window.FormDoldur) return;
  const F = () => window.__fonrota;

  function tur(bytes, ad = "") {
    const b = new Uint8Array(bytes.slice(0, 8));
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf";        // %PDF
    if (b[0] === 0x50 && b[1] === 0x4b) return /\.(xlsx|pptx|zip)$/i.test(ad) ? "diger" : "docx";  // PK (zip)
    if (b[0] === 0xd0 && b[1] === 0xcf) return "doc";                                        // eski Word
    return "diger";
  }
  const sayi = v => { const n = Number(String(v).replace(/[^\d]/g, "")); return n ? new Intl.NumberFormat("tr-TR").format(n) : v; };
  function deger(profil, k) {
    let v = F().deger(profil, k); if (!v) return "";
    if (k === "ciro") v = sayi(v) + " TL";
    return String(v);
  }
  const ad = (adlar, k) => F().alanAdi(adlar || {}, k);

  /* ---------------- PDF ---------------- */
  const carp = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const nokta = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  // Sayfadaki dikey çizgiler (tablo hücre sınırları): dikdörtgenler ve çizgilerden
  async function dikeyCizgiler(sayfa) {
    const OPS = window.pdfjsLib.OPS, ol = await sayfa.getOperatorList();
    const out = [], yigin = []; let m = [1, 0, 0, 1, 0, 0];
    const dikey = (x1, y1, x2, y2) => { if (Math.abs(x1 - x2) < 1.5 && Math.abs(y1 - y2) > 4) out.push({ x: (x1 + x2) / 2, y0: Math.min(y1, y2), y1: Math.max(y1, y2) }); };
    for (let i = 0; i < ol.fnArray.length; i++) {
      const fn = ol.fnArray[i], a = ol.argsArray[i];
      if (fn === OPS.save) yigin.push(m);
      else if (fn === OPS.restore) m = yigin.pop() || [1, 0, 0, 1, 0, 0];
      else if (fn === OPS.transform) m = carp(m, a);
      else if (fn === OPS.constructPath) {
        const [ops, args] = a; let j = 0, cx = 0, cy = 0;
        for (const op of ops) {
          if (op === OPS.rectangle) {
            const [x, y, w, h] = args.slice(j, j + 4); j += 4;
            const p = [nokta(m, x, y), nokta(m, x + w, y), nokta(m, x + w, y + h), nokta(m, x, y + h)];
            const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            if (x1 - x0 < 3) dikey((x0 + x1) / 2, y0, (x0 + x1) / 2, y1);         // ince dikdörtgen = dikey çizgi
            else if (y1 - y0 > 4) { dikey(x0, y0, x0, y1); dikey(x1, y0, x1, y1); }   // hücre kutusu: iki kenarı
          } else if (op === OPS.moveTo) { [cx, cy] = nokta(m, args[j], args[j + 1]); j += 2; }
          else if (op === OPS.lineTo) { const [x, y] = nokta(m, args[j], args[j + 1]); j += 2; dikey(cx, cy, x, y); cx = x; cy = y; }
          else if (op === OPS.curveTo) j += 6; else if (op === OPS.curveTo2 || op === OPS.curveTo3) j += 4;
        }
      }
    }
    return out;
  }

  // Metin parçalarını satırlara, satırları da aralarındaki boşluğa göre öbeklere ayırır
  async function obekler(sayfa) {
    const tc = await sayfa.getTextContent();
    const p = tc.items.filter(i => i.str && i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.hypot(i.transform[2], i.transform[3]) || i.height || 10 }));
    p.sort((a, b) => b.y - a.y || a.x - b.x);
    const satirlar = [];
    for (const it of p) { const s = satirlar.find(l => Math.abs(l.y - it.y) < Math.max(2, it.h * 0.3)); if (s) s.p.push(it); else satirlar.push({ y: it.y, p: [it] }); }
    const sonuc = [];
    for (const l of satirlar) {
      l.p.sort((a, b) => a.x - b.x);
      let o = null; const lo = [];
      for (const it of l.p) {
        const dolguMu = t => /^[\s.…_·\-]+$/.test(t);
        if (o && it.x - (o.x1) < Math.max(4, it.h * 0.9) && dolguMu(it.s) === dolguMu(o.s)) { o.s += (it.x - o.x1 > it.h * 0.15 ? " " : "") + it.s; o.x1 = it.x + it.w; o.h = Math.max(o.h, it.h); }
        else { o = { s: it.s, x0: it.x, x1: it.x + it.w, y: it.y, h: it.h }; lo.push(o); }
      }
      for (const x of lo) {
        if (/^[\s.…_·\-]+$/.test(x.s)) { x.dolgu = true; continue; }
        // "E-posta: ……………" tek parçaysa: etiket ile dolgu ayrılır, dolgunun yaklaşık başlangıcı karakter oranından bulunur
        const m = x.s.match(/^(.*?[^\s.…_·])\s*([.…_]{3,}[\s.…_·]*)$/);
        if (m) { const x1 = x.x0 + (x.x1 - x.x0) * (m[1].length / x.s.length); x.dolguBas = x1 + 1; x.dolguSon = x.x1; x.s = m[1]; x.x1 = x1; }
      }
      lo.forEach((x, i) => { x.satir = lo; x.sira = i; }); sonuc.push(...lo);
    }
    return sonuc;
  }

  async function pdfDoldur(bytes, profil, adlar) {
    const { PDFDocument, PDFTextField, rgb } = window.PDFLib;
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    doc.registerFontkit(window.fontkit);
    const font = await doc.embedFont(await (await fetch(FormDoldur.kok + "lib/DejaVuSans.ttf")).arrayBuffer(), { subset: true });
    const dolan = [], bos = new Set();
    // 1) Doldurulabilir alanlar
    let form = null; try { form = doc.getForm(); } catch { /* form yok */ }
    const alanlar = form ? form.getFields().filter(f => f instanceof PDFTextField) : [];
    for (const fl of alanlar) {
      const k = F().etiketten(fl.getName().replace(/[_\-.]+/g, " ")); if (!k) continue;
      const v = deger(profil, k); if (!v) { bos.add(ad(adlar, k)); continue; }
      if (fl.getText()) continue;
      fl.setText(v); dolan.push({ alan: ad(adlar, k), etiket: fl.getName(), deger: v });
    }
    if (alanlar.length) { try { form.updateFieldAppearances(font); } catch { } }
    // 2) Düz PDF: etiket konumlarından
    if (!dolan.length) {
      const pd = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)), isEvalSupported: false, disableFontFace: true }).promise;
      const sayfalar = doc.getPages(), mavi = rgb(0.05, 0.16, 0.48), yazilan = new Set();
      for (let n = 1; n <= Math.min(pd.numPages, 40); n++) {
        const sp = await pd.getPage(n), sayfa = sayfalar[n - 1]; if (!sayfa) break;
        const genis = sp.view[2], ob = await obekler(sp), cizgi = await dikeyCizgiler(sp);
        for (const o of ob) {
          const uzun = o.satir.length === 1 && o.s.length > 60;   // paragraf satırı, etiket değil
          if (uzun) continue;
          const k = F().etiketten(o.s); if (!k || yazilan.has(k + ":" + n + ":" + Math.round(o.y))) continue;
          const v = deger(profil, k); if (!v) { bos.add(ad(adlar, k)); continue; }
          const orta = o.y + o.h * 0.35;
          // Etiketin sağındaki ilk dikey çizgi = değer hücresinin başı; ondan sonraki = hücrenin sonu
          const sag = cizgi.filter(c => c.x >= o.x1 - 1 && c.x <= o.x1 + 320 && c.y0 - 2 <= orta && c.y1 + 2 >= orta).sort((a, b) => a.x - b.x);
          // Değer hücresi: etiketin sağındaki, en az 40 birim genişliğindeki ilk iki dikey çizgi arası.
          // Uygun hücre yoksa (madde listesi, serbest metin) etiketin hemen yanına yazılır.
          let x, son, ust = null, alt = null;
          const hucre = sag.map((c, i) => [c, sag.slice(i + 1).find(d => d.x > c.x + 2)]).find(([c, d]) => (d ? d.x : genis - 36) - c.x >= 40);
          if (hucre) { const [c, d] = hucre; x = c.x + 4; son = (d ? d.x : genis - 36) - 4; ust = Math.min(c.y1, d ? d.y1 : c.y1); alt = Math.max(c.y0, d ? d.y0 : c.y0); }
          else { x = (o.dolguBas || o.x1) + (o.dolguBas ? 2 : 8); son = genis - 36; }
          // Hedef alanda zaten yazı varsa (dolu hücre ya da etiketin devamı) dokunma; yalnızca nokta/çizgi dolgusu boş sayılır
          const ayni = b => b !== o && Math.abs(b.y - o.y) < o.h * 0.6 && b.x1 > x && b.x0 < son;
          if (ob.some(b => ayni(b) && !b.dolgu)) continue;
          const genislik = son - x; if (genislik < 30) continue;
          // Nokta/çizgi dolgusu beyazla örtülür, değer onun yerine yazılır
          const beyaz = (x0, x1) => sayfa.drawRectangle({ x: x0, y: o.y - o.h * 0.3, width: Math.max(0, x1 - x0), height: o.h * 1.15, color: rgb(1, 1, 1) });
          if (o.dolguBas && !hucre) beyaz(o.dolguBas, o.dolguSon + 1);
          ob.filter(b => ayni(b) && b.dolgu).forEach(b => beyaz(b.x0 - 1, b.x1 + 1));
          let boy = Math.min(10, Math.max(7, o.h * 0.9)), yaz = v;
          const sigar = (t, b) => font.widthOfTextAtSize(t, b) <= genislik;
          const satirla = b => { const out = []; let l = ""; for (const w of v.split(/\s+/)) { const t = l ? l + " " + w : w; if (sigar(t, b) || !l) l = t; else { out.push(l); l = w; } } if (l) out.push(l); return out; };
          if (!sigar(v, boy)) {
            // Hücre yeterince yüksekse alt satırlara kaydır; değilse küçült, en son kısalt
            const b2 = Math.max(7, boy - 1.5), sat = satirla(b2);
            if (ust != null && sat.length > 1 && sat.length * b2 * 1.18 <= ust - alt - 3 && sat.every(t => sigar(t, b2))) {
              sat.forEach((t, i) => sayfa.drawText(t, { x, y: ust - 2 - b2 * (i + 1) * 1.15, size: b2, font, color: mavi }));
              yazilan.add(k + ":" + n + ":" + Math.round(o.y)); dolan.push({ alan: ad(adlar, k), etiket: o.s.trim(), deger: v, sayfa: n }); continue;
            }
            while (!sigar(v, boy) && boy > 6) boy -= 0.5;
            while (!sigar(yaz, boy) && yaz.length > 4) yaz = yaz.slice(0, -2) + "…";
          }
          sayfa.drawText(yaz, { x, y: o.y, size: boy, font, color: mavi });
          yazilan.add(k + ":" + n + ":" + Math.round(o.y)); dolan.push({ alan: ad(adlar, k), etiket: o.s.trim(), deger: yaz, sayfa: n });
        }
      }
      try { await pd.destroy(); } catch { }
    }
    try { doc.setProducer("FonRota form doldurucu"); } catch { }
    const cikti = await doc.save();
    return { blob: new Blob([cikti], { type: "application/pdf" }), uzanti: "pdf", dolan, bos: [...bos] };
  }

  /* ---------------- Word (.docx) ---------------- */
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const metin = el => [...el.getElementsByTagNameNS(W, "t")].map(t => t.textContent).join("");
  const dolgu = s => /^[\s.…_:\-·]*$/.test(s);
  function kosu(xml, ornek, v) {
    const r = xml.createElementNS(W, "w:r");
    const rpr = ornek && ornek.getElementsByTagNameNS(W, "rPr")[0];
    if (rpr) { const k = rpr.cloneNode(true); ["b", "bCs", "i", "iCs", "u", "caps"].forEach(n => [...k.getElementsByTagNameNS(W, n)].forEach(e => e.remove())); r.appendChild(k); }
    const t = xml.createElementNS(W, "w:t"); t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"); t.textContent = v; r.appendChild(t);
    return r;
  }
  async function docxDoldur(bytes, profil, adlar) {
    const zip = await window.JSZip.loadAsync(bytes);
    const yol = "word/document.xml"; const xml = new DOMParser().parseFromString(await zip.file(yol).async("string"), "application/xml");
    const dolan = [], bos = new Set();
    // 1) Tablo: etiket hücresi + sağındaki boş hücre
    // Kişi bloğu ("Adı Soyadı" satırından hemen sonra gelen tek başına "Unvanı") kişinin görev unvanıdır, firma ünvanı değil.
    let kisiSatiri = -9, satirNo = 0;
    const yalinUnvan = t => /^(unvan|unvani|unvanı)$/i.test(String(t).trim().replace(/[:\s]+$/, "").toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/ü/g, "u"));
    for (const tr of [...xml.getElementsByTagNameNS(W, "tr")]) {
      satirNo++;
      const hucre = [...tr.childNodes].filter(n => n.localName === "tc");
      for (let i = 0; i < hucre.length - 1; i++) {
        const et = metin(hucre[i]); const k = F().etiketten(et); if (!k) continue;
        if (["yetkili", "ad", "soyad"].includes(k) && !/unvan/i.test(et.toLocaleLowerCase("tr-TR").replace(/ü/g, "u"))) kisiSatiri = satirNo;
        if (k === "firmaUnvani" && yalinUnvan(et) && satirNo - kisiSatiri <= 2) continue;
        if (!dolgu(metin(hucre[i + 1]))) continue;
        const v = deger(profil, k); if (!v) { bos.add(ad(adlar, k)); continue; }
        const p = hucre[i + 1].getElementsByTagNameNS(W, "p")[0] || hucre[i + 1].appendChild(xml.createElementNS(W, "w:p"));
        [...p.getElementsByTagNameNS(W, "r")].forEach(r => r.remove());   // nokta/çizgi dolgusu silinir
        p.appendChild(kosu(xml, hucre[i].getElementsByTagNameNS(W, "r")[0], v));
        dolan.push({ alan: ad(adlar, k), etiket: et.trim(), deger: v }); i++;
      }
    }
    // 2) Paragraf: "Etiket: ………" — aynı satırda birden çok olabilir ("Tel: ……… E-posta: ………").
    //    Her "etiket: dolgu" çifti ayrı ayrı tanınır; dolgu değerle değiştirilir. Satır tek bir koşu olarak yeniden yazılır.
    for (const p of [...xml.getElementsByTagNameNS(W, "p")]) {
      if (p.parentNode && p.parentNode.localName === "tc" && p.parentNode.parentNode && [...p.parentNode.parentNode.childNodes].filter(n => n.localName === "tc").length > 1) continue;  // tablo hücreleri yukarıda
      const t = metin(p); if (!/[:：]/.test(t) || t.length > 400) continue;
      const parca = []; let yeni = "", bas = 0, degisti = false;
      const re = /[:：]([\s.…_·\-]*)/g; let m;
      while ((m = re.exec(t))) {
        const etiket = t.slice(bas, m.index), dolguVar = /[.…_]{2,}/.test(m[1]) || m.index + m[0].length >= t.trimEnd().length;
        const k = dolguVar ? F().etiketten(etiket.trim()) : null;
        const v = k ? deger(profil, k) : "";
        if (k && !v) bos.add(ad(adlar, k));
        if (k && v) { yeni += etiket + ": " + v + (m.index + m[0].length < t.length ? " " : ""); degisti = true; dolan.push({ alan: ad(adlar, k), etiket: etiket.trim(), deger: v }); }
        else yeni += t.slice(bas, m.index + m[0].length);
        bas = m.index + m[0].length;
      }
      yeni += t.slice(bas);
      if (!degisti) continue;
      const rs = [...p.getElementsByTagNameNS(W, "r")], ilk = rs.find(r => r.getElementsByTagNameNS(W, "t").length) || rs[0];
      const yeniKosu = kosu(xml, ilk, yeni.replace(/\s+$/, ""));
      const ilkRpr = ilk && ilk.getElementsByTagNameNS(W, "rPr")[0];   // satırın kendi biçimi (kalınlık dahil) korunur
      if (ilkRpr) { const k = yeniKosu.getElementsByTagNameNS(W, "rPr")[0]; if (k) yeniKosu.replaceChild(ilkRpr.cloneNode(true), k); }
      rs.forEach((r, i) => { if (i === 0 && r.parentNode) r.parentNode.insertBefore(yeniKosu, r); r.remove(); });
      if (!rs.length) p.appendChild(yeniKosu);
    }
    zip.file(yol, new XMLSerializer().serializeToString(xml));
    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    return { blob, uzanti: "docx", dolan, bos: [...bos] };
  }

  window.FormDoldur = {
    kok: "",   // lib/ klasörünün bulunduğu adres (eklentide chrome.runtime.getURL(""), sitede "eklenti/")
    tur,
    async doldur(bytes, dosyaAdi, profil, adlar) {
      const t = tur(bytes, dosyaAdi);
      if (t === "pdf") { window.pdfjsLib.GlobalWorkerOptions.workerSrc = FormDoldur.kok + "lib/pdf.worker.min.js"; return { tur: t, ...(await pdfDoldur(bytes, profil, adlar)) }; }
      if (t === "docx") return { tur: t, ...(await docxDoldur(bytes, profil, adlar)) };
      if (t === "doc") throw new Error("Bu dosya eski Word biçiminde (.doc). Word’de açıp “Farklı Kaydet > Word Belgesi (.docx)” ile kaydedip yeniden dene.");
      throw new Error("Bu dosya PDF ya da Word (.docx) başvuru formu değil.");
    },
    // Doldurulmuş dosyanın adı: "basvuru-formu.pdf" -> "basvuru-formu-doldurulmus.pdf"
    dosyaAdi: (ad, uzanti) => (String(ad || "basvuru-formu").replace(/\.[a-z0-9]+$/i, "").replace(/[^\wçğıöşüÇĞİÖŞÜ.\- ]+/g, "_").slice(0, 80) || "basvuru-formu") + "-doldurulmus." + uzanti,
  };
})();
