import asyncio, json
from playwright.async_api import async_playwright
DOLDUR = open("tara/doldur.js").read()
P = {"firmaUnvani": "Deneme Ltd", "vkn": "1111111111", "vergiDairesi": "Samsun", "sirketTuru": "Limited şirket", "kurulusYili": "2018", "naceKodu": "31.00.01", "calisan": "25", "ciro": "1000", "yetkili": "Ad Soyad", "telefon": "05000000000", "eposta": "a@b.c", "il": "Mardin", "adres": "Adres"}
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); out = {}
        for url in ["https://yatirim.dika.org.tr/", "https://girisimciform.dika.org.tr/"]:
            p = await b.new_page(user_agent="Mozilla/5.0 (compatible; FonRota/1.0)")
            await p.goto(url, wait_until="domcontentloaded", timeout=60000); await p.wait_for_timeout(4000)
            await p.add_script_tag(content=DOLDUR); await p.evaluate("p => window.__fonrota.doldur(p, {}, false)", P)
            out[url] = await p.evaluate("""() => [...document.querySelectorAll('input,select,textarea')].filter(e => e.offsetParent !== null && !/^(hidden|submit|button)$/i.test(e.type||'')).map(e => {
              const lab = (e.id && document.querySelector('label[for="'+e.id+'"]')) || e.closest('label') || e.closest('.form-group,.col,.row,td,div')?.querySelector('label');
              return { tag: e.tagName, type: e.type, name: e.name, id: e.id, ph: e.placeholder, etiket: (lab ? lab.textContent : '').trim().slice(0,80), dolan: e.dataset.fonrota || '', secenek: e.tagName==='SELECT' ? [...e.options].slice(0,6).map(o=>o.text.trim()).join(' | ') : '' }; })""")
            out[url + "#baslik"] = await p.title()
            await p.screenshot(path="tara/" + url.split("//")[1].split(".")[0] + ".png", full_page=True); await p.close()
        json.dump(out, open("tara/form_alanlar.json", "w"), ensure_ascii=False, indent=1); await b.close()
asyncio.run(main())
