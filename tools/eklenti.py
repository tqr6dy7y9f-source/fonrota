"""
FonRota tarayıcı eklentisini hazırlar:
  - eklenti/ayar.js        (config.js'deki Supabase adresi, herkese açık anahtar ve site adresi)
  - eklenti/icons/*.png    (sitenin uygulama simgesinden)
  - manifest'teki Supabase izni
  - assets/fonrota-eklenti.zip (sitedeki "Eklentiyi indir" düğmesinin dosyası)
Kullanım: python tools/eklenti.py
"""
import json, re, zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
E = ROOT / "eklenti"
cfg = (ROOT / "config.js").read_text(encoding="utf-8")
al = lambda k: re.search(k + r':\s*"([^"]*)"', cfg)[1]
ayar = {"SUPABASE_URL": al("SUPABASE_URL"), "SUPABASE_ANON_KEY": al("SUPABASE_ANON_KEY"), "SITE_URL": al("SITE_URL")}
(E / "ayar.js").write_text("// tools/eklenti.py tarafından config.js'den üretilir; elle değiştirme.\nconst AYAR = " + json.dumps(ayar, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

m = json.loads((E / "manifest.json").read_text(encoding="utf-8"))
m["host_permissions"] = [ayar["SUPABASE_URL"].rstrip("/") + "/*"] if ayar["SUPABASE_URL"] else []
(E / "manifest.json").write_text(json.dumps(m, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

(E / "icons").mkdir(exist_ok=True)
kaynak = Image.open(ROOT / "assets" / "icons" / "icon-512.png")
for s in (16, 32, 48, 128):
    kaynak.resize((s, s), Image.LANCZOS).save(E / "icons" / f"{s}.png", optimize=True)

zp = ROOT / "assets" / "fonrota-eklenti.zip"
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(E.rglob("*")):
        if f.is_file() and not f.name.startswith("."):
            z.write(f, "fonrota-eklenti/" + str(f.relative_to(E)))
print("eklenti:", m["version"], "->", zp.relative_to(ROOT), zp.stat().st_size, "bayt")
