"""
Sürüm numarasını yeniler.

Her sayfadaki CSS ve JavaScript bağlantılarının sonunda ?v=YYYYAAGGSSDD biçiminde bir sürüm numarası var:
    <link rel="stylesheet" href="assets/style.css?v=202611040748">
    <script src="assets/core.js?v=202611040748"></script>
Tarayıcılar ve GitHub Pages bu dosyaları önbellekte tutar. Numara değişince ziyaretçinin tarayıcısı
yeni dosyayı indirir; değişmezse eski tasarım/kod görünmeye devam edebilir.

assets/ altındaki bir dosyayı veya config.js'i her değiştirdiğinde yayına göndermeden önce çalıştır:
    python tools/surum.py
"""
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = datetime.now().strftime("%Y%m%d%H%M")
PAT = re.compile(r'((?:href|src)="(?:assets/(?:style\.css|prompts\.js|core\.js|pages\.js)|config\.js))(?:\?v=\d+)?"')
n = 0
for f in sorted(ROOT.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    t, k = PAT.subn(rf'\1?v={V}"', s)
    if k:
        f.write_text(t, encoding="utf-8"); n += 1
print(f"{n} sayfada sürüm numarası v={V} yapıldı")
