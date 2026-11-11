"""
FonRota – haftalık veri toplayıcı.

Her kaynağın liste sayfasını açar, destek/çağrı ilanlarına giden bağlantıları bulur,
her ilanın sayfasından metni okuyup alanları (tür, ölçek, sektör, tarih, tutar, oran)
basit kurallarla çıkarır ve sonuçları ../data.json dosyasına yazar.

manual.json içindeki kayıtlar elle doğrulanmış bilgidir ve aynı id'li otomatik
kaydın üzerine yazılır (otomatik çıkarımın hatalı kaldığı yerleri düzeltmek için).

Kapsam: şimdilik yalnızca mevcut şirketler ve KOBİ'ler. Öğrenci, burs ve akademik
araştırmacı programları atlanır. İlan sayfasındaki başvuru formu PDF'leri forms/ klasörüne
indirilir; site bu formları kullanıcının bilgileriyle doldurur.
Yeni eklenen ilanların id'leri new_ids.json'a yazılır (notify.py bildirim gönderir).
"""
import hashlib, json, re, time
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib import robotparser

import requests
from bs4 import BeautifulSoup

import eleme
import duzeltme
from yatirimadestek import ratios, tur_bul, AMAC_KURALLARI as PLATFORM_AMAC

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "data.json"
FORMS = ROOT.parent / "forms"
NEW_IDS = ROOT / "new_ids.json"
MAX_PDF = 10 * 1024 * 1024
UA = "FonRota/1.0 (OMU universite projesi; +https://tqr6dy7y9f-source.github.io/fonrota/)"
DELAY = 1.5          # saniye: kaynak sitelere nazik davranmak için
MAX_LINKS = 40       # kaynak başına en fazla ilan sayfası

LINK_WORDS = ["destek", "program", "çağrı", "hibe", "kredi", "teşvik", "fon", "başvuru", "mali destek"]
HARIC = ["öğrenci", "burs", "akademisyen", "araştırmacı", "lisansüstü", "doktora", "lise", "üniversite öğrenci", "stajyer"]

AYLAR = {"ocak": 1, "şubat": 2, "mart": 3, "nisan": 4, "mayıs": 5, "haziran": 6,
         "temmuz": 7, "ağustos": 8, "eylül": 9, "ekim": 10, "kasım": 11, "aralık": 12}

TUR_KURALLARI = [
    ("kredi", ["kredi", "geri ödemeli", "faiz desteği", "finansman"]),
    ("vergi", ["vergi", "istisna", "muafiyet", "teşvik belgesi", "sgk prim"]),
    ("hibe",  ["hibe", "geri ödemesiz", "mali destek", "destek oranı"]),
]
OLCEK_KURALLARI = {
    "mikro":  ["mikro", "kobi", "küçük ve orta"],
    "kucuk":  ["küçük ölçekli", "küçük işletme", "kobi", "küçük ve orta"],
    "orta":   ["orta ölçekli", "orta büyüklükte", "kobi", "küçük ve orta"],
    "buyuk":  ["büyük ölçekli", "büyük işletme", "tüm işletmeler", "her ölçekten", "sermaye şirketleri"],
}
AMAC_KURALLARI = {
    "yatirim": ["makine", "teçhizat", "yatırım", "kapasite", "tesis"],
    "arge": ["ar-ge", "inovasyon", "ür-ge", "patent", "teknoloji geliştirme"],
    "dijital": ["dijital", "yazılım", "e-ticaret", "otomasyon"],
    "ihracat": ["ihracat", "yurt dışı", "fuar", "pazara giriş"],
    "istihdam": ["istihdam", "personel", "eğitim", "işbaşı"],
    "finansman": ["kredi", "faiz", "finansman", "kefalet"],
    "vergi": ["vergi", "istisna", "sgk prim", "muafiyet"],
    "yesil": ["enerji verimliliği", "yeşil", "yenilenebilir", "karbon", "atık"],
    "kurulus": ["yeni kurulan", "girişimcilik", "kuruluş"],
}
B_TEMEL = ["Vergi levhası", "Ticaret sicil gazetesi", "İmza sirküleri", "Vergi ve SGK borcu yoktur yazısı"]
A_TEMEL = ["firmaUnvani", "vkn", "vergiDairesi", "yetkili", "telefon", "eposta", "adres", "il", "kurulusYili", "sirketTuru", "naceKodu", "calisan", "ciro"]
A_PROJE = A_TEMEL + ["projeAdi", "projeOzeti", "projeSuresi", "projeButcesi", "talepTutari"]
SEKTOR_KURALLARI = {
    "imalat":   ["imalat", "üretim", "sanayi", "makine"],
    "tarim":    ["tarım", "gıda", "hayvancılık", "kırsal"],
    "bilisim":  ["yazılım", "bilişim", "dijital", "teknoloji"],
    "turizm":   ["turizm", "konaklama"],
    "enerji":   ["enerji", "yenilenebilir", "verimlilik"],
    "ihracat":  ["ihracat", "dış ticaret", "yurt dışı pazar"],
    "saglik":   ["sağlık", "tıbbi"],
}

session = requests.Session()
session.headers["User-Agent"] = UA


_ROBOTS = {}


def allowed(url: str) -> bool:
    """robots.txt kurallarına uy (her site için bir kez okunur)."""
    p = urlparse(url); host = f"{p.scheme}://{p.netloc}"
    if host not in _ROBOTS:
        rp = robotparser.RobotFileParser()
        try:
            r = session.get(host + "/robots.txt", timeout=10)
            rp.parse(r.text.splitlines() if r.ok else [])
        except Exception:
            rp.parse([])
        _ROBOTS[host] = rp
    return _ROBOTS[host].can_fetch(UA, url)


def get(url: str):
    if not allowed(url):
        print("  robots.txt izin vermiyor:", url)
        return None
    try:
        r = session.get(url, timeout=15)
        r.raise_for_status()
        r.encoding = r.apparent_encoding or "utf-8"
        time.sleep(DELAY)
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print("  hata:", url, e)
        return None


def low(s: str) -> str:
    """Türkçe uyumlu küçük harf (I→ı, İ→i)."""
    return s.replace("I", "ı").replace("İ", "i").lower()


def find_links(soup, base):
    host = urlparse(base).netloc
    seen, links = set(), []
    for a in soup.find_all("a", href=True):
        text = " ".join(a.get_text(" ").split())
        url = urljoin(base, a["href"]).split("#")[0]
        if urlparse(url).netloc != host or url in seen or len(text) < 8:
            continue
        if any(w in low(text) for w in LINK_WORDS):
            seen.add(url)
            links.append((text, url))
    return links[:MAX_LINKS]


def parse_dates(text):
    out = []
    for d, m, y in re.findall(r"\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b", text):
        try: out.append(date(int(y), int(m), int(d)))
        except ValueError: pass
    for d, ay, y in re.findall(r"\b(\d{1,2})\s+(" + "|".join(AYLAR) + r")\s+(20\d{2})", low(text)):
        try: out.append(date(int(y), AYLAR[ay], int(d)))
        except ValueError: pass
    return out


def deadline(text):
    """'son başvuru' ifadesine en yakın tarihi; yoksa gelecekteki en geç tarihi al."""
    t = low(text)
    i = t.find("son başvuru")
    if i >= 0:
        near = parse_dates(text[i:i + 160])
        if near:
            return near[0].isoformat()
    future = [d for d in parse_dates(text) if d >= date.today()]
    return max(future).isoformat() if future else None


def amount(text):
    """En büyük TL tutarını bul ('1,5 milyon TL', '750.000 TL' vb.)."""
    best = 0
    for num, unit in re.findall(r"(\d[\d.,]*)\s*(milyon|bin)?\s*(?:tl|₺|türk lirası)", low(text)):
        try:
            v = float(num.replace(".", "").replace(",", "."))
        except ValueError:
            continue
        v *= 1_000_000 if unit == "milyon" else 1_000 if unit == "bin" else 1
        best = max(best, v)
    return int(best) or None


def ratio(text):
    m = re.findall(r"%\s?(\d{2,3})|yüzde\s+(\d{2,3})", low(text))
    vals = [int(a or b) for a, b in m if 0 < int(a or b) <= 100]
    return max(vals) if vals else None


def match_rules(t, rules, default):
    found = [k for k, words in rules.items() if any(w in t for w in words)]
    return found or default


def download_forms(soup, url, item_id):
    """İlan sayfasındaki başvuru formu PDF'lerini indir; ilk uygun formun yolunu döndür."""
    for a in soup.find_all("a", href=True):
        link = urljoin(url, a["href"])
        text = low(a.get_text(" ") + " " + link)
        if not link.lower().split("?")[0].endswith(".pdf") or not any(w in text for w in ["form", "başvuru", "basvuru", "ek-"]):
            continue
        try:
            r = session.get(link, timeout=30)
            if r.ok and r.content[:4] == b"%PDF" and len(r.content) < MAX_PDF:
                FORMS.mkdir(exist_ok=True)
                path = FORMS / f"{item_id}.pdf"
                path.write_bytes(r.content)
                time.sleep(DELAY)
                return f"forms/{path.name}"
        except Exception as e:
            print("  form indirilemedi:", link, e)
    return None


def page_text(soup):
    """Sayfanın ana içeriğindeki paragraf ve maddeler, değiştirilmeden (en fazla ~2000 karakter)."""
    root = soup.find("main") or soup.find("article") or soup.find(class_=re.compile("content|icerik|detay", re.I)) or soup.body or soup
    parts, n = [], 0
    for el in root.find_all(["p", "li", "h2", "h3"]):
        t = " ".join(el.get_text(" ").split())
        if len(t) < 30 or t in parts: continue
        parts.append(("• " if el.name == "li" else "") + t); n += len(t)
        if n > 2000: break
    if not parts:  # içerik <p>/<li> yerine <div> içinde: satır satır al
        for tag in root(["script", "style", "nav", "header", "footer", "aside", "form"]):
            tag.decompose()
        for line in root.get_text("\n").split("\n"):
            t = " ".join(line.split())
            if len(t) < 40 or t in parts: continue
            parts.append(t); n += len(t)
            if n > 2000: break
    return "\n".join(parts)


def parse_item(title, url, src):
    if any(w in low(title) for w in HARIC) or not eleme.is_program(title, None, date.today().isoformat()):
        return None
    soup = get(url)
    if not soup:
        return None
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = " ".join(soup.get_text(" ").split())
    t = low(title + " " + text)
    metin = page_text(soup)
    tur = tur_bul(title, metin)
    oran = ratios(metin)
    paras = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    ozet = next((p for p in paras if len(p) > 80), text[:300])[:300]
    if any(w in low(title + " " + text[:400]) for w in HARIC) and "işletme" not in t:
        return None
    item_id = src["id"] + "-" + hashlib.md5(url.encode()).hexdigest()[:8]
    form = download_forms(soup, url, item_id)
    yontem = "pdf" if form else src.get("basvuru", "online")
    return {
        "id": item_id,
        "ad": re.sub(r"\s*(devamı için|…|\.\.\.)$", "", title.strip())[:140],
        "kurum": src["kurum"],
        "url": url,
        "tur": tur,
        "ust_limit": None,                        # tahmin yok: resmi metinde okunur
        "destek_orani": oran[0] if oran else None,
        "oran_metin": f"%{oran[0]}–%{oran[-1]}" if len(oran) > 1 else None,
        # hedef: program adı ve sayfanın ilk paragrafından (tüm sayfadaki tek bir kelimeden değil)
        "amac": (["bolgesel"] if src.get("ajans") else []) + (match_rules(low(title + " " + metin[:300]), PLATFORM_AMAC, []) or (["bolgesel"] if src.get("ajans") else ["yatirim"])),
        "olcek": ["mikro", "kucuk", "orta"] if "kobi" in low(metin) and "büyük" not in low(metin) else ["mikro", "kucuk", "orta", "buyuk"],
        "sektor": ["tumu"],                       # sektör şartı tahmin edilmez
        "il": src.get("il", ["tumu"]),            # kalkınma ajansları için bölgesi (sources.json)
        "son_basvuru": None,                      # sayfadaki tarihler güvenilir değil (haber/menü tarihleri)
        "ozet": ozet,
        "firma_yasi_max": None,
        "ihracat_gerekli": "ihracatçı" in t and "birlik" in t,
        "kosullar": [],
        "belgeler": [],
        "sayfa": {"kaynak": src["kurum"], "url": url, "kontrol": date.today().isoformat(), "metin": metin},
        "alanlar": A_PROJE if tur == "hibe" else A_TEMEL,
        "basvuru": {"yontem": yontem, "form": form, "online": src["url"], "adimlar": []},
        "kredi": None,
        "kaynak": "kurum-sitesi",
    }


def main():
    cfg = json.loads((ROOT / "sources.json").read_text(encoding="utf-8"))
    sources = cfg["kurumlar"] + [{**a, "ajans": True, "basvuru": "online"} for a in cfg["ajanslar"]]
    old_ids = set()
    if OUT.exists():
        try: old_ids = {i["id"] for i in json.loads(OUT.read_text(encoding="utf-8"))["destekler"]}
        except Exception: pass
    items = {}
    for src in sources:
        print("Kaynak:", src["kurum"], src["url"])
        soup = get(src["url"])
        if not soup:
            continue
        for title, url in find_links(soup, src["url"]):
            item = parse_item(title, url, src)
            if item:
                items[item["id"]] = item

    # Destekler Platformu (yatirimadestek.py): resmi özet bilgi formlarıyla en güvenilir kaynak.
    # Aynı programın kurum sitesinden otomatik çıkarılmış kopyasını platform kaydıyla değiştir.
    platform_path = ROOT / "platform.json"
    if platform_path.exists():
        def key(t):
            n = re.search(r"\b(1\d{3}|2\d{3})\b", t)
            return n[1] if n else re.sub(r"[^a-zçğıöşü0-9]", "", low(t))[:40]
        plat = json.loads(platform_path.read_text(encoding="utf-8"))
        keys = {key(p["ad"]) for p in plat}
        items = {k: v for k, v in items.items() if key(v["ad"]) not in keys}
        # Kurum sitelerinden gelen kayıtlar: platformda (açık ya da kapalı) olan programın kopyasını alma,
        # aynı programı iki kez alma (ör. 1501 hem TÜBİTAK hem KOSGEB sitesinde).
        kp = ROOT / "platform_kapali.json"
        kapali = json.loads(kp.read_text(encoding="utf-8")) if kp.exists() else []
        tum = [p["ad"] for p in plat] + kapali
        site = []
        for v in items.values():
            if any(eleme.benzer(v["ad"], a) for a in tum): continue
            if any(eleme.benzer(v["ad"], o["ad"]) for o in site): continue
            site.append(v)
        items = {v["id"]: v for v in site}
        for p in plat:
            items[p["id"]] = p
        print(len(plat), "program Destekler Platformu'ndan,", len(site), "program kurum sitelerinden eklendi")

    manual_path = ROOT / "manual.json"
    if manual_path.exists():
        for m in json.loads(manual_path.read_text(encoding="utf-8")):
            m["kaynak"] = "dogrulanmis"
            items[m["id"]] = {**items.get(m["id"], {}), **m}

    # Resmi belgeden elle doğrulanmış kapsam düzeltmeleri (ör. özet formu olmayan bölgesel programlar)
    print(duzeltme.uygula(list(items.values())), "elle doğrulanmış düzeltme uygulandı")

    today = date.today().isoformat()
    active = [i for i in items.values() if not i.get("son_basvuru") or i["son_basvuru"] >= today]

    # Kaynaklara ulaşılamazsa eski veriyi silme
    if not active and OUT.exists():
        print("Yeni kayıt yok, mevcut data.json korunuyor.")
        return
    OUT.write_text(json.dumps({
        "guncelleme": datetime.now().isoformat(timespec="minutes"),
        "ornek": False,
        "destekler": sorted(active, key=lambda i: i.get("son_basvuru") or "9999"),
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    # Artık hiçbir kaydın kullanmadığı indirilmiş formları sil
    used = {i["basvuru"].get("form") for i in active} | {f["dosya"] for i in active for f in (i["basvuru"].get("formlar") or [])}
    for f in [*FORMS.glob("*.pdf"), *FORMS.glob("*.docx")]:
        if f"forms/{f.name}" not in used and not f.name.startswith("kosgeb-ornek"):
            f.unlink()
    new_ids = [i["id"] for i in active if i["id"] not in old_ids] if old_ids else []
    NEW_IDS.write_text(json.dumps(new_ids), encoding="utf-8")
    print(f"{len(active)} aktif destek yazıldı, {len(new_ids)} yeni -> {OUT}")


if __name__ == "__main__":
    main()
