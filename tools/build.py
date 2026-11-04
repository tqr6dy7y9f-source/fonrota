"""Sayfaları (index.html, destekler.html, ...) ve tek dosyalık önizlemeyi (dist/onizleme.html) üretir.
Kullanım: python tools/build.py"""
import base64, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TITLES = {
    "index": "Sana uygun devlet desteklerini bul",
    "destekler": "Tüm destekler", "bul": "Uygunluk testi", "sonuclar": "Sana uygun destekler",
    "destek": "Destek ayrıntısı", "basvuru": "Başvuru hazırlama", "rapor": "Başvuru özet raporu", "hesap": "Hesabım",
}

MAINS = {
"index": """<div class="wrap">
  <section class="hero">
    <div>
      <h1>Devlet desteklerinden hangisi sana uygun, iki dakikada öğren.</h1>
      <p class="lead">İşini anlat, çalışan sayını gir. KOSGEB’den kalkınma ajanslarına kadar sana uyan hibe, kredi ve teşvikleri bulalım, başvuru formunu senin için dolduralım.</p>
      <div class="cta"><a class="btn seal" href="bul.html">Uygun desteklerimi bul</a><a class="btn ghost" href="destekler.html">Tüm desteklere bak</a></div>
      <p class="small muted" id="stat"></p>
    </div>
    <div class="player" id="video"></div>
  </section>
  <div class="sources" aria-label="Taranan kaynaklar"><span>KOSGEB</span><span>TÜBİTAK</span><span>26 kalkınma ajansı</span><span>Ticaret Bakanlığı</span><span>Sanayi ve Teknoloji Bakanlığı</span><span>TKDK</span><span>SGK ve İŞKUR</span><span>Eximbank</span><span>KGF</span></div>
  <ol class="steps">
    <li><h3>İşini anlat</h3><p>Birkaç cümle yeter. Yapay zekâ sektörünü ve ihtiyaçlarını çıkarır.</p></li>
    <li><h3>Ölçeğini öğren</h3><p>Çalışan sayına ve cirona göre mikro, küçük veya orta ölçekli olduğunu hesaplarız.</p></li>
    <li><h3>Uygun destekleri gör</h3><p>Hibe, kredi ve teşvikler zihin haritasında; hangisine neden uyduğun yazar.</p></li>
    <li><h3>Formun hazır</h3><p>Form bilgilerinle dolar ya da hangi alana ne yazacağın adım adım çıkar.</p></li>
  </ol>
  <h2>Kurum portallarından farkı</h2>
  <div class="compare">
    <div><h3>Kurum portallarında</h3><ul><li>Her kurumun desteklerini ayrı sitede ararsın.</li><li>Uygun olup olmadığını uzun yönetmeliklerden sen çıkarırsın.</li><li>Her başvuruda aynı bilgileri baştan yazarsın.</li><li>Yeni çağrıları takip etmek sana kalır.</li></ul></div>
    <div><h3>Burada</h3><ul><li>Tüm kurumlar tek yerde, her gün güncel.</li><li>Ölçeğini ve uygunluğunu biz hesaplarız.</li><li>Bilgilerin bir kez girilir, formlara otomatik yazılır.</li><li>Sana uyan yeni destek çıkınca anında haber veririz.</li></ul></div>
  </div>
  <div class="panel" style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center">
    <div><h2>Ücretsiz hesap aç.</h2><p class="muted" style="margin:4px 0 0">Başvuruların kayıtlı kalsın, yeni destekleri ilk sen öğren.</p></div>
    <a class="btn seal" href="hesap.html?sekme=kayit">Hesap aç</a>
  </div>
</div>""",
"destekler": """<div class="wrap">
  <h1 style="margin:28px 0 6px">Tüm destekler</h1>
  <p class="muted">Mevcut şirketler ve KOBİ’ler için hibe, kredi ve teşvikler.</p>
  <div id="notice"></div>
  <div class="notice" id="cta-test" hidden>Hangi desteklere uygun olduğunu görmek için <a href="bul.html"><strong>3 adımlık uygunluk testini</strong></a> yap.</div>
  <div class="bar-filters" role="group" aria-label="Filtreler">
    <div class="chips" id="f-tur"><button class="chip" aria-pressed="true" data-v="">Hepsi</button><button class="chip" aria-pressed="false" data-v="hibe">Hibe</button><button class="chip" aria-pressed="false" data-v="kredi">Kredi</button><button class="chip" aria-pressed="false" data-v="vergi">Vergi ve prim</button></div>
    <label>İl <select class="input" id="f-il"></select></label>
    <label>Ölçek <select class="input" id="f-olcek"></select></label>
    <label>Ara <input class="input" type="search" id="f-q" placeholder="ör. makine, ihracat"></label>
    <label>Sırala <select class="input" id="f-sort"><option value="uygun">En uygun önce</option><option value="tarih">Son başvuru yakın</option><option value="tutar">Tutar yüksek</option></select></label>
  </div>
  <p class="small muted" id="count" aria-live="polite" style="padding-top:14px"></p>
  <ul class="list" id="list"></ul>
</div>""",
"bul": """<div class="wrap narrow wizard">
  <div class="progress" aria-hidden="true"><i></i><i></i><i></i></div>
  <p class="small muted" id="adim-no"></p>
  <div id="wizard"></div>
</div>""",
"sonuclar": """<div class="wrap" id="res">
  <div class="res-head"><div><h1 id="baslik"></h1><p class="profile-line" id="profil"></p></div>
    <div class="seg" id="view" role="group" aria-label="Görünüm"><button type="button" data-v="harita">Zihin haritası</button><button type="button" data-v="liste">Liste</button></div></div>
  <div id="notice"></div>
  <div class="ai-box" id="ai" hidden><h3>Yapay zekâ önerisi</h3><div id="ai-out"><p class="small muted">Profiline göre öncelik vermen gereken 3 desteği seçsin.</p></div><button class="btn sm seal" type="button" id="ai-btn">Yapay zekâ yorumlasın</button></div>
  <div class="mm-legend" id="mm-legend" hidden><span><i style="background:var(--ok)"></i>Uygun</span><span><i style="background:var(--mid)"></i>Kısmen uygun</span><span>Bir desteğe tıklayınca ayrıntısı açılır.</span></div>
  <div class="mindmap" id="mm" hidden></div>
  <div id="liste" hidden></div>
  <div class="actions"><button class="btn seal" type="button" id="rapor-btn">Başvuru özet raporu oluştur</button><a class="btn ghost" href="destekler.html">Tüm desteklere bak</a></div>
</div>""",
"destek": """<div class="wrap" id="detay"></div>""",
"basvuru": """<div class="wrap" id="bas"></div>""",
"rapor": """<div class="wrap narrow">
  <div class="actions"><button class="btn seal" type="button" id="pdf">PDF olarak indir</button><button class="btn ghost" type="button" id="ai-giris" hidden>Yapay zekâ giriş paragrafı yazsın</button><a class="btn ghost" href="sonuclar.html">Sonuçlara dön</a></div>
  <div id="rapor"></div>
</div>""",
"hesap": """<div class="wrap" id="hesap"></div>""",
}

HEAD = """<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="Şirketine ve KOBİ’ne uygun hibe, kredi ve teşvikleri bul; başvuru formunu otomatik doldur.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
{css}
</head>
"""
SCRIPTS = ["config.js", "assets/prompts.js", "assets/core.js", "assets/pages.js"]


def page(name):
    title = TITLES[name] + " – Destek Bulucu"
    html = HEAD.format(title=title, css='<link rel="stylesheet" href="assets/style.css">')
    html += f'<body data-page="{name}">\n<header class="top" id="top"></header>\n<main data-page="{name}">\n{MAINS[name]}\n</main>\n<footer class="site" id="footer"></footer>\n'
    html += "".join(f'<script src="{s}"></script>\n' for s in SCRIPTS) + "</body>\n</html>\n"
    (ROOT / f"{name}.html").write_text(html, encoding="utf-8")


def bundle():
    css = (ROOT / "assets/style.css").read_text(encoding="utf-8")
    html = HEAD.format(title="Destek Bulucu – önizleme", css=f"<style>\n{css}\n</style>")
    html += '<body>\n<header class="top" id="top"></header>\n'
    for name, m in MAINS.items():
        m = re.sub(r'href="([a-z]+)\.html(\?([^"]*))?"', lambda mm: f'href="#{mm.group(1)}"' + (f' data-q="{mm.group(3)}"' if mm.group(3) else ""), m)
        html += f'<main data-page="{name}" hidden>\n{m}\n</main>\n'
    html += '<footer class="site" id="footer"></footer>\n'
    assets = {}
    for p in ["assets/fonts/DejaVuSans.ttf", "assets/fonts/DejaVuSans-Bold.ttf", "forms/kosgeb-ornek-basvuru-formu.pdf", "forms/maps/kosgeb-ornek-basvuru-formu.json"]:
        assets[p] = base64.b64encode((ROOT / p).read_bytes()).decode()
    seed = (ROOT / "data.json").read_text(encoding="utf-8")
    js = "window.__BUNDLE__=true;\nwindow.__SEED__=" + seed + ";\nwindow.__ASSETS__=" + json.dumps(assets) + ";\n"
    for s in SCRIPTS:
        js += (ROOT / s).read_text(encoding="utf-8") + "\n"
    html += "<script>\n" + js.replace("</script", "<\\/script") + "</script>\n</body>\n</html>\n"
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist/onizleme.html").write_text(html, encoding="utf-8")


# DİKKAT: *.html sayfaları artık doğrudan düzenleniyor (filtreler, yatırım tutarı kutusu vb. yalnızca orada).
# Buradaki MAINS eski kopyadır; sayfaları bundan üretmek son değişiklikleri SİLER. Bu yüzden varsayılan olarak
# yalnızca önizleme (dist/onizleme.html) üretilir. Sürüm numarası için: python tools/surum.py
import sys
if "--sayfalari-ezerek-uret" in sys.argv:
    for n in MAINS:
        page(n)
    print("UYARI: sayfalar eski kopyadan yeniden üretildi; python tools/surum.py çalıştır.")
bundle()
print("dist/onizleme.html hazır")
