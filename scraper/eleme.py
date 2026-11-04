"""
Kurum sitelerinden (KOSGEB, TÜBİTAK, kalkınma ajansları...) toplanan bağlantılardan yalnızca gerçek
destek programı / çağrı sayfalarını ayırır. Menü sayfaları, haberler, toplantı duyuruları ve sonuç
ilanları elenir. Emin olunamayan sayfa alınmaz.
"""
import re

HABER = ["haber", "toplantı", "ziyaret", "çalıştay", "sonuç", "açıklandı", "gerçekleştir", "tamamlandı", "hakkında",
         "tören", "imza", "kazanan", "bülten", "ihale", "staj", "seminer", "eğitimi düzenlen", "bilgilendirme",
         "değerlendirme", "faaliyet raporu", "çalışma programı", "bütçesi", "istişare", "heyet", "ziyaretçi",
         "basın", "röportaj", "katıldı", "düzenlendi", "yapıldı", "ödül", "yarışma", "anket", "rehber", "sıkça sorulan",
         "mevzuat", "yönetmelik", "kanun", "genelge", "tebliğ", "iletişim", "insan kaynakları", "personel alım",
         "iş ilanı", "kariyer", "ofisi", "destek ofisi", "yatırım destek ofisi", "proje sonrası", "izleme",
         "avans talebi", "ödeme talebi", "sözleşme imza", "başarı hikaye", "gelişen", "hasadı", "lokum", "tanıtım filmi",
         "üniversite", "lisans", "öğrenci", "burs", "okul", "covid", "covıd", "projesi eğitim"]
GENEL = {"destekler", "destek", "desteklerimiz", "ajans destekleri", "fonlar ve destekler", "destek programları",
         "güncel destek programları", "mali destekler", "destekler hakkında", "teşvikler", "hibe programları",
         "programlar", "dış kaynaklı fonlar", "güncel çağrılar", "çağrılar", "açık çağrılar", "teknik destek",
         "fonlar", "yatırım teşvikleri", "programlarımız", "kredi ürünleri", "krediler", "ürünler", "hizmetler",
         "proje destekleri", "devlet destekleri", "ikili proje destekleri"}
PROGRAM = ["program", "çağrı", "destek", "hibe", "kredi", "fon", "teşvik"]


def low(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


HABER_FIIL = ["başladı", "uzatıldı", "yayınlandı", "yayımlandı", "tanıtılacak", "tanıtıldı", "listesi", "listeleri",
              "seçilen", "başvurusu", "proje başvurusu", "duyurusu", "ilan edildi", "hamlesi başlıyor", "ön inceleme",
              "sıralama", "evrak seti", "ödeme planı", "derecelendirme", "arşiv", "türleri", "genel bilgi", "plan ve program",
              "ölçekli plan", "orta vadeli", "desteklenen sektörler", "yürürlükten", "toplam", "miktarı", "personeli",
              "davet", "etkinlik", "atölye", "elçileri", "keşfet"]
# Bir programın adı gibi biten başlıklar: "... Destek Programı", "... Çağrısı", "... Kredisi" vb.
AD_SONU = re.compile(r"(programı|çağrısı|çağrı ilanı|desteği|destekleri|kredisi|kredileri|teşviki|teşvikleri|hibe programları?|finansmanı|fonu|sigortası|mali destek programı)(\s*\(.*\))?(\s*devamı için)?$")


def is_program(title, son_basvuru=None, bugun=None):
    """Başlık bir destek programı/çağrısı mı? (haber, menü, genel liste sayfası değil)"""
    t = re.sub(r"[…\.]+$", "", low(" ".join(title.split()))).strip()
    if len(t) < 12 or t in GENEL: return False
    if any(w in t for w in HABER): return False
    if not any(w in t for w in PROGRAM): return False
    if re.match(r"^\d{1,2}\s+[a-zçğıöşü]{3}\b", t): return False          # "10 EYL Haber ..." gibi tarih başlıklı haberler
    if any(w in t for w in HABER_FIIL): return False
    yillar = [int(y) for y in re.findall(r"\b(20\d\d)\b", t)]
    if bugun and yillar and max(yillar) < int(bugun[:4]): return False        # "2023 Yılı ... Programı" gibi eski çağrılar
    if son_basvuru and bugun and son_basvuru < bugun: return False
    t = re.sub(r"\s*devamı için$", "", t)
    return bool(AD_SONU.search(t))


def benzer(a, b):
    """İki program adı aynı programı mı anlatıyor? (tekil/çoğul, ek kelimeler farkını tolere eder)"""
    def kok(t):
        t = re.sub(r"\s*devamı için$", "", low(t))
        n = re.search(r"\b(1\d{3}|2\d{3}|3\d{3}|4\d{3})\b", t)
        w = {re.sub(r"(leri|ları|ları|lar|ler|si|sı|i|ı)$", "", x) for x in re.findall(r"[a-zçğıöşü0-9]+", t) if len(x) > 2}
        return (n[1] if n else None), w - {"program", "destek", "türk", "tübitak", "kosgeb", "ve", "ile", "için"}
    (na, wa), (nb, wb) = kok(a), kok(b)
    if na and nb: return na == nb
    if not wa or not wb: return False
    return len(wa & wb) / min(len(wa), len(wb)) >= 0.75
