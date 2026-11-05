"""
NACE kodu bulucunun verisini (assets/nace.json) resmi listeden üretir.

Kaynak: T.C. Ticaret Bakanlığı > Esnaf ve Sanatkârlar > Sektör Meslek NACE Listeleri > Güncel Liste
  https://ticaret.gov.tr/esnaf-sanatkarlar/esnaf-ve-sanatkar-meslek-kollari/sektor-meslek-nace-listeleri/guncel-liste
  Dosya: "Sektör Meslek Nace Kodları_2026.03.xlsx" (TÜİK NACE Rev.2.1 altılı kodları ve Türkçe tanımları)
Dosyadaki "GÜNCEL" sütunları tüm güncel kod listesini, E/F sütunları meslek eşleştirmelerini içerir; ikisi birleştirilir.
Tanımlar değiştirilmeden alınır.

Kullanım: pip install openpyxl && python tools/nace.py "Sektör Meslek Nace Kodları_2026.03.xlsx"
"""
import json, re, sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
kaynak = Path(sys.argv[1])
ws = openpyxl.load_workbook(kaynak, read_only=True).worksheets[0]
kod = {}
for i, r in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue
    for k, t in ((r[6], r[7]), (r[4], r[5])):  # önce GÜNCEL listesi
        if k and t:
            k, t = str(k).strip(), re.sub(r"\s+", " ", str(t)).strip()
            if re.fullmatch(r"\d{2}\.\d{2}\.\d{2}", k) and k not in kod:
                kod[k] = t
veri = {
    "kaynak": "T.C. Ticaret Bakanlığı, Sektör Meslek NACE Kodları (TÜİK NACE Rev.2.1 altılı sınıflaması), Mart 2026",
    "sayfa": "https://ticaret.gov.tr/esnaf-sanatkarlar/esnaf-ve-sanatkar-meslek-kollari/sektor-meslek-nace-listeleri/guncel-liste",
    "kodlar": sorted(kod.items()),
}
(ROOT / "assets" / "nace.json").write_text(json.dumps(veri, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(kod), "NACE kodu yazıldı")
