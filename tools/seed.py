"""Örnek (temsili) veri üretir: data.json. Gerçek veri scraper/scrape.py ile gelir.
Yalnızca mevcut şirketler ve KOBİ'ler için programlar (öğrenci/araştırmacı programları yok)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = json.loads((ROOT / "scraper/sources.json").read_text(encoding="utf-8"))

KOBI = ["mikro", "kucuk", "orta"]
HEPSI = ["mikro", "kucuk", "orta", "buyuk"]

B_TEMEL = ["Vergi levhası", "Ticaret sicil gazetesi", "İmza sirküleri", "Vergi ve SGK borcu yoktur yazısı"]
B_KOBI = B_TEMEL + ["KOBİ Bilgi Beyannamesi", "Son yıl bilanço ve gelir tablosu"]
B_PROJE = B_KOBI + ["Proje bütçesi", "Proforma faturalar / teklifler"]

A_TEMEL = ["firmaUnvani", "vkn", "vergiDairesi", "yetkili", "telefon", "eposta", "adres", "il", "kurulusYili", "sirketTuru", "naceKodu", "calisan", "ciro"]
A_PROJE = A_TEMEL + ["projeAdi", "projeOzeti", "projeSuresi", "projeButcesi", "talepTutari"]

KOSGEB_BASVURU = {"yontem": "pdf", "form": "forms/kosgeb-ornek-basvuru-formu.pdf", "online": "https://www.kosgeb.gov.tr",
    "adimlar": ["e-Devlet şifrenle KOSGEB e-Hizmetler’e gir", "KOBİ Bilgi Beyannameni güncelle", "Destek programını seç ve başvuru formunu yükle", "Gerekli belgeleri ekleyip başvuruyu tamamla"]}
TEYDEB = {"yontem": "online", "online": "https://eteydeb.tubitak.gov.tr",
    "adimlar": ["TÜBİTAK TEYDEB başvuru sistemine firma yetkilisi olarak gir", "Yeni proje başvurusu oluştur", "Proje önerisi formundaki bölümleri doldur", "Bütçe ve personel bilgilerini girip gönder"]}
TICARET = {"yontem": "online", "online": "https://www.ticaret.gov.tr/ihracat/devlet-destekleri",
    "adimlar": ["Ticaret Bakanlığı destek başvuru sistemine e-Devlet ile gir", "İlgili destek kalemini seç", "Harcama belgelerini yükle", "Başvuruyu ihracatçı birliğine gönder"]}
BILGI = lambda url, adim: {"yontem": "bilgi", "online": url, "adimlar": adim}


def p(id, ad, kurum, url, tur, amac, olcek, ozet, kosullar, belgeler, alanlar, basvuru,
      sektor=("tumu",), il=("tumu",), ust=None, oran=None, yas_max=None, ihracat=False, kredi=None):
    return {"id": id, "ad": ad, "kurum": kurum, "url": url, "tur": tur, "amac": list(amac), "olcek": list(olcek),
            "sektor": list(sektor), "il": list(il), "ust_limit": ust, "destek_orani": oran, "firma_yasi_max": yas_max,
            "ihracat_gerekli": ihracat, "son_basvuru": None, "ozet": ozet, "kosullar": kosullar, "belgeler": belgeler,
            "alanlar": alanlar, "basvuru": basvuru, "kredi": kredi}


K = "https://www.kosgeb.gov.tr"
T = "https://www.tubitak.gov.tr"
TC = "https://www.ticaret.gov.tr"
S = "https://www.sanayi.gov.tr"

items = [
    p("kosgeb-girisimcilik", "Girişimcilik Destek Programı", "KOSGEB", K, "hibe", ["kurulus"], ["mikro", "kucuk"],
      "Yeni kurulmuş işletmelerin kuruluş, makine-teçhizat ve işletme giderlerine hibe ve geri ödemeli destek.",
      ["İşletmenin yeni kurulmuş olması", "Uygulamalı Girişimcilik Eğitimi sertifikası", "İş planı"], B_KOBI + ["Girişimcilik eğitimi sertifikası"],
      A_PROJE, KOSGEB_BASVURU, yas_max=2),
    p("kosgeb-isletme-gelistirme", "İşletme Geliştirme Destek Programı", "KOSGEB", K, "hibe", ["kurulus", "istihdam", "dijital"], KOBI,
      "Nitelikli personel, eğitim, danışmanlık, belgelendirme ve tanıtım giderlerine destek.",
      ["KOSGEB veri tabanına kayıtlı olma", "Güncel KOBİ Bilgi Beyannamesi"], B_KOBI, A_TEMEL, KOSGEB_BASVURU, oran=60),
    p("kosgeb-arge", "Ar-Ge, Ür-Ge ve İnovasyon Destek Programı", "KOSGEB", K, "hibe", ["arge"], KOBI,
      "Yeni ürün, süreç veya hizmet geliştiren KOBİ’lerin personel, malzeme ve makine giderlerine destek.",
      ["Ar-Ge niteliği taşıyan proje", "Proje bütçesi"], B_PROJE, A_PROJE, KOSGEB_BASVURU,
      sektor=["imalat", "bilisim", "enerji", "saglik"], oran=75),
    p("kosgeb-teknoyatirim", "KOBİ Teknolojik Ürün Yatırım Destek Programı", "KOSGEB", K, "kredi", ["yatirim"], ["kucuk", "orta"],
      "Orta-yüksek ve yüksek teknolojili ürünlerin üretimine yönelik yatırımlar için geri ödemeli destek.",
      ["Çağrıda belirtilen ürün listesinde yer alma", "Yatırım projesi ve fizibilite", "Teminat"], B_PROJE + ["Fizibilite raporu"],
      A_PROJE, KOSGEB_BASVURU, sektor=["imalat"], kredi={"vade_ay": 48, "geri_odemesiz_ay": 12, "faiz_yillik": 0}),
    p("kosgeb-tematik", "Tematik Proje Destek Programı", "KOSGEB", K, "hibe", ["yatirim", "dijital", "yesil"], KOBI,
      "Çağrıda belirlenen temalarda (dijital dönüşüm, yeşil dönüşüm vb.) yatırım ve proje giderlerine destek.",
      ["Çağrının temasına uygun proje", "Çağrı süresi içinde başvuru"], B_PROJE, A_PROJE, KOSGEB_BASVURU),
    p("kosgeb-isbirligi", "İş Birliği-Güç Birliği Destek Programı", "KOSGEB", K, "hibe", ["yatirim"], KOBI,
      "En az birkaç işletmenin birlikte yürüttüğü ortak üretim, tedarik veya pazarlama projelerine destek.",
      ["En az 5 işletmenin iş birliği", "Ortak proje"], B_PROJE + ["İş birliği protokolü"], A_PROJE, KOSGEB_BASVURU),
    p("kosgeb-finansman", "KOBİ Finansman Desteği (faiz destekli kredi)", "KOSGEB ve anlaşmalı bankalar", K, "kredi", ["finansman"], KOBI,
      "Banka kredisinin faizinin bir kısmını KOSGEB’in karşıladığı işletme ve yatırım kredisi.",
      ["Bankanın kredi değerlendirmesinden geçme", "Vergi ve SGK borcu olmaması"], B_KOBI, A_TEMEL,
      BILGI(K, ["KOSGEB çağrısını takip et", "Anlaşmalı bankanın şubesine başvur", "Banka onayından sonra KOSGEB onayı beklenir"]),
      kredi={"vade_ay": 24, "geri_odemesiz_ay": 6, "faiz_yillik": 0}),

    p("tubitak-1501", "1501 Sanayi Ar-Ge Projeleri Destekleme Programı", "TÜBİTAK", T, "hibe", ["arge"], HEPSI,
      "Her ölçekten şirketin Ar-Ge projelerine proje bütçesi üzerinden hibe desteği.",
      ["Türkiye’de yerleşik sermaye şirketi", "Ar-Ge niteliği taşıyan proje"], B_PROJE, A_PROJE, TEYDEB, oran=60),
    p("tubitak-1507", "1507 KOBİ Ar-Ge Başlangıç Destek Programı", "TÜBİTAK", T, "hibe", ["arge"], KOBI,
      "İlk kez Ar-Ge projesi yapacak KOBİ’lere yönelik başlangıç desteği.",
      ["Daha önce sınırlı sayıda TÜBİTAK desteği almış olma", "KOBİ tanımına uyma"], B_PROJE, A_PROJE, TEYDEB, oran=75),
    p("tubitak-1505", "1505 Üniversite-Sanayi İşbirliği Destek Programı", "TÜBİTAK", T, "hibe", ["arge"], HEPSI,
      "Şirketlerin üniversite ve araştırma kurumlarıyla birlikte yürüttüğü uygulamalı projelere destek.",
      ["Bir üniversite veya araştırma kurumuyla iş birliği"], B_PROJE + ["İş birliği protokolü"], A_PROJE, TEYDEB),
    p("tubitak-1602", "1602 Patent Destek Programı", "TÜBİTAK", T, "hibe", ["arge"], HEPSI,
      "Şirketlerin yurt içi ve yurt dışı patent başvuru ve tescil masraflarına destek.",
      ["Patent başvurusunun yapılmış olması"], B_TEMEL + ["Patent başvuru belgeleri"], A_TEMEL, TEYDEB),
    p("tubitak-eurostars", "Eurostars / EUREKA Uluslararası Ar-Ge Projeleri", "TÜBİTAK", T, "hibe", ["arge", "ihracat"], HEPSI,
      "Avrupalı ortaklarla yürütülen uluslararası Ar-Ge projelerinin Türk ortağına destek.",
      ["En az bir yabancı ortak", "Uluslararası çağrıda başarılı olma"], B_PROJE, A_PROJE, TEYDEB),

    p("ticaret-pazara-giris", "Pazara Giriş Belgeleri Desteği", "Ticaret Bakanlığı", TC, "hibe", ["ihracat"], HEPSI,
      "İhracat için gereken sertifika, test ve belgelendirme giderlerinin bir kısmının karşılanması.",
      ["İhracatçı birliğine üyelik", "Belge alındıktan sonra süresinde başvuru"], B_TEMEL + ["Harcama belgeleri"], A_TEMEL, TICARET,
      oran=50, ihracat=True),
    p("ticaret-pazar-arastirma", "Yurt Dışı Pazar Araştırması ve Pazara Giriş Desteği", "Ticaret Bakanlığı", TC, "hibe", ["ihracat"], HEPSI,
      "Yeni pazarlar için yurt dışı pazar araştırması, rapor ve ziyaret giderlerine destek.",
      ["İhracatçı birliğine üyelik", "Ziyaret öncesi veya sonrası süresinde başvuru"], B_TEMEL + ["Seyahat ve rapor belgeleri"], A_TEMEL, TICARET,
      oran=60),
    p("ticaret-fuar", "Yurt Dışı Fuar Katılım Desteği", "Ticaret Bakanlığı", TC, "hibe", ["ihracat"], HEPSI,
      "Yurt dışı fuarlarda stand, nakliye ve tanıtım giderlerine destek.",
      ["Destek kapsamındaki fuarlara katılım"], B_TEMEL + ["Fuar katılım belgeleri ve faturalar"], A_TEMEL, TICARET, oran=50),
    p("ticaret-e-ihracat", "E-İhracat Destekleri", "Ticaret Bakanlığı", TC, "hibe", ["ihracat", "dijital"], HEPSI,
      "E-ticaret siteleri üyeliği, dijital pazarlama ve yurt dışı e-ticaret giderlerine destek.",
      ["Desteklenen e-ticaret platformlarına üyelik"], B_TEMEL + ["Üyelik ve reklam faturaları"], A_TEMEL, TICARET, oran=60),
    p("eximbank-sevk-oncesi", "İhracata Hazırlık Kredileri", "Türk Eximbank", "https://www.eximbank.gov.tr", "kredi", ["finansman", "ihracat"], HEPSI,
      "İhracat taahhüdü karşılığında uygun maliyetli işletme kredisi.",
      ["İhracat taahhüdü", "Banka teminat koşulları"], B_KOBI, A_TEMEL,
      BILGI("https://www.eximbank.gov.tr", ["Eximbank veya aracı bankaya başvur", "İhracat taahhüdü ve teminatı belirle"]),
      ihracat=True, kredi={"vade_ay": 12, "geri_odemesiz_ay": 0, "faiz_yillik": 30}),

    p("sanayi-tesvik-belgesi", "Yatırım Teşvik Belgesi", "Sanayi ve Teknoloji Bakanlığı", S, "vergi", ["vergi", "yatirim"], HEPSI,
      "Yatırımlarda KDV istisnası, gümrük muafiyeti ve vergi indirimi gibi ayrıcalıklar.",
      ["Asgari yatırım tutarını aşma", "Teşvik sistemine uygun yatırım konusu"], B_TEMEL + ["Yatırım bilgileri ve makine listesi"], A_PROJE,
      {"yontem": "online", "online": "https://etuys.sanayi.gov.tr", "adimlar": ["E-TUYS sistemine e-imza ile gir", "Yatırım bilgilerini ve makine listesini gir", "Başvuruyu gönder"]},
      sektor=["imalat", "enerji", "turizm", "saglik", "tarim"]),
    p("sanayi-arge-merkezi", "Ar-Ge ve Tasarım Merkezi Teşvikleri", "Sanayi ve Teknoloji Bakanlığı", S, "vergi", ["vergi", "arge"], ["orta", "buyuk"],
      "Ar-Ge ve tasarım merkezi belgesi alan şirketlere gelir vergisi stopajı, SGK prim ve damga vergisi avantajları.",
      ["Asgari Ar-Ge personeli sayısı", "Merkez belgesi başvurusu"], B_KOBI + ["Ar-Ge personel listesi"], A_TEMEL,
      {"yontem": "online", "online": S, "adimlar": ["Ar-Ge merkezi başvuru sistemine gir", "Personel ve faaliyet bilgilerini gir", "Değerlendirme kurulunu bekle"]}),
    p("sanayi-teknopark", "Teknopark Vergi İstisnaları", "Sanayi ve Teknoloji Bakanlığı", S, "vergi", ["vergi", "arge"], HEPSI,
      "Teknoparkta yürütülen Ar-Ge ve yazılım faaliyetlerinden elde edilen kazançlarda vergi ve SGK avantajları.",
      ["Teknopark yönetimine kabul", "Ar-Ge veya yazılım projesi"], B_TEMEL + ["Proje önerisi"], A_PROJE,
      BILGI(S, ["Bölgendeki teknopark yönetimine proje başvurusu yap", "Kabulden sonra teknoparkta ofis aç"]), sektor=["bilisim", "imalat", "saglik", "enerji"]),

    p("tkdk-ipard", "IPARD III Kırsal Kalkınma Hibeleri", "TKDK", "https://www.tkdk.gov.tr", "hibe", ["yatirim", "yesil"], KOBI,
      "Tarım, gıda işleme ve kırsal ekonomiye yönelik yatırımlara AB katkılı hibe.",
      ["Programın uygulandığı illerden birinde yatırım", "Çağrıda belirtilen tedbir kapsamında proje"], B_PROJE + ["İş planı"], A_PROJE,
      {"yontem": "online", "online": "https://www.tkdk.gov.tr", "adimlar": ["TKDK başvuru sistemine kaydol", "Tedbiri seç ve iş planını yükle", "İl koordinatörlüğüne başvuruyu teslim et"]},
      sektor=["tarim"], oran=65),
    p("tarim-kkydp", "Kırsal Kalkınma Yatırımlarının Desteklenmesi (KKYDP)", "Tarım ve Orman Bakanlığı", "https://www.tarimorman.gov.tr", "hibe", ["yatirim"], KOBI,
      "Tarımsal ürünlerin işlenmesi, depolanması ve paketlenmesine yönelik yatırımlara hibe.",
      ["Kırsal alanda yatırım", "İl müdürlüğü çağrısına başvuru"], B_PROJE, A_PROJE,
      BILGI("https://www.tarimorman.gov.tr", ["İl Tarım ve Orman Müdürlüğü’nün çağrısını takip et", "Proje dosyasını il müdürlüğüne teslim et"]), sektor=["tarim"], oran=50),

    p("sgk-5-puan", "5 Puanlık SGK İşveren Prim Teşviki", "SGK", "https://www.sgk.gov.tr", "vergi", ["istihdam", "vergi"], HEPSI,
      "Primlerini zamanında ödeyen işverenlerin prim yükünde indirim.",
      ["Vergi ve SGK borcu olmaması", "Primlerin zamanında ödenmesi"], ["SGK işyeri sicil bilgileri"], A_TEMEL,
      BILGI("https://www.sgk.gov.tr", ["Mali müşavirin aylık prim bildiriminde ilgili teşvik kodunu seçer"])),
    p("sgk-ilave-istihdam", "İlave İstihdam Teşviki", "SGK / İŞKUR", "https://www.sgk.gov.tr", "vergi", ["istihdam", "vergi"], HEPSI,
      "İşsizler arasından yapılan yeni işe alımlarda işveren prim maliyetinin karşılanması.",
      ["İşe alınan kişinin İŞKUR’a kayıtlı işsiz olması", "Ortalama çalışan sayısına ilave olması"], ["SGK işyeri sicil bilgileri", "İşe giriş bildirgeleri"], A_TEMEL,
      BILGI("https://www.sgk.gov.tr", ["Yeni çalışanı İŞKUR kaydından seç", "Mali müşavir teşviki bildirgede tanımlar"])),
    p("iskur-iep", "İşbaşı Eğitim Programı", "İŞKUR", "https://www.iskur.gov.tr", "hibe", ["istihdam"], HEPSI,
      "Yeni personeli işbaşında eğitirken katılımcının giderlerinin İŞKUR tarafından karşılanması.",
      ["En az 2 sigortalı çalışan", "Program sonrası istihdam taahhüdü"], B_TEMEL, A_TEMEL,
      {"yontem": "online", "online": "https://www.iskur.gov.tr", "adimlar": ["İŞKUR işveren sistemine gir", "İşbaşı eğitim programı talebi oluştur", "İş ve meslek danışmanınla görüş"]}),

    p("kgf-kefalet", "Kredi Garanti Fonu Kefaleti", "Kredi Garanti Fonu", "https://www.kgf.com.tr", "kredi", ["finansman"], HEPSI,
      "Teminatı yetersiz işletmelerin banka kredilerine KGF’nin kefil olması.",
      ["Banka kredi değerlendirmesi", "Teminat eksikliği"], B_KOBI, A_TEMEL,
      BILGI("https://www.kgf.com.tr", ["Bankana KGF kefaletli kredi talep et", "Banka başvuruyu KGF’ye iletir"]),
      kredi={"vade_ay": 36, "geri_odemesiz_ay": 6, "faiz_yillik": 35}),
    p("ab-eic-accelerator", "EIC Accelerator (Avrupa Ufuk Programı)", "Avrupa Komisyonu / TÜBİTAK Ulusal İrtibat", "https://eic.ec.europa.eu", "hibe", ["arge", "ihracat"], KOBI,
      "Çığır açan yenilikleri olan KOBİ’lere hibe ve öz sermaye yatırımı.",
      ["Yüksek riskli ve yüksek etkili yenilik", "İngilizce proje önerisi"], B_PROJE, A_PROJE,
      {"yontem": "online", "online": "https://eic.ec.europa.eu", "adimlar": ["EU Funding & Tenders portalında hesap aç", "Kısa başvuruyu gönder", "Tam başvuruya davet edilirsen proje önerisini hazırla"]},
      sektor=["bilisim", "saglik", "enerji", "imalat"]),
]

for a in SRC["ajanslar"]:
    items.append(p(f"{a['id']}-mali-destek", f"{a['kurum']} Mali Destek Programı", a["kurum"], a["url"], "hibe", ["bolgesel", "yatirim"], KOBI,
        "Bölgedeki işletmelerin rekabet gücünü, üretimini ve istihdamını artıran projelere eş finansmanlı hibe.",
        ["Faaliyet yerinin ajansın bölgesinde olması", "Eş finansmanın karşılanması", "Çağrı rehberine uygun proje"], B_PROJE, A_PROJE,
        {"yontem": "online", "online": a["url"], "adimlar": ["Ajansın güncel çağrı rehberini oku", "KAYS (Kalkınma Ajansları Yönetim Sistemi) üzerinden başvuru oluştur", "Islak imzalı belgeleri ajansa teslim et"]},
        il=a["il"], oran=50))

out = {"guncelleme": "2026-11-03T07:00", "ornek": True, "destekler": items}
(ROOT / "data.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(items), "kayıt")
