// Site ayarları. Boş bırakılan servisler "demo modunda" çalışır:
// hesaplar ve bildirimler tarayıcıda saklanır, AI yerine kural tabanlı analiz kullanılır.
window.CONFIG = {
  SITE_ADI: "FonRota",
  // Sitenin sahibi: telif notlarında, sayfa üst bilgisinde (görünmez) ve indirilen PDF'lerin dosya bilgilerinde kullanılır.
  // Değiştirince "python tools/imza.py" çalıştırın; HTML sayfalarındaki görünmez telif bilgisi de güncellenir.
  SAHIP: "[Ad Soyad]",
  // Supabase (hesaplar, kayıtlı başvurular, bildirimler) – supabase.com > Project Settings > API
  // Hesaplar ve profiller Supabase'de tutulur; tarayıcıda yalnızca oturum anahtarı kalır.
  // Supabase'i durdurursan iki değeri boş bırak (""): site "demo modunda" çalışır, hesaplar ziyaretçinin tarayıcısında saklanır.
  SUPABASE_URL: "https://gebuzyferpvlzturxoyu.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_pI798Yv3sQ47VMbJE7yuhw_-y-ct6TF",
  // AI uç noktası (api/ai.js Vercel'e yüklendiğinde): ör. "/api/ai"
  AI_ENDPOINT: "",
  // Web Push için VAPID açık anahtarı (npx web-push generate-vapid-keys)
  VAPID_PUBLIC_KEY: "",
  // KOBİ tanımı – 7 Ağustos 2025 tarihli Resmî Gazete değişikliği (çalışan sayısı ve ciro/bilanço üst sınırları, TL)
  KOBI_SINIRLARI: [
    { olcek: "mikro", calisan: 10,  mali: 10000000 },
    { olcek: "kucuk", calisan: 50,  mali: 100000000 },
    { olcek: "orta",  calisan: 250, mali: 1000000000 }
  ]
};
