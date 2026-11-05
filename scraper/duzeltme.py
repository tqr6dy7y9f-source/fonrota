"""
Elle doğrulanmış düzeltmeler (scraper/duzeltmeler.json).

Destekler Platformu bazı programlar için özet bilgi formu yayımlamıyor; bu durumda il, sektör
gibi kapsam bilgisi otomatik çıkarılamıyor ve program "Türkiye geneli" görünüyor. Böyle programların
kapsamı resmi belgeden (karar, tebliğ) okunup buraya yazılır; her düzeltmede belgenin adı, bağlantısı
ve ilgili bölümün değiştirilmeden alınmış metni bulunur. Haftalık güncelleme bu düzeltmeleri korur.

Tek başına çalıştırılırsa mevcut data.json dosyasına uygular: python scraper/duzeltme.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def uygula(kayitlar):
    """kayitlar: destek sözlükleri listesi. Düzeltmeleri yerinde uygular, uygulanan sayısını döndürür."""
    yol = ROOT / "duzeltmeler.json"
    if not yol.exists():
        return 0
    idx = {k["id"]: k for k in kayitlar}
    n = 0
    for d in json.loads(yol.read_text(encoding="utf-8")):
        k = idx.get(d["id"])
        if not k:
            continue
        k.update(d.get("alanlar", {}))
        if d.get("dogrulama"):
            k["dogrulama"] = d["dogrulama"]
        n += 1
    return n


if __name__ == "__main__":
    out = ROOT.parent / "data.json"
    data = json.loads(out.read_text(encoding="utf-8"))
    print(uygula(data["destekler"]), "düzeltme uygulandı")
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
