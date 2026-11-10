"""Kaynakça doğrulama: DOI'ler gerçekten var mı, başlık/yazar/yıl tutuyor mu (Crossref); DOI'siz kaynaklar Crossref aramasıyla."""
import json, requests
UA = {"User-Agent": "FonRota-kaynak-kontrol/1.0 (mailto:bot@users.noreply.github.com)"}
DOI = ["10.1080/10447310802205776", "10.1177/001316446002000104", "10.2307/2529310", "10.1080/10447318.2018.1455307", "10.1017/CBO9780511809071", "10.1002/pra2.323"]
ARA = ["Informing SMEs better about available support measures Yasuda", "Information frictions and firm take up of government support Custodio Hansman Mendes", "SUS a quick and dirty usability scale Brooke"]
out = {"doi": {}, "ara": {}}
for d in DOI:
    try:
        r = requests.get("https://api.crossref.org/works/" + d, headers=UA, timeout=40)
        if r.ok:
            m = r.json()["message"]; out["doi"][d] = {"baslik": (m.get("title") or [""])[0], "yazar": [a.get("family") for a in m.get("author", [])][:4], "yil": (m.get("issued", {}).get("date-parts") or [[None]])[0][0], "dergi": (m.get("container-title") or [""])[0], "cilt": m.get("volume"), "sayi": m.get("issue"), "sayfa": m.get("page")}
        else: out["doi"][d] = {"durum": r.status_code}
    except Exception as e: out["doi"][d] = {"hata": str(e)[:80]}
for q in ARA:
    try:
        r = requests.get("https://api.crossref.org/works", params={"query.bibliographic": q, "rows": 3}, headers=UA, timeout=40)
        out["ara"][q] = [{"baslik": (i.get("title") or [""])[0], "yazar": [a.get("family") for a in i.get("author", [])][:4], "yil": (i.get("issued", {}).get("date-parts") or [[None]])[0][0], "doi": i.get("DOI"), "tur": i.get("type")} for i in r.json()["message"]["items"]]
    except Exception as e: out["ara"][q] = str(e)[:80]
json.dump(out, open("tara/kaynak_sonuc.json", "w"), ensure_ascii=False, indent=1); print(json.dumps(out, ensure_ascii=False, indent=1))
