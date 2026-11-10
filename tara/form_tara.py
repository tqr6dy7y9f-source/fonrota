import requests, re, html
r = requests.get("https://remakeizmir.com/blog/tubitak-2209-a-arastirma-onerisi-formu-ornegi", headers={"User-Agent": "Mozilla/5.0 (compatible; FonRota/1.0)"}, timeout=60)
print(r.status_code, len(r.text))
t = re.sub(r"(?is)<(script|style|noscript).*?</\1>", " ", r.text)
t = re.sub(r"(?i)<(br|/p|/h\d|/li|/tr)>", "\n", t); t = re.sub(r"(?i)<li[^>]*>", "• ", t); t = re.sub(r"(?i)<h(\d)[^>]*>", lambda m: "\n" + "#" * int(m[1]) + " ", t)
t = html.unescape(re.sub(r"<[^>]+>", " ", t)); t = re.sub(r"[ \t]+", " ", t); t = re.sub(r"\n\s*\n+", "\n", t)
open("tara/remake.txt", "w", encoding="utf-8").write(t)
