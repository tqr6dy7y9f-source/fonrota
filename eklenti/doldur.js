/*! FonRota eklentisi — başvuru formu doldurucu. Sayfadaki alanları etiketlerinden tanır, FonRota profilindeki bilgileri yazar.
   Hiçbir formu göndermez; şifre, dosya, onay kutusu ve gizli alanlara dokunmaz. */
(() => {
  if (window.__fonrota) return;
  const sade = t => String(t || "").toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, c => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[c])
    .replace(/[^a-z0-9]+/g, " ").trim();

  // Profil alanı -> etiket kalıpları (sade yazımla). Sıra önemli: özel olan önce.
  const ALAN = [
    ["vergiBirlikte", [/vergi daire(si)? ?(ve|\/)? ?(no|numara)/]],  // "Vergi dairesi/numarası" tek alanda
    ["vkn", [/vergi kimlik/, /vergi (no|numara)/, /\bvkn\b/, /\btckn? ?\/? ?vkn\b/]],
    ["vergiDairesi", [/vergi daire/]],
    ["ihracat", [/ihracat yap(mis|iyor|ti|ma)/, /yurt ?disina (ihracat|satis)/]],
    ["isTanimi", [/(firma|isletme|sirket)[a-z]* hakkinda/, /faaliyet konusu/, /isletmenizi tanit/, /ne is yap/]],
    ["naceKodu", [/\bnace\b/, /faaliyet kod/]],
    ["sirketTuru", [/sirket (turu|tipi)/, /hukuki (yapi|statu)/, /isletme (turu|tipi)/, /firma (turu|tipi)/]],
    ["kurulusYili", [/kurulus yil/, /kurulus tarih/, /tescil yil/]],
    ["calisan", [/^(?!.*(ongorulen|planlanan|hedeflenen|yeni|ek istihdam)).*(calisan sayi|personel sayi|isci sayi|istihdam (sayi|edilen)|calisan kisi)/]],
    ["ciro", [/net satis/, /\bciro/, /yillik satis/, /satis (gelir|hasilat)/, /hasilat/]],
    ["eposta", [/e ?posta/, /\be ?mail/, /\bmail\b/]],
    ["telefon", [/telefon/, /\bgsm\b/, /cep tel/, /\btel\b/, /iletisim no/]],
    ["adres", [/adres/]],
    ["il", [/^(il|sehir|bulundugu il|isletmenin bulundugu il|firma ili|il adi|il giriniz|faaliyette bulunulan il( ler)?)$/, /^il secin/, /\bil \/ ?ilce\b/]],
    ["soyad", [/^soy ?ad(i|iniz)?$/, /^soy ?isim/, /^last ?name$/, /^surname$/, /\blastname\b/]],
    ["ad", [/^ad(i|iniz)?$/, /^isim(iniz)?$/, /^first ?name$/, /\bfirstname\b/, /^given ?name$/]],
    ["yetkili", [/yetkili (ad|kisi|isim)/, /yetkili[a-z]* (ad|isim)/, /imza sahibi[a-z]* (ad|isim)/, /\badi (ve )?soyadi\b/, /(firma|isletme) sahibi/, /basvuru sahibi(nin)? (ad|isim)/, /temsilci/, /^ad ?soyad/, /^adi ?soyadi/, /^isim ?soyisim/, /iletisim kurulacak kisi/]],
    ["firmaUnvani", [/unvan/, /(firma|sirket|isletme|kurum|kurulus) (adi|ismi)/, /^firma$/, /^sirket$/]],
  ];
  const EK_AD = { ad: "Ad", soyad: "Soyadı", vergiBirlikte: "Vergi dairesi / no" };
  const adi = (adlar, k) => adlar[k] || EK_AD[k] || k;
  const ATLA = /(sifre|parola|password|captcha|guvenlik kod|dogrulama kod|\bt ?c kimlik|^kimlik no)/;  // T.C. kimlik no profilde yok; vergi kimlik no değil

  const metin = el => (el ? el.textContent : "") || "";
  function etiket(el) {
    const p = [];
    if (el.id) document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach(l => p.push(metin(l)));
    const sar = el.closest("label"); if (sar) p.push(metin(sar));
    // Etiket "for" ile bağlanmamışsa aynı kutudaki etiket (ör. Bootstrap .form-group / .mb-3)
    if (!p.length) { const k = el.closest(".form-group, .mb-3, .form-floating, .field, .form-item, .input-group, td"); const l = k && k.querySelector("label"); if (l && !l.querySelector("input,select,textarea")) p.push(metin(l)); }
    (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).forEach(id => p.push(metin(document.getElementById(id))));
    p.push(el.getAttribute("aria-label"), el.getAttribute("placeholder"), el.getAttribute("title"));
    if (!p.filter(Boolean).join("").trim()) {
      // Tablo düzeni: aynı satırdaki önceki hücre; ya da hemen öncesindeki metin
      const td = el.closest("td,th"); if (td && td.previousElementSibling) p.push(metin(td.previousElementSibling));
      let o = el.previousElementSibling; for (let i = 0; o && i < 2; i++, o = o.previousElementSibling) if (!/^(INPUT|SELECT|TEXTAREA)$/.test(o.tagName)) { p.push(metin(o)); break; }
      // Google Forms vb.: soru başlığı kapsayıcının içinde
      const s = el.closest('[role="listitem"], .form-group, .field, .form-item, fieldset'); if (s) { const h = s.querySelector('[role="heading"], legend, .label, h3, h4'); if (h) p.push(metin(h)); }
    }
    p.push((el.name || "").replace(/[_\-.\[\]]+/g, " "), (el.id || "").replace(/[_\-]+/g, " "));
    return p.filter(Boolean).map(sade).filter(Boolean);
  }
  function alanBul(el) {
    if (el.type === "email") return "eposta";
    if (el.type === "tel") return "telefon";
    const ad = etiket(el); if (!ad.length || ad.some(t => ATLA.test(t))) return null;
    for (const [k, kal] of ALAN) if (ad.some(t => kal.some(r => r.test(t)))) return k;
    return null;
  }
  const uygun = el => !el.disabled && !el.readOnly && el.offsetParent !== null && !/^(hidden|password|file|checkbox|radio|submit|button|reset|image|search|range|color)$/i.test(el.type || "");
  function yaz(el, v) {
    if (el.tagName === "SELECT") {
      const s = sade(v), op = [...el.options].find(o => sade(o.text) === s || sade(o.value) === s) || [...el.options].find(o => s && sade(o.text).includes(s));
      if (!op) return false; el.value = op.value;
    } else {
      if (el.type === "number" && !/^-?\d+([.,]\d+)?$/.test(String(v).trim())) v = String(v).replace(/[^\d]/g, "");
      if (el.type === "date") return false;  // elimizde yalnızca yıl var; tarihi kullanıcı seçsin
      const set = Object.getOwnPropertyDescriptor(el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value").set;
      set.call(el, v);  // React/Vue gibi kütüphaneler de değişikliği görsün
    }
    el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  function isaretle(el, k, ad) {
    el.style.outline = "2px solid #B9832A"; el.style.outlineOffset = "1px"; el.style.backgroundColor = "#FBF3E4";
    el.title = `FonRota dolduruldu: ${adi(ad, k)}`; el.dataset.fonrota = k;
  }
  function deger(p, k) {
    if (k === "vergiBirlikte") return [p.vergiDairesi, p.vkn].filter(Boolean).join(" / ");
    if (k === "ihracat") return p.ihracat === true ? "Evet" : p.ihracat === false ? "Hayır" : "";
    if (k === "yetkili") return p.yetkili || p.ad || "";
    if (k === "ad" || k === "soyad") {  // "Berra Nur Kasaplı" -> ad: "Berra Nur", soyad: "Kasaplı"
      const s = String(p.yetkili || "").trim().split(/\s+/).filter(Boolean); if (s.length < 2) return "";
      return k === "soyad" ? s[s.length - 1] : s.slice(0, -1).join(" ");
    }
    const v = p[k]; if (v == null || v === "") return "";
    if (k === "eposta" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())) return "";   // geçersiz e-posta yazılmaz
    if (k === "telefon" && String(v).replace(/\D/g, "").length < 10) return "";                   // eksik telefon yazılmaz
    return String(v);
  }

  window.__fonrota = {
    // Sayfadaki tüm uygun alanları doldurur. ustuneYaz=false ise dolu alanlara dokunmaz.
    doldur(profil, adlar = {}, ustuneYaz = false) {
      const sonuc = { dolan: [], bos: [], tanınmayan: 0 };
      document.querySelectorAll("input, select, textarea").forEach(el => {
        if (!uygun(el) || el.closest("#fonrota-rozet, #fonrota-panel")) return;
        const k = alanBul(el);
        if (!k) { if (el.tagName !== "SELECT") sonuc.tanınmayan++; return; }
        if (!ustuneYaz && el.value && el.tagName !== "SELECT") return;
        if (k === "ihracat" && el.tagName !== "SELECT") return;
        const v = deger(profil, k);
        if (!v) { sonuc.bos.push(adi(adlar, k)); return; }
        if (yaz(el, v)) { isaretle(el, k, adlar); sonuc.dolan.push(adi(adlar, k)); }
      });
      sonuc.dolan = [...new Set(sonuc.dolan)]; sonuc.bos = [...new Set(sonuc.bos)];
      return sonuc;
    },
    // FonRota'dan açılan sekme: giriş sayfasına dokunmaz; form adım adım ilerledikçe her yeni adımı doldurur; yan panel gösterir
    otomatik(profil, adlar = {}, programAdi = "") {
      if (this._oto) { this._oto.profil = profil; return; }  // aynı sayfada ikinci kez başlatma
      const durum = this._oto = { profil, toplam: new Set(), bos: new Set() };
      // Giriş sayfası: görünür şifre kutusu var ve onun dışında en fazla 3 alan var (uzun başvuru formundaki "şifre belirleyin" alanı giriş sayılmaz)
      const girisSayfasi = () => {
        const g = [...document.querySelectorAll("input, select, textarea")].filter(e => e.offsetParent !== null && !e.closest("#fonrota-rozet, #fonrota-panel") && !/^(hidden|submit|button|image|reset|checkbox|radio)$/i.test(e.type || ""));
        const sifre = g.filter(e => e.type === "password"), diger = g.filter(e => e.type !== "password");
        if (!sifre.length) return false;
        const kayitFormu = sifre.length > 1 || sifre.some(e => /new-password/i.test(e.autocomplete || "")) || diger.some(e => ["ad", "soyad", "yetkili"].includes(alanBul(e)));
        return !kayitFormu && diger.length <= 3;
      };
      const tur = () => {
        if (girisSayfasi()) { if (window === top) rozet(true); return; }
        const r = this.doldur(durum.profil, adlar); r.dolan.forEach(x => durum.toplam.add(x)); r.bos.forEach(x => durum.bos.add(x));
        document.querySelectorAll("[data-fonrota]").forEach(e => durum.toplam.add(adi(adlar, e.dataset.fonrota)));  // düğmeyle az önce doldurulanlar da sayılır
        if (window === top) rozet(false);
      };
      const rozet = giris => {
        let k = document.getElementById("fonrota-rozet");
        if (!k) { k = document.createElement("div"); k.id = "fonrota-rozet"; k.setAttribute("role", "status");
          k.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:2147483646;max-width:340px;background:#12343B;color:#F3F6F4;font:14px/1.45 system-ui,sans-serif;padding:12px 30px 12px 14px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.3);border-left:5px solid #E0AE57";
          document.body.appendChild(k); }
        k.innerHTML = "";
        const b = document.createElement("b"); b.style.display = "block";
        const t = document.createElement("span");
        if (giris) { b.textContent = "FonRota: giriş sayfası"; t.textContent = "Önce kendin giriş yap (şifrene dokunmuyorum). Başvuru formuna geçince bilgilerini adım adım dolduracağım."; }
        else if (durum.toplam.size) { b.textContent = `FonRota: ${durum.toplam.size} bilgi dolduruldu`; t.textContent = "Altın çerçeveli alanları kontrol et. Formun sonraki adımları da açıldıkça doldurulur. Dolmayan alan için sağdaki paneli kullan." + (durum.bos.size ? ` Profilinde boş: ${[...durum.bos].join(", ")}.` : ""); }
        else { b.textContent = "FonRota hazır"; t.textContent = "Bu sayfada tanıdığım bir alan yok. Başvuru formuna geçtiğinde dolduracağım; istersen alana tıklayıp sağdaki panelden seç."; }
        const x = document.createElement("button"); x.textContent = "×"; x.setAttribute("aria-label", "Kapat");
        x.style.cssText = "position:absolute;top:4px;right:8px;background:none;border:none;color:inherit;font-size:18px;cursor:pointer"; x.onclick = () => k.remove();
        k.append(b, t, x);
        if (programAdi) { const p = document.createElement("small"); p.textContent = programAdi; p.style.cssText = "display:block;opacity:.7;margin-top:4px"; k.append(p); }
        panel(!giris);
      };
      // Yan panel: tıklanan son kutuya seçilen bilgiyi yazar (etiketi tanınmayan alanlar için)
      let sonKutu = null;
      document.addEventListener("focusin", e => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== "password") sonKutu = e.target; }, true);
      const panel = goster => {
        if (window !== top) return;
        let h = document.getElementById("fonrota-panel");
        if (!goster) { if (h) h.remove(); return; }
        if (h) return;
        h = document.createElement("div"); h.id = "fonrota-panel"; document.body.appendChild(h);
        const r = h.attachShadow({ mode: "open" });
        r.innerHTML = `<style>
          :host{all:initial}.k{position:fixed;right:0;top:120px;z-index:2147483646;font:13px/1.4 system-ui,sans-serif;display:flex;align-items:flex-start}
          .sek{writing-mode:vertical-rl;transform:rotate(180deg);background:#12343B;color:#F3F6F4;border:none;border-radius:0 8px 8px 0;padding:12px 7px;cursor:pointer;font:600 13px system-ui;border-left:4px solid #E0AE57}
          .i{background:#fff;color:#12343B;border:1px solid #D3DCD8;border-right:none;border-radius:10px 0 0 10px;box-shadow:0 8px 24px rgba(0,0,0,.2);width:250px;max-height:70vh;overflow:auto;padding:10px}
          .i[hidden]{display:none}h4{margin:0 0 4px;font-size:14px}p{margin:0 0 8px;color:#5B7068;font-size:12px}
          button.d{display:block;width:100%;text-align:left;background:#F3F6F4;border:1px solid #D3DCD8;border-radius:8px;padding:6px 8px;margin:4px 0;cursor:pointer;font:inherit;color:inherit}
          button.d:hover{border-color:#B9832A}button.d small{display:block;color:#5B7068;font-size:11px}button.d span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .u{color:#8F3A3A;font-size:12px;min-height:1em}</style>
          <div class="k"><div class="i" hidden><h4>FonRota bilgilerin</h4><p>Önce sayfadaki kutuya tıkla, sonra buradan bilgiyi seç.</p><div class="l"></div><div class="u"></div></div><button class="sek" title="FonRota bilgilerin">FonRota</button></div>`;
        const ic = r.querySelector(".i"), l = r.querySelector(".l"), u = r.querySelector(".u");
        r.querySelector(".sek").onclick = () => { ic.hidden = !ic.hidden; };
        Object.entries(adlar).forEach(([k, ad]) => {
          const v = deger(durum.profil, k); if (!v) return;
          const b = document.createElement("button"); b.className = "d"; b.type = "button";
          const s1 = document.createElement("small"); s1.textContent = ad; const s2 = document.createElement("span"); s2.textContent = v; b.append(s1, s2);
          b.addEventListener("mousedown", e => e.preventDefault());  // kutudaki odak kaybolmasın
          b.onclick = () => {
            const el = sonKutu && document.contains(sonKutu) ? sonKutu : null;
            if (!el) { u.textContent = "Önce doldurmak istediğin kutuya tıkla."; return; }
            if (yaz(el, v)) { isaretle(el, k, adlar); u.textContent = ""; el.focus(); } else u.textContent = "Bu kutuya yazılamadı.";
          };
          l.append(b);
        });
      };
      tur(); setTimeout(tur, 1500);
      // Adım adım formlar: sayfa değiştikçe (yeni adım, açılan bölüm) yeniden doldur; sayfa açık kaldıkça izler
      let z; const g = new MutationObserver(() => { clearTimeout(z); z = setTimeout(tur, 700); });
      g.observe(document.documentElement, { childList: true, subtree: true });
      addEventListener("hashchange", () => setTimeout(tur, 500)); addEventListener("popstate", () => setTimeout(tur, 500));
    },
    // PDF/Word formlarındaki etiket metninden profil alanını bulur (formdoldur.js kullanır)
    etiketten(metin) {
      const t = sade(String(metin || "").replace(/^[\s•·\-–*\d.)]+/, "").replace(/[:：]\s*$/, ""));
      if (!t || t.length > 90 || /tebligat|\bkep\b|\buets\b|web|internet sitesi/.test(t)) return null;
      if (/imza|kase|tarih|paraf/.test(t) && !/\b(ad|adi|soyad|soyadi|isim)\b/.test(t)) return null;   // "İmza", "Tarih" boş kalır; "imza sahibinin adı soyadı" doldurulur
      if (/vergi (no|numara|kimlik)/.test(t)) return /daire/.test(t) ? "vergiBirlikte" : "vkn";  // "Vergi No / T.C. Kimlik No" gibi birleşik etiketler
      if (ATLA.test(t)) return null;
      for (const [k, kal] of ALAN) if (kal.some(r => r.test(t))) return k;
      return null;
    },
    deger: (p, k) => deger(p, k),
    alanAdi: (adlar, k) => adi(adlar, k),
    // Sağ tık menüsü: odaktaki alana seçilen bilgiyi yazar
    alanaYaz(profil, k, adlar = {}) {
      const el = document.activeElement;
      if (!el || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return { hata: "Önce doldurmak istediğin alana tıkla." };
      const v = deger(profil, k); if (!v) return { hata: `Profilinde “${adi(adlar, k)}” boş ya da geçersiz.` };
      return yaz(el, v) ? (isaretle(el, k, adlar), { tamam: true }) : { hata: "Bu alana yazılamadı." };
    }
  };
})();
