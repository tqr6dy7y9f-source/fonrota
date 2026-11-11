"""Form adaylarını indirir; .doc -> .docx (LibreOffice). Çıktı: formlar/<hedef>.<uz> + formlar/sonuc.json"""
import json, subprocess, tempfile, shutil
from pathlib import Path
import requests
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
O = Path("formlar"); O.mkdir(exist_ok=True); sonuc = []
for a in json.load(open("tara/form_adaylar.json", encoding="utf-8")):
    r = {"hedef": a["hedef"], "ad": a["ad"], "url": a["url"]}
    try:
        g = requests.get(a["url"], headers=UA, timeout=60); b = g.content; uz = a["uz"]; r["kod"] = g.status_code; r["bas"] = b[:4].hex()
        if uz == "doc" and b[:2] == b"\xd0\xcf":
            with tempfile.TemporaryDirectory() as t:
                (Path(t) / "f.doc").write_bytes(b)
                p = subprocess.run(["soffice", "--headless", "--convert-to", "docx", "--outdir", t, str(Path(t) / "f.doc")], capture_output=True, text=True, timeout=180)
                if (Path(t) / "f.docx").exists(): b = (Path(t) / "f.docx").read_bytes(); uz = "docx"
                else: r["hata"] = p.stderr[-300:]
        ok = (uz == "pdf" and b[:4] == b"%PDF") or (uz == "docx" and b[:2] == b"PK")
        if ok: (O / f"{a['hedef']}.{uz}").write_bytes(b); r["dosya"] = f"forms/{a['hedef']}.{uz}"; r["tur"] = uz
    except Exception as e: r["hata"] = str(e)[:200]
    sonuc.append(r); print(r)
json.dump(sonuc, open(O / "sonuc.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
