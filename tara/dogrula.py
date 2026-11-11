"""Her programın kurum tarafındaki bağlantılarını açar: erişim durumu + 'başvuru alınmıyor / sona erdi' gibi ifadeler."""
import json, re, html, sys, time, collections
import requests, urllib3
urllib3.disable_warnings()
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", "Accept-Language": "tr-TR,tr;q=0.9"}
D = requests.get("https://raw.githubusercontent.com/tqr6dy7y9f-source/fonrota/main/data.json", timeout=60).json()["destekler"]
KAPALI = r"başvuru(?:lar)?\s*(?:ı)?\s*alınma(?:makta|yacak|mış)|yeni başvuru alınm|sona er(?:miş|di)|kapan(?:mış|dı)|kapatıl(?:mış|dı)|yürürlükten kald|durdurul(?:muş|du)|tamamlan(?:mış|ması öngör)|başvurular? (?:kabulü )?(?:sona|bit)|süresi dol|uygulanmamakta|kaldırılmıştır|program(?:ı)? sonlan|mülga"
def temiz(t):
    t = re.sub(r"(?is)<(script|style|noscript).*?</\1>", " ", t); t = html.unescape(re.sub(r"<[^>]+>", " ", t)); return re.sub(r"\s+", " ", t)
def linkler(x):
    b = x.get("basvuru") or {}; u = [b.get("online"), b.get("form")]
    if x.get("kaynak") != "platform": u.append(x.get("url"))
    for bl in (x.get("resmi") or {}).get("bolumler", []): u += re.findall(r"https?://[^\s)]+(?:\s[A-Za-zıİ][^\s)]*)?", bl.get("metin", ""))
    for a in b.get("adimlar") or []: u += re.findall(r"https?://[^\s)]+(?:\s[A-Za-zıİ][^\s)]*)?", a)
    out = []
    for z in filter(None, u):
        z = z.strip().rstrip(".,;")
        if " " in z:  # platform metninde satır sonunda bölünmüş bağlantı: "…/Tarla-Ve-Bahce- Bitkileri/CATAK"
            a, b2 = z.split(" ", 1); z = a + b2 if a.endswith("-") or a.endswith("/") else a
        if "yatirimadestek.gov.tr" not in z and z not in out: out.append(z)
    return out
onbellek = {}
def ac(u):
    if u in onbellek: return onbellek[u]
    r = {"url": u}
    for dene in range(2):
        try:
            g = requests.get(u, headers=UA, timeout=45, verify=False, allow_redirects=True)
            r.update(kod=g.status_code, son=g.url, tur=g.headers.get("content-type", "")[:40], boyut=len(g.content))
            if "html" in r["tur"] or "text" in r["tur"]:
                g.encoding = g.apparent_encoding or "utf-8"; t = temiz(g.text); r["uzunluk"] = len(t)
                r["ifade"] = [t[max(0, m.start() - 160):m.end() + 160] for m in re.finditer(KAPALI, t, re.I)][:6]
                r["tarih"] = list(dict.fromkeys(re.findall(r"(?:son başvuru|başvuru(?:lar)? (?:için )?son|bitiş)[^.]{0,60}?(\d{1,2}[ ./]\s?(?:\d{1,2}|Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)[ ./]\s?20\d\d)", t, re.I)))[:5]
                r["baslik"] = (re.search(r"(?is)<title[^>]*>(.*?)</title>", g.text) or [None, ""])[1].strip()[:120]
            break
        except Exception as e:
            r["hata"] = type(e).__name__ + ": " + str(e)[:120]; time.sleep(3)
    onbellek[u] = r; time.sleep(0.6); return r
sonuc = []
for x in D:
    ls = linkler(x)
    sonuc.append({"id": x["id"], "ad": x["ad"], "kurum": x["kurum"], "kaynak": x.get("kaynak"), "son_basvuru": x.get("son_basvuru"), "guncelleme": (x.get("resmi") or {}).get("guncelleme"), "linkler": [ac(u) for u in ls]})
    print(x["id"], len(ls), flush=True)
json.dump(sonuc, open("dogrula/sonuc.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
k = collections.Counter(str(l.get("kod") or "HATA") for s in sonuc for l in s["linkler"]); print(k)
