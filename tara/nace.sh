#!/bin/bash
mkdir -p tara/nace && cd tara/nace || exit 1
UA="Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
rm -f tuik*.html turmob.pdf ticaret_dosya_*.pdf
curl -sL -m 120 -A "$UA" -o sektor_meslek_nace.xlsx -w "%{http_code} %{content_type} %{size_download}\n" "https://ticaret.gov.tr/data/5d418c7e13b87639ac9dffe0/2026/Sekt%C3%B6r%20Meslek%20Nace%20Kodlar%C4%B1_2026.03.xlsx" > liste.txt
cat liste.txt
