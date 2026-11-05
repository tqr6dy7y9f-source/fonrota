#!/bin/bash
# NACE listesi için resmi kaynak keşfi (yalnızca herkese açık sayfalar)
mkdir -p tara/nace && cd tara/nace || exit 1
UA="Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
get() { code=$(curl -sL -m 90 -A "$UA" -o "$2" -w "%{http_code} %{content_type}" "$1"); echo "$2 <- $1 : $code $(wc -c < "$2")"; }
{
get "https://biruni.tuik.gov.tr/DIESS/SiniflamaSurumListeAction.do" tuik1.html
get "https://biruni.tuik.gov.tr/DIESS/SiniflamaListeAction.do" tuik2.html
get "https://biruni.tuik.gov.tr/DIESS/" tuik0.html
get "https://ticaret.gov.tr/esnaf-sanatkarlar/esnaf-ve-sanatkar-meslek-kollari/sektor-meslek-nace-listeleri/guncel-liste" ticaret.html
get "https://www.turmob.org.tr/mevzuat/Pdf/17613" turmob.pdf
get "https://www.gib.gov.tr/" gib.html
} > liste.txt 2>&1
# Ticaret sayfasındaki dosya bağlantılarını da indir
grep -oiE 'href="[^"]+\.(pdf|xlsx?|docx?)"' ticaret.html | sed -E 's/href="//I; s/"$//' | sort -u | head -20 > ticaret_linkler.txt
n=0; while read -r l; do n=$((n+1)); case "$l" in http*) u="$l";; /*) u="https://ticaret.gov.tr$l";; *) u="https://ticaret.gov.tr/$l";; esac; get "$u" "ticaret_dosya_$n.${l##*.}" >> liste.txt; done < ticaret_linkler.txt
grep -oiE 'href="[^"]*(nace|faaliyet)[^"]*"' gib.html | sort -u | head -30 > gib_linkler.txt
cat liste.txt ticaret_linkler.txt gib_linkler.txt
