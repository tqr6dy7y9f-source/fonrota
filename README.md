# Destek Bulucu

Mevcut şirketlerin ve KOBİ'lerin kendilerine uygun hibe, kredi ve teşvikleri bulmasını, başvuru formlarını otomatik doldurmasını ve yeni desteklerden anında haberdar olmasını sağlayan site.

## Klasörler
| Yol | İçerik |
|---|---|
| `*.html` | Sayfalar: ana sayfa, tüm destekler, uygunluk testi (bul), sonuçlar, destek, başvuru, rapor, hesap |
| `assets/core.js` | Veri, uygunluk, KOBİ ölçeği, yapay zekâ, PDF doldurma ve rapor |
| `assets/pages.js` | Sayfaların davranışı, zihin haritası, tanıtım animasyonu |
| `config.js` | Servis anahtarları ve KOBİ sınırları (7.8.2025 Resmî Gazete) |
| `data.json` | Destekler (her sabah toplayıcı günceller) |
| `forms/` | İndirilen başvuru formları; `forms/maps/` alan eşlemeleri |
| `scraper/` | `scrape.py` (toplayıcı), `notify.py` (bildirim), `sources.json` (kaynaklar) |
| `api/ai.js` | Yapay zekâ uç noktası (Vercel) |
| `supabase/schema.sql` | Hesap, başvuru ve bildirim tabloları |
| `video/tanitim.mp4` | 60 saniyelik tanıtım videosu |
| `tools/` | `seed.py` (örnek veri), `build.py` (sayfalar + önizleme), `record_video.py` |

## Yayına alma
1. Klasörü GitHub'a yükle.
2. **Vercel**: GitHub deposunu bağla (site + `api/ai.js`). Environment Variables: `ANTHROPIC_API_KEY`. `config.js` içinde `AI_ENDPOINT: "/api/ai"` yap.
3. **Supabase**: proje aç, `supabase/schema.sql`'i SQL Editor'de çalıştır. URL ve anon key'i `config.js`'e yaz.
4. **Anlık bildirim**: `npx web-push generate-vapid-keys` → public key `config.js`'e, private key GitHub Secrets'a.
5. **E-posta**: Resend hesabı aç, alan adını doğrula.
6. GitHub > Settings > Secrets > Actions: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `SITE_URL`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
7. Actions > "Destekleri güncelle ve bildir" > Run workflow. İlk çalıştırmanın logunda erişilemeyen kaynak adreslerini `sources.json`'da düzelt.

Servisler bağlanmadan site **demo modunda** çalışır: hesaplar tarayıcıda saklanır, yapay zekâ yerine anahtar kelime analizi kullanılır.

## Sürüm numarası (önbellek)
Her sayfada CSS/JS bağlantılarının sonunda `?v=YYYYAAGGSSDD` var (ör. `assets/core.js?v=202611040752`).
Bu numara değişince ziyaretçilerin tarayıcısı yeni dosyayı indirir; değişmezse eski tasarım görünmeye devam edebilir.
`assets/` altındaki bir dosyayı veya `config.js`'i değiştirdikten sonra, yayına göndermeden önce:

    python tools/surum.py

`tools/build.py` artık sayfaları yeniden üretmez (içindeki kopya eski; üretirse son değişiklikleri siler), yalnızca `dist/onizleme.html` üretir.

## Veri kaynağı
- `scraper/yatirimadestek.py`: Sanayi ve Teknoloji Bakanlığı Destekler Platformu'ndaki (yatirimadestek.gov.tr) açık programları ve resmi özet bilgi formlarını **değiştirmeden** alır. Sitede yalnızca bu kayıtlar (ve `scraper/manual.json`'daki doğrulanmış kayıtlar) yayımlanır.
- Destek oranı yalnızca kesin kalıplardan ("%X oranında desteklenir", "destek oranı %X") okunur; üst limit otomatik çıkarılmaz (resmi metinde okunur).
- Güncelleme: her pazartesi 07:00 (Türkiye saati), GitHub Actions ile. Elle: Actions > "Destekleri güncelle ve bildir" > Run workflow.

## Önemli notlar
- `data.json` Destekler Platformu'ndan gelen gerçek kayıtlardır. Doğrulanmış kayıtları `scraper/manual.json`'a koy; otomatik kaydın üzerine yazar.
- `forms/kosgeb-ornek-basvuru-formu.pdf` test için üretilmiş örnek formdur. Gerçek formların alan adları farklıysa `forms/maps/<form-adı>.json` ile eşle (`{"pdf_alan_adi": "firmaUnvani"}`).
- Taranmış (doldurulamaz) PDF'lerde bilgiler forma ek sayfa olarak eklenir.
- Yerelde deneme: `python -m http.server` → http://localhost:8000
