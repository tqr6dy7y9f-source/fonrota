/*! FonRota — © 2026 [Ad Soyad]. Tüm hakları saklıdır. İzinsiz kopyalanamaz ve dağıtılamaz. */
// Yapay zekâ görev tanımları. Hem tarayıcı (önizleme) hem sunucu (api/ai.js) aynı metinleri kullanır.
(function (root) {
  const SEKTORLER = "imalat, tarim, bilisim, turizm, enerji, saglik, ticaret, hizmet, insaat, lojistik";
  const AMACLAR = "yatirim (makine/tesis), arge, dijital, ihracat, istihdam, finansman (kredi), vergi, yesil (enerji verimliliği), kurulus (kuruluş ve büyüme), bolgesel";
  const PROMPTS = {
    analiz: d => `Bir Türk KOBİ danışmanısın. Aşağıda bir işletmenin kendi iş tanımı var.
İş tanımı: """${String(d.metin).slice(0, 1500)}"""

Sadece şu JSON'u döndür, başka hiçbir şey yazma:
{"ozet": "işi 1 cümlede, sade Türkçe",
 "sektorler": [en fazla 2 tane, yalnızca şu anahtarlardan: ${SEKTORLER}],
 "amaclar": [işletmenin muhtemel destek ihtiyaçları, 2-4 tane, yalnızca şu anahtarlardan: ${AMACLAR.replace(/ \([^)]*\)/g, "")}],
 "nace_onerisi": "en olası 4 haneli NACE kodu ve adı, emin değilsen boş bırak",
 "ipucu": "başvurularda öne çıkarılması gereken tek bir güçlü yön, 1 cümle"}`,

    yorum: d => `Bir Türk KOBİ danışmanısın. İşletme profili ve uygun bulunan devlet destekleri aşağıda.
Profil: ${JSON.stringify(d.profil)}
Destekler: ${JSON.stringify(d.destekler)}

İşletme için en mantıklı 3 desteği seç. Sadece şu JSON'u döndür:
{"giris": "2 cümlelik sade özet: bu işletme için hangi tür destekler öne çıkıyor",
 "oneriler": [{"id": "destek id", "neden": "1 cümle, bu işletmeye neden uygun"}]}
Kesin tutar veya tarih uydurma; yalnızca verilen bilgiyi kullan.`,

    proje_ozeti: d => `Bir Türk KOBİ danışmanısın. Aşağıdaki işletme "${d.destek.ad}" (${d.destek.kurum}) programına başvuracak.
Profil: ${JSON.stringify(d.profil)}
Programın amacı: ${d.destek.ozet}

Başvuru formundaki "Proje özeti" alanı için 90-120 kelimelik, resmi ama sade Türkçe bir taslak yaz.
Amaç, yapılacak faaliyetler ve beklenen sonuçlar (istihdam, kapasite, verimlilik gibi) yer alsın.
Rakam uydurma; bilinmeyen yerleri [köşeli parantez] ile bırak. Sadece metni yaz.`,

    rapor_giris: d => `Bir Türk KOBİ danışmanısın. Aşağıdaki işletme için hazırlanan başvuru özet raporuna 3-4 cümlelik bir giriş paragrafı yaz.
Profil: ${JSON.stringify(d.profil)}
Seçilen destekler: ${JSON.stringify(d.destekler)}
Sade, resmi Türkçe kullan. Rakam uydurma. Sadece paragrafı yaz.`
  };
  if (typeof module !== "undefined" && module.exports) module.exports = PROMPTS;
  else root.PROMPTS = PROMPTS;
})(typeof window !== "undefined" ? window : globalThis);
