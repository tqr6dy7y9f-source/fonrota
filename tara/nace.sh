#!/bin/bash
# GİB faaliyet (NACE) listesi sayfalarını indir (herkese açık resmi liste)
B="https://www.gib.gov.tr/fileadmin/HTML/FaaliyetListesi"
UA="Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
cd tara/nace
for f in index.htm index.html a.htm b.htm c.htm d.htm e.htm f.htm g.htm h.htm i.htm j.htm k.htm l.htm m.htm n.htm o.htm p.htm q.htm r.htm s.htm t.htm u.htm; do
  code=$(curl -s -m 60 -A "$UA" -o "$f" -w "%{http_code}" "$B/$f"); echo "$f $code $(wc -c < "$f" 2>/dev/null)"; [ "$code" = "200" ] || rm -f "$f"
done > liste.txt
cat liste.txt
