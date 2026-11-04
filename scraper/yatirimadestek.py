"""
Destekler Platformu (T.C. Sanayi ve Teknoloji Bakanlığı, yatirimadestek.gov.tr) toplayıcısı.

Platform, tüm kurumların (KOSGEB, TÜBİTAK, Ticaret Bakanlığı, kalkınma ajansları...) destek
programlarını tek yerde listeler ve her program için Bakanlığın hazırladığı standart
"Özet Bilgi Formu" PDF'ini yayımlar. Bu betik:

  1. sitemap.xml'den program sayfalarını bulur,
  2. her sayfayı normal bir ziyaretçi gibi tarayıcıda açar (site JavaScript ile çalışıyor),
     program adını, kurumu, açık/kapalı durumunu, son başvuru tarihini ve resmi belgeleri okur,
  3. açık programların özet bilgi formunu indirir ve bölümleri ("Kimler Yararlanabilir?",
     "Destek Unsurları", "Başvuru Dönemi", "Başvuru Yeri") OLDUĞU GİBİ, kelimesi kelimesine saklar.

Başvuru şartları yeniden yazılmaz ve yorumlanmaz; sitede resmi metin kaynağıyla birlikte gösterilir.
Uygunluk testi için gereken birkaç alan (ölçek, oran, tür) bu metinden kurallarla çıkarılır ve
"otomatik okundu" olarak işaretlenir.

Çıktı: scraper/platform.json (scrape.py bunu data.json'a birleştirir).
Kullanım: python scraper/yatirimadestek.py  [ortam değişkeni MAX=20 ile deneme]
"""
import json, os, re, subprocess, tempfile, time
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "platform.json"
FORMS = ROOT.parent / "forms"
BASE = "https://yatirimadestek.gov.tr"
UA = "Mozilla/5.0 (compatible; DestekBulucu/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
DELAY = 2.0                      # saniye: siteye nazik davranmak için
MAX = int(os.environ.get("MAX", "0")) or None
MAX_PDF = 10 * 1024 * 1024

session = requests.Session()
session.headers["User-Agent"] = UA

HARIC = ["öğrenci", "burs", "akademisyen", "araştırmacı", "lisansüstü", "doktora", "lise", "stajyer"]
ISLETME = ["işletme", "şirket", "firma", "kobi", "girişimci", "sanayici", "ihracatçı", "işveren", "kooperatif", "üretici",
           "yatırımcı", "tacir", "esnaf", "sermaye", "tüzel kişi", "gerçek kişi", "müteahhit", "kuruluş", "çiftçi", "yetiştirici"]
BOLUMLER = [  # özet bilgi formundaki standart başlıklar
    ("kimler", r"Kimler\s+Yararlanabilir"),
    ("destek", r"Desteklenen\s+Alanlar|Destek\s+Unsurlar|Destek\s+Kapsam"),
    ("donem", r"Başvuru\s+Dönemi"),
    ("yer", r"Başvuru\s+Yeri"),
]
BASLIK = {"tum": "Özet bilgi formu", "kimler": "Kimler yararlanabilir?", "destek": "Desteklenen alanlar ve destek unsurları",
          "donem": "Başvuru dönemi", "yer": "Başvuru yeri"}
AMAC_KURALLARI = {
    "yatirim": ["makine", "teçhizat", "yatırım", "kapasite", "tesis"],
    "arge": ["ar-ge", "inovasyon", "ür-ge", "patent", "teknoloji geliştirme", "yenilik"],
    "dijital": ["dijital", "yazılım", "e-ticaret", "otomasyon", "yapay zeka"],
    "ihracat": ["ihracat", "yurt dışı", "fuar", "pazara giriş"],
    "istihdam": ["istihdam", "personel", "işbaşı"],
    "finansman": ["kredi", "faiz", "finansman", "kefalet"],
    "vergi": ["vergi", "istisna", "sgk prim", "muafiyet"],
    "yesil": ["enerji verimliliği", "yeşil", "yenilenebilir", "karbon", "atık"],
    "kurulus": ["yeni kurulan", "girişimci", "kuruluş"],
}


def low(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


KISALTMA = {"TÜBİTAK", "KOSGEB", "SGK", "İŞKUR", "KGF", "A.Ş.", "TKDK", "İLBANK", "EXİMBANK", "AB", "TÜRKİYE"}


def kurum_adi(s):
    """'TİCARET BAKANLIĞI' -> 'Ticaret Bakanlığı'; kısaltmalar korunur."""
    ozel = {"TÜRK EXİMBANK": "Türk Eximbank", "KGF (KREDİ GARANTİ FONU A.Ş.)": "Kredi Garanti Fonu (KGF)",
            "İŞKUR (TÜRKİYE İŞ KURUMU)": "İŞKUR", "TÜRKİYE KALKINMA VE YATIRIM BANKASI": "Türkiye Kalkınma ve Yatırım Bankası"}
    if s.upper() in ozel or s in ozel: return ozel.get(s, ozel.get(s.upper()))
    def w(x):
        if x.upper() in KISALTMA - {"TÜRKİYE", "EXİMBANK"} or "(" in x and x.strip("()").upper() in KISALTMA: return x
        if x.lower() in ("ve", "ile"): return x.lower()
        if x != x.upper(): return x
        t = x.replace("I", "ı").replace("İ", "i").lower()
        return (t[0].replace("i", "İ").upper() if t[0] == "i" else t[0].upper()) + t[1:]
    return " ".join(w(x) for x in s.split())


def tr_date(s):
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(20\d{2})", s or "")
    if not m: return None
    try: return date(int(m[3]), int(m[2]), int(m[1])).isoformat()
    except ValueError: return None


def program_urls():
    r = session.get(BASE + "/sitemap.xml", timeout=60); r.raise_for_status()
    urls = sorted(set(re.findall(r"<loc>(https://yatirimadestek\.gov\.tr/program/[0-9a-f-]{36})</loc>", r.text)))
    print(len(urls), "program sayfası bulundu")
    return urls[:MAX] if MAX else urls


def read_page(page, url):
    """Program sayfasını tarayıcıda açıp görünen bilgileri okur."""
    page.goto(url, wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(1500)
    lines = [l.strip() for l in page.evaluate("document.body.innerText").split("\n") if l.strip()]
    if "Geri Dön" not in lines: return None
    i = lines.index("Geri Dön") + 1
    info = {"ad": lines[i] if i < len(lines) else "", "kurum": lines[i + 1] if i + 1 < len(lines) else ""}
    for l in lines[i:i + 8]:
        if l.startswith("Güncellenme"): info["guncelleme"] = tr_date(l)
        elif l in ("Açık", "Kapalı"): info["durum"] = l
        elif "Son Başvuru" in l: info["son_basvuru"] = tr_date(l)
    info["belgeler"] = page.evaluate("""() => [...document.querySelectorAll('a[href]')]
        .filter(a => /\\/assets\\/upload\\//.test(a.href))
        .map(a => ({ url: a.href, ad: decodeURIComponent(a.href.split('/').pop()) }))""")
    return info


def pdf_text(url):
    r = session.get(url, timeout=60)
    if not r.ok or r.content[:4] != b"%PDF" or len(r.content) > MAX_PDF: return None
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        f.write(r.content); f.flush()
        out = subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True, timeout=60)
    return out.stdout if out.returncode == 0 else None


def clean(text):
    """Sayfa üst/alt bilgilerini at, satır sonlarını birleştir; içeriği değiştirme."""
    keep = []
    raw = [re.sub(r"\s{2,}", " ", l.strip()) for l in re.sub("[\uf0b7\uf0a7\uf076\uf0d8\uf0fc]", "•", text.replace("\u200b", "")).split("\n")]
    tekrar = {l for l in raw if l and raw.count(l) > 1 and l == l.upper() and len(l) < 120}  # her sayfada tekrarlanan başlık
    tekrar |= set(PAGE_HEAD)
    for s in raw:
        if s in tekrar: continue
        if not s or "Destek Platformu" in s or "Destekler Platformu" in s or s.startswith("Son Güncelleme Tarihi") or s == "ÖZET BİLGİ FORMU" or re.fullmatch(r"\d+/\d+", s):
            continue
        keep.append(s)
    out = []
    for s in keep:  # madde işaretleriyle başlamayan satırı önceki maddeye ekle
        if out and not re.match(r"^([●•▪○]\s?|[o\-–]\s|\d+[).]\s|[a-zçğıöşü]\)\s)", s) and not out[-1].endswith((":", ".")):
            out[-1] += " " + s
        else:
            out.append(s)
    return "\n".join(re.sub(r"^[●•▪]\s*", "• ", re.sub(r"^(o\s+|○\s*)", "– ", s)) for s in out)


PAGE_HEAD = []


def sections(text):
    """Özet bilgi formunu standart bölümlere ayırır (metin aynen korunur)."""
    head = text.split("ÖZET BİLGİ FORMU", 1)[0] if "ÖZET BİLGİ FORMU" in text else ""
    PAGE_HEAD[:] = [re.sub(r"\s{2,}", " ", l.strip()) for l in head.split("\n") if l.strip()]
    marks = []
    for key, pat in BOLUMLER:
        m = re.search(r"^\s*\d\)\s*(" + pat + r")[^\n]*$", text, re.M)
        if m: marks.append((m.start(), m.end(), key))
    marks.sort()
    out = {}
    for n, (s, e, key) in enumerate(marks):
        end = marks[n + 1][0] if n + 1 < len(marks) else len(text)
        body = clean(text[e:end])
        if body: out[key] = body
    if not out:  # standart başlık yoksa formun tamamını tek bölüm olarak aynen sakla
        body = clean(re.sub(r"^.*?ÖZET BİLGİ FORMU", "", text, count=1, flags=re.S))
        if body: out["tum"] = body
    return out, ""


ORAN_SOZ = ["destek oranı", "oranında destek", "hibe oranı", "oranında hibe", "desteklenir", "desteklenmektedir",
            "karşılanır", "karşılanmaktadır", "geri ödemesiz", "destek sağlan"]
ORAN_DEGIL = ["katkı", "faiz", "komisyon", "kesinti", "vergi", "matrah", "prim", "teminat", "kar payı", "kâr payı", "peşinat"]
LIMIT_DEGIL = ["bütçe", "abd", "dolar", "avro", "euro", "usd", "ciro", "satış", "hasılat", "sermaye"]


def cumleler(t):
    return [c for c in re.split(r"(?<=[.;:])\s+|\n|\uf0b7|•", t) if c.strip()]


def money(t):
    """Yalnızca destek/hibe/kredi üst limitini açıkça söyleyen cümledeki TL tutarı (proje bütçesi, döviz vb. hariç)."""
    best = None
    for c in cumleler(t):
        lc = low(c)
        if not any(w in lc for w in ["üst limit", "en fazla", "azami", "kadar destek", "kadar hibe", "kadar kredi"]): continue
        if not any(w in lc for w in ["destek", "hibe", "kredi"]) or any(w in lc for w in LIMIT_DEGIL): continue
        for m in re.finditer(r"(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(milyar|milyon|bin)?\s*(?:TL|₺|Türk Lirası)", c):
            n = float(m[1].replace(".", "").replace(",", "."))
            n *= {"milyar": 1e9, "milyon": 1e6, "bin": 1e3}.get(m[2] or "", 1)
            if n >= 1000: best = max(best or 0, n)
    return int(best) if best else None


def ratios(t):
    """Yalnızca kesin kalıplardaki destek oranları: '%X oranında ... desteklenir/karşılanır' veya 'destek oranı ... %X'.
    Firmanın kendi payı, ilave puanlar, tavanlar ve faiz/vergi yüzdeleri alınmaz. Emin olunamazsa boş kalır."""
    vals = set()
    for c in cumleler(t):
        lc = low(c)
        if any(w in lc for w in ORAN_DEGIL + ["ilave", "aşmamak", "geçmeyecek", "kalan", "tarafından karşılan"]): continue
        for m in re.finditer(r"%\s?(\d{1,3})(?:[’'][a-zçğıöşü]+)?\s+oranında(?:[^.;]|\.(?=\d)){0,160}?(desteklen|karşılan|hibe)", lc):
            vals.add(int(m[1]))
        for m in re.finditer(r"destek oranı[^.;%]{0,40}%\s?(\d{1,3})(?![\d.,])", lc):
            vals.add(int(m[1]))
    return sorted(v for v in vals if 5 <= v <= 100)


def tur_bul(ad, destek):
    """Tür önce program adından, sonra destek metninin başından belirlenir (metnin içinde geçen tek bir kelimeye bakılmaz)."""
    a, d = low(ad), low(destek[:600])
    if any(w in a for w in ["kredi", "finansman", "kefalet", "teminat", "iskonto", "reeskont", "sigorta programı"]): return "kredi"
    if any(w in a for w in ["teşvik", "muafiyet", "istisna", "indirim", "prim", "vergi", "serbest bölge", "dahilde işleme", "statülü"]) and "destek programı" not in a: return "vergi"
    if "geri ödemeli" in d or "kredi kullandırıl" in d: return "kredi"
    if ratios(destek): return "hibe"  # açık bir destek oranı varsa harcamaya destektir
    if any(w in d for w in ["vergi", "matrah", "prim desteği", "muafiyet", "istisna"]) and not any(w in d for w in ["hibe", "oranında destek"]): return "vergi"
    return "hibe"


def build(url, info, sec, docs):
    kimler, destek = sec.get("kimler", ""), sec.get("destek", "") or sec.get("tum", "")
    t = low(info["ad"] + " " + kimler + " " + destek)
    if any(w in low(info["ad"]) for w in HARIC): return None
    # Sitenin kitlesi işletmeler: "Kimler yararlanabilir?" metninde işletme türünden biri geçmiyorsa
    # (yalnızca dernek, belediye, araştırmacı vb.) programı alma.
    hedef = low(kimler or " ".join(sec.values()))
    if hedef and not any(w in hedef for w in ISLETME): return None
    tur = tur_bul(info["ad"], destek)
    k = low(kimler)
    kobi = "kobi" in k or "küçük ve orta" in k or "orta ölçekli" in k
    buyuk = any(w in k for w in ["büyük ölçekli", "büyük işletme", "büyük kuruluş", "tüm işletme", "her ölçek"])
    olcek = ["mikro", "kucuk", "orta"] if kobi and not buyuk else ["mikro", "kucuk", "orta", "buyuk"]
    r = ratios(sec.get("destek", ""))  # oran yalnızca standart "destek" bölümünden; serbest metinden tahmin yok
    amac = [k for k, ws in AMAC_KURALLARI.items() if any(w in t for w in ws)] or ["yatirim"]
    kosullar = [l.lstrip("•– ").strip() for l in kimler.split("\n") if l.strip()][:12]
    yer = sec.get("yer", "")
    online = next(iter(re.findall(r"https?://[^\s)]+", yer)), url)
    form = next((d for d in docs if re.search(r"form", low(d["ad"])) and not low(d["ad"]).startswith("ozet") and d["ad"].lower().endswith(".pdf")), None)
    pid = "yd-" + url.rsplit("/", 1)[1][:8]
    form_path = None
    if form:
        try:
            rr = session.get(form["url"], timeout=60)
            if rr.ok and rr.content[:4] == b"%PDF" and len(rr.content) < MAX_PDF:
                FORMS.mkdir(exist_ok=True); (FORMS / f"{pid}.pdf").write_bytes(rr.content); form_path = f"forms/{pid}.pdf"
        except Exception as e:
            print("  form indirilemedi:", e)
    ozet = (destek.split("\n")[0] if destek else kimler.split("\n")[0] if kimler else info["ad"]).lstrip("•– ")
    return {
        "id": pid, "ad": info["ad"][:160], "kurum": kurum_adi(info["kurum"]), "url": url, "tur": tur,
        "ust_limit": None,  # programlarda çoğu zaman kalem kalem birden çok limit var; tek sayıya indirmek yanıltır. Resmi metinde okunur. "destek_orani": r[0] if r else None,  # en düşük oran: iyimser olmayan tahmin
        "geri_odemeli": "geri ödemeli" in t,
        "oran_metin": (f"%{r[0]}–%{r[-1]}" if len(r) > 1 else None),
        "amac": amac, "olcek": olcek, "sektor": ["tumu"], "il": ["tumu"],
        "son_basvuru": info.get("son_basvuru"), "ozet": ozet[:300],
        "firma_yasi_max": None, "ihracat_gerekli": False,
        "kosullar": kosullar,
        "belgeler": [],  # resmi metinde yoksa uydurma belge listesi gösterme; resmi belgeler "resmi.belgeler"de
        "alanlar": ["firmaUnvani", "vkn", "vergiDairesi", "yetkili", "telefon", "eposta", "adres", "il", "kurulusYili", "sirketTuru", "naceKodu", "calisan", "ciro"],
        "basvuru": {"yontem": "pdf" if form_path else "online", "form": form_path, "online": online,
                    "adimlar": [l.lstrip("•– ") for l in yer.split("\n") if l.strip()][:6]},
        "kredi": None,
        "kaynak": "platform",
        "resmi": {
            "kaynak": "T.C. Sanayi ve Teknoloji Bakanlığı – Destekler Platformu",
            "sayfa": url, "guncelleme": info.get("guncelleme"), "kontrol": date.today().isoformat(),
            "bolumler": [{"baslik": BASLIK[k], "metin": sec[k]} for k in ["kimler", "destek", "donem", "yer", "tum"] if sec.get(k)],
            "belgeler": docs,
        },
    }


def main():
    from playwright.sync_api import sync_playwright
    today = date.today().isoformat()
    items, seen, kapali = [], 0, []
    with sync_playwright() as p:
        b = p.chromium.launch(); page = b.new_page(user_agent=UA)
        for url in program_urls():
            seen += 1
            try:
                info = read_page(page, url)
            except Exception as e:
                print("  açılamadı:", url, e); continue
            finally:
                time.sleep(DELAY)
            if info and (info.get("durum") == "Kapalı" or (info.get("son_basvuru") and info["son_basvuru"] < today)):
                kapali.append(info["ad"])
            if not info or info.get("durum") != "Açık" or (info.get("son_basvuru") and info["son_basvuru"] < today):
                continue
            docs = info["belgeler"]
            ozet_pdf = next((d for d in docs if low(d["ad"]).startswith("ozet")), None)
            sec = {}
            if ozet_pdf:
                try:
                    txt = pdf_text(ozet_pdf["url"]); time.sleep(DELAY)
                    if txt: sec, _ = sections(txt)
                except Exception as e:
                    print("  özet okunamadı:", e)
            item = build(url, info, sec, docs)
            if item:
                items.append(item)
                print(f"  + {item['ad'][:70]} ({item['kurum']}) – {len(sec)} bölüm")
        b.close()
    if not items and OUT.exists():
        print("Platformdan kayıt alınamadı, önceki platform.json korunuyor."); return
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    (ROOT / "platform_kapali.json").write_text(json.dumps(sorted(set(kapali)), ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{seen} sayfa tarandı, {len(items)} açık program -> {OUT}")


if __name__ == "__main__":
    main()
