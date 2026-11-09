"""Kurumların online başvuru sistemleri: adres açılıyor mu, nereye yönleniyor, giriş ekranı var mı? (yalnızca açılış sayfası)"""
import asyncio, json
from playwright.async_api import async_playwright
ADAY = {
 "KOSGEB e-Hizmetler": "https://edevlet.kosgeb.gov.tr/",
 "Ticaret Bakanlığı DYS": "https://dys.ticaret.gov.tr/",
 "TÜBİTAK TEYDEB": "https://eteydeb.tubitak.gov.tr/",
 "TÜBİTAK ARDEB PBS": "https://ardeb-pbs.tubitak.gov.tr/",
 "TÜBİTAK ARBİS": "https://arbis.tubitak.gov.tr/",
 "Kalkınma Ajansları KAYS": "https://kays.kalkinma.gov.tr/",
 "Sanayi Bakanlığı E-TUYS": "https://etuys.sanayi.gov.tr/",
 "İŞKUR e-Şube": "https://esube.iskur.gov.tr/",
 "SGK İşveren Sistemi": "https://uyg.sgk.gov.tr/IsverenSistemi",
 "e-Devlet": "https://www.turkiye.gov.tr/",
 "TEDA": "https://teda.ktb.gov.tr/",
 "OGM e-Devlet": "https://edevlet.ogm.gov.tr/",
 "TARSİM": "https://web.tarsim.gov.tr/",
 "Eximbank": "https://www.eximbank.gov.tr/",
 "KGF": "https://www.kgf.com.tr/",
 "Ufuk Avrupa": "https://ufukavrupa.org.tr/",
}
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); out = {}
        for ad, url in ADAY.items():
            p = await b.new_page(user_agent="Mozilla/5.0 (compatible; FonRota/1.0)", ignore_https_errors=True)
            try:
                r = await p.goto(url, wait_until="domcontentloaded", timeout=45000); await p.wait_for_timeout(3000)
                info = await p.evaluate("""() => ({ baslik: document.title.slice(0, 90), url: location.href,
                  sifre: !!document.querySelector('input[type=password]'),
                  edevlet: /e-?devlet|turkiye\\.gov\\.tr|giriş yap|giris yap|oturum aç/i.test(document.body.innerText.slice(0, 20000)),
                  alan: document.querySelectorAll('input:not([type=hidden]),select,textarea').length })""")
                out[ad] = {"aday": url, "durum": r.status if r else None, **info}
            except Exception as e:
                out[ad] = {"aday": url, "hata": str(e)[:100]}
            print(ad, json.dumps(out[ad], ensure_ascii=False), flush=True); await p.close()
        json.dump(out, open("tara/portal_sonuc.json", "w"), ensure_ascii=False, indent=1); await b.close()
asyncio.run(main())
