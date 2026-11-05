"""Seçili resmi PDF'lerin tam metnini sayfa sayfa çıkarır (doğrulama için)."""
import re, subprocess, tempfile, pathlib, requests
UA = "Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
URLS = """karar_cazibe_merkezleri_destek_programi.pdf
teblig_cazibe_merkezleri_programi.pdf
1509_programi_esaslar_islenmis_hali.pdf
1831_2024-1_cagri_duyurusu_0.pdf
bilimsel_arastirma_ve_ceviri_projeleri_yonergesi.pdf
teblig-yatirim_tesvik_uygulamalari.pdf""".split()
out = pathlib.Path("tara/metin"); out.mkdir(parents=True, exist_ok=True)
for ad in URLS:
    url = "https://www.yatirimadestek.gov.tr/pdf/assets/upload/dosyalar/" + ad
    x = requests.get(url, headers={"User-Agent": UA}, timeout=90)
    if not x.ok or x.content[:4] != b"%PDF": print(ad, "indirilemedi", x.status_code); continue
    with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
        f.write(x.content); f.flush()
        t = subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True).stdout
    sayfalar = t.split("\f")
    (out / (ad[:-4] + ".txt")).write_text("".join(f"\n=== SAYFA {i} ===\n{s}" for i, s in enumerate(sayfalar, 1) if s.strip()), encoding="utf-8")
    print(ad, len(sayfalar), "sayfa")
