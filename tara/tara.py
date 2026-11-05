"""Resmi belgelerde (çağrı metni, uygulama esasları, rehber) değerlendirme/puanlama tablosu var mı? Fizibilite taraması."""
import json, re, subprocess, tempfile, time, sys
import requests
UA = "Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
S = requests.Session(); S.headers["User-Agent"] = UA
L = json.load(open("belge-listesi.json"))
low = lambda s: s.replace("I", "ı").replace("İ", "i").lower()
KEY = re.compile(r"değerlendirme (kriter|ölçüt|tablo|formu|esas)|puanlama|puan(ı|lar)?\b|ağırlık(lı)? puan|ek[- ]?2\b|seçim kriter|öncelik puan|ek puan|bonus", re.I)
SATIR_PUAN = re.compile(r"(\d{1,3})\s*(puan|%)", re.I)
res = []
for o in L:
    r = {"id": o["id"], "ad": o["ad"], "kurum": o["kurum"], "belgeler": []}
    for d in o["belgeler"]:
        ext = d["ad"].rsplit(".", 1)[-1].lower()
        b = {"ad": d["ad"], "url": d["url"], "tur": ext}
        if ext != "pdf":
            b["durum"] = "pdf-degil"; r["belgeler"].append(b); continue
        try:
            x = S.get(d["url"], timeout=60)
            if not x.ok or x.content[:4] != b"%PDF": b["durum"] = f"indirilemedi {x.status_code}"; r["belgeler"].append(b); continue
            with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
                f.write(x.content); f.flush()
                t = subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True, timeout=90).stdout
                pg = subprocess.run(["pdfinfo", f.name], capture_output=True, text=True).stdout
            sayfa = int((re.search(r"Pages:\s+(\d+)", pg) or [0, 0])[1])
            b["sayfa"] = sayfa; b["karakter"] = len(t.strip())
            b["durum"] = "metin" if len(t.strip()) > 200 * max(1, sayfa) * 0.2 else "taranmis-olabilir"
            hits = [m.start() for m in KEY.finditer(low(t))]
            b["anahtar"] = len(hits)
            # en çok puan geçen bölge
            best, bi = 0, None
            for h in hits:
                pc = len(SATIR_PUAN.findall(t[h:h + 2500]))
                if pc > best: best, bi = pc, h
            b["puan_sayisi"] = best
            if bi is not None: b["ornek"] = t[max(0, bi - 200):bi + 2300]
        except Exception as e:
            b["durum"] = "hata " + str(e)[:80]
        r["belgeler"].append(b); time.sleep(1.5)
    res.append(r); print(o["ad"][:50], [(b.get("durum"), b.get("puan_sayisi")) for b in r["belgeler"]], flush=True)
json.dump(res, open("tara/sonuc.json", "w"), ensure_ascii=False, indent=1)
