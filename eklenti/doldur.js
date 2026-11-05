/*! FonRota eklentisi — başvuru formu doldurucu. Sayfadaki alanları etiketlerinden tanır, FonRota profilindeki bilgileri yazar.
   Hiçbir formu göndermez; şifre, dosya, onay kutusu ve gizli alanlara dokunmaz. */
(() => {
  if (window.__fonrota) return;
  const sade = t => String(t || "").toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, c => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" })[c])
    .replace(/[^a-z0-9]+/g, " ").trim();

  // Profil alanı -> etiket kalıpları (sade yazımla). Sıra önemli: özel olan önce.
  const ALAN = [
    ["vkn", [/vergi kimlik/, /vergi (no|numara)/, /\bvkn\b/, /\btckn? ?\/? ?vkn\b/]],
    ["vergiDairesi", [/vergi daire/]],
    ["naceKodu", [/\bnace\b/, /faaliyet kod/]],
    ["sirketTuru", [/sirket (turu|tipi)/, /hukuki (yapi|statu)/, /isletme (turu|tipi)/, /firma (turu|tipi)/]],
    ["kurulusYili", [/kurulus yil/, /kurulus tarih/, /tescil yil/]],
    ["calisan", [/calisan sayi/, /personel sayi/, /isci sayi/, /istihdam (sayi|edilen)/, /calisan kisi/]],
    ["ciro", [/net satis/, /\bciro/, /yillik satis/, /satis (gelir|hasilat)/, /hasilat/]],
    ["eposta", [/e ?posta/, /\be ?mail/, /\bmail\b/]],
    ["telefon", [/telefon/, /\bgsm\b/, /cep tel/, /\btel\b/, /iletisim no/]],
    ["adres", [/adres/]],
    ["il", [/^(il|sehir|bulundugu il|isletmenin bulundugu il|firma ili|il adi)$/, /^il secin/, /\bil \/ ?ilce\b/]],
    ["yetkili", [/yetkili (ad|kisi|isim)/, /basvuru sahibi(nin)? (ad|isim)/, /temsilci/, /^ad ?soyad/, /^adi ?soyadi/, /^isim ?soyisim/, /iletisim kurulacak kisi/]],
    ["firmaUnvani", [/unvan/, /(firma|sirket|isletme|kurum|kurulus) (adi|ismi)/, /^firma$/, /^sirket$/]],
  ];
  const ATLA = /(sifre|parola|password|captcha|guvenlik kod|dogrulama kod|\bt ?c kimlik|^kimlik no)/;  // T.C. kimlik no profilde yok; vergi kimlik no değil

  const metin = el => (el ? el.textContent : "") || "";
  function etiket(el) {
    const p = [];
    if (el.id) document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach(l => p.push(metin(l)));
    const sar = el.closest("label"); if (sar) p.push(metin(sar));
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
    el.title = `FonRota dolduruldu: ${ad[k] || k}`; el.dataset.fonrota = k;
  }
  function deger(p, k) {
    const v = p[k]; if (v == null || v === "") return "";
    if (k === "yetkili") return v || p.ad || "";
    return String(v);
  }

  window.__fonrota = {
    // Sayfadaki tüm uygun alanları doldurur. ustuneYaz=false ise dolu alanlara dokunmaz.
    doldur(profil, adlar = {}, ustuneYaz = false) {
      const sonuc = { dolan: [], bos: [], tanınmayan: 0 };
      document.querySelectorAll("input, select, textarea").forEach(el => {
        if (!uygun(el)) return;
        const k = alanBul(el);
        if (!k) { if (el.tagName !== "SELECT") sonuc.tanınmayan++; return; }
        if (!ustuneYaz && el.value && el.tagName !== "SELECT") return;
        const v = deger(profil, k);
        if (!v) { sonuc.bos.push(adlar[k] || k); return; }
        if (yaz(el, v)) { isaretle(el, k, adlar); sonuc.dolan.push(adlar[k] || k); }
      });
      sonuc.dolan = [...new Set(sonuc.dolan)]; sonuc.bos = [...new Set(sonuc.bos)];
      return sonuc;
    },
    // Sağ tık menüsü: odaktaki alana seçilen bilgiyi yazar
    alanaYaz(profil, k, adlar = {}) {
      const el = document.activeElement;
      if (!el || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return { hata: "Önce doldurmak istediğin alana tıkla." };
      const v = deger(profil, k); if (!v) return { hata: `Profilinde “${adlar[k] || k}” boş.` };
      return yaz(el, v) ? (isaretle(el, k, adlar), { tamam: true }) : { hata: "Bu alana yazılamadı." };
    }
  };
})();
