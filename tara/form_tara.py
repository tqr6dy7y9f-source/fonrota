"""Başvuru bağlantılarında girişsiz, doldurulabilir form var mı? (herkese açık sayfalar; hiçbir form gönderilmez)"""
import asyncio, json
from playwright.async_api import async_playwright
L = json.load(open("tara/form_liste.json")); DOLDUR = open("tara/doldur.js").read()
P = {"firmaUnvani": "Deneme Ltd", "vkn": "1111111111", "vergiDairesi": "Samsun", "sirketTuru": "Limited şirket", "kurulusYili": "2018", "naceKodu": "31.00.01", "calisan": "25", "ciro": "1000", "yetkili": "Ad Soyad", "telefon": "05000000000", "eposta": "a@b.c", "il": "Samsun", "adres": "Adres"}
UA = "Mozilla/5.0 (compatible; FonRota/1.0; +https://tqr6dy7y9f-source.github.io/fonrota/)"
async def incele(page, url):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000); await page.wait_for_timeout(3500)
    except Exception as e:
        return {"url": url, "hata": str(e)[:80]}
    r = await page.evaluate("""() => {
      const vis = e => e.offsetParent !== null && !e.disabled;
      const inp = [...document.querySelectorAll('input,select,textarea')].filter(vis).filter(e => !/^(hidden|submit|button|search|image|reset)$/i.test(e.type||''));
      const sifre = inp.some(e => e.type === 'password');
      const baglanti = [...document.querySelectorAll('a[href]')].filter(a => /başvur|basvur|başvuru formu|online başvuru|form/i.test(a.textContent) && !/pdf|docx?$/i.test(a.href)).map(a => ({t: a.textContent.trim().slice(0,60), h: a.href})).slice(0, 6);
      return { alan: inp.length, sifre, baglanti, baslik: document.title.slice(0, 80), url: location.href };
    }""")
    if r["alan"] and not r["sifre"]:
        try:
            await page.add_script_tag(content=DOLDUR)
            s = await page.evaluate("p => window.__fonrota.doldur(p, {}, false)", P); r["dolan"] = s["dolan"]
        except Exception as e: r["dolan_hata"] = str(e)[:60]
    return r
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); ctx = await b.new_context(user_agent=UA, ignore_https_errors=True)
        sem = asyncio.Semaphore(4); out = {}
        async def is_(url):
            async with sem:
                p = await ctx.new_page(); r = await incele(p, url); alt = []
                for l in (r.get("baglanti") or [])[:3]:
                    if l["h"].split("#")[0] != url.split("#")[0]: alt.append({**await incele(p, l["h"]), "metin": l["t"]})
                r["alt"] = alt; out[url] = r; await p.close(); print(url[:70], r.get("alan"), r.get("sifre"), len(r.get("dolan") or []), [ (a.get("alan"), a.get("sifre"), len(a.get("dolan") or [])) for a in alt], flush=True)
        await asyncio.gather(*[is_(u) for u in sorted({x["url"] for x in L})])
        json.dump(out, open("tara/form_sonuc.json", "w"), ensure_ascii=False, indent=1); await b.close()
asyncio.run(main())
