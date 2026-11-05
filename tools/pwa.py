"""
Telefona kurulum (PWA) dosyalarını ve sunum QR kodunu üretir:
  - assets/icons/*.png  (uygulama simgeleri: sitenin altın halka logosu, petrol zemin)
  - manifest.webmanifest
  - assets/qr.svg       (config.js > SITE_URL adresinin QR kodu)
Kullanım: pip install pillow qrcode && python tools/pwa.py
"""
import json, re
from pathlib import Path
from PIL import Image, ImageDraw
import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parent.parent
cfg = (ROOT / "config.js").read_text(encoding="utf-8")
site = re.search(r'SITE_ADI:\s*"([^"]*)"', cfg)[1]
url = re.search(r'SITE_URL:\s*"([^"]*)"', cfg)[1]

ZEMIN, ALTIN, KREM = "#12343B", "#E0AE57", "#F4E7CF"
(ROOT / "assets" / "icons").mkdir(parents=True, exist_ok=True)

def simge(boyut, oran):
    """oran: logonun simge genişliğine oranı (maskable için daha küçük, güvenli alan)"""
    k = 4; S = boyut * k
    im = Image.new("RGB", (S, S), ZEMIN); d = ImageDraw.Draw(im)
    r = S * oran / 2; c = S / 2
    d.ellipse([c - r, c - r, c + r, c + r], fill=KREM)
    r2 = r * (1 - 2 * 6 / 28)  # sitedeki logo: 28 piksellik dairede 6 piksellik iç halka
    d.ellipse([c - r2, c - r2, c + r2, c + r2], fill=ALTIN)
    return im.resize((boyut, boyut), Image.LANCZOS)

for ad, boyut, oran in [("icon-192.png", 192, .56), ("icon-512.png", 512, .56), ("maskable-512.png", 512, .44), ("apple-touch-icon.png", 180, .56), ("favicon-32.png", 32, .8)]:
    simge(boyut, oran).save(ROOT / "assets" / "icons" / ad, optimize=True)

(ROOT / "manifest.webmanifest").write_text(json.dumps({
    "name": f"{site} – Sana uygun devlet destekleri",
    "short_name": site,
    "description": "Şirketine uygun hibe, kredi ve teşvikleri bul; başvuru formunu otomatik doldur.",
    "lang": "tr", "dir": "ltr",
    "start_url": "./index.html?kaynak=uygulama", "scope": "./", "id": "./",
    "display": "standalone", "background_color": "#F3F6F4", "theme_color": "#F3F6F4",
    "icons": [
        {"src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
        {"src": "assets/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
    ]
}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
qr.add_data(url); qr.make(fit=True)
svg = qr.make_image(image_factory=qrcode.image.svg.SvgPathFillImage).to_string(encoding="unicode")
(ROOT / "assets" / "qr.svg").write_text(svg, encoding="utf-8")
print("pwa:", url)
