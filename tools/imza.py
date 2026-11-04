"""
Görünmez sahiplik izi: config.js'deki SAHIP adını
  - her HTML sayfasının <head> bölümüne <meta name="author"> ve <meta name="copyright"> olarak,
  - assets/*.js ve assets/style.css dosyalarının başına /*! ... */ telif notu olarak,
  - LICENSE dosyasına
yazar. Kullanım: python tools/imza.py
"""
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
cfg = (ROOT / "config.js").read_text(encoding="utf-8")
sahip = re.search(r'SAHIP:\s*"([^"]*)"', cfg)[1]
site = re.search(r'SITE_ADI:\s*"([^"]*)"', cfg)[1]
yil = date.today().year
telif = f"© {yil} {sahip}. Tüm hakları saklıdır."

for f in sorted(ROOT.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    s = re.sub(r'\n<meta name="author"[^>]*>\n<meta name="copyright"[^>]*>', "", s)
    s = s.replace('<meta name="description"', f'<meta name="author" content="{sahip}">\n<meta name="copyright" content="{site} {telif}">\n<meta name="description"', 1)
    f.write_text(s, encoding="utf-8")

baslik = f"/*! {site} — {telif} İzinsiz kopyalanamaz ve dağıtılamaz. */\n"
for f in [*sorted((ROOT / "assets").glob("*.js")), ROOT / "assets" / "style.css"]:
    s = f.read_text(encoding="utf-8")
    s = re.sub(r"^/\*! .*? \*/\n", "", s)
    f.write_text(baslik + s, encoding="utf-8")

(ROOT / "LICENSE").write_text(f"""Copyright (c) {yil} {sahip}

{site} kaynak kodu, tasarımı ve içerik düzeni {sahip} tarafından oluşturulmuştur.
Tüm hakları saklıdır. Yazılı izin olmadan kopyalanamaz, değiştirilemez, dağıtılamaz
ve ticari amaçla kullanılamaz.

Sitede gösterilen destek programı metinleri ilgili kamu kurumlarına aittir ve
kaynakları belirtilerek, değiştirilmeden aktarılmaktadır.
""", encoding="utf-8")
print(f"imza: {sahip} ({yil})")
