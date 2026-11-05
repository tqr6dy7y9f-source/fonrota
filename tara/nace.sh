#!/bin/bash
mkdir -p tara/nace && cd tara/nace || exit 1
python3 - <<'PY'
import requests, time
UA = "Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
url = "https://ticaret.gov.tr/data/5d418c7e13b87639ac9dffe0/2026/Sektör Meslek Nace Kodları_2026.03.xlsx"
for i in range(4):
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=180)
        print(i, r.status_code, r.headers.get("content-type"), len(r.content), flush=True)
        if r.ok and r.content[:2] == b"PK":
            open("sektor_meslek_nace.xlsx", "wb").write(r.content); break
    except Exception as e:
        print(i, "hata", e, flush=True)
    time.sleep(10)
PY
