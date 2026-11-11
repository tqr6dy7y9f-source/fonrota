import json, re, html, time, requests, urllib3
urllib3.disable_warnings()
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9"}
out = []
for u in json.load(open("tara/linkler2.json")):
    r = {"url": u}
    try:
        g = requests.get(u, headers=UA, timeout=40, verify=False); g.encoding = g.apparent_encoding or "utf-8"
        t = re.sub(r"(?is)<(script|style|noscript).*?</\1>", " ", g.text); t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t)))
        r.update(kod=g.status_code, son=g.url, baslik=(re.search(r"(?is)<title[^>]*>(.*?)</title>", g.text) or [None, ""])[1].strip()[:120], uzunluk=len(t))
        if "kosgeb" in u or "ufukavrupa" in u or "uluslararasi" in u:
            r["metin"] = t[:9000]; r["baglar"] = re.findall(r'href="([^"]+)"[^>]*>\s*([^<]{3,90})<', g.text)[:400]
    except Exception as e:
        r["hata"] = type(e).__name__ + ": " + str(e)[:100]
    out.append(r); time.sleep(0.5)
json.dump(out, open("dogrula/sonuc2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
