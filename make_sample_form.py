"""Test için doldurulabilir ÖRNEK başvuru formu üretir (gerçek KOSGEB formu değildir)."""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import json
pdfmetrics.registerFont(TTFont("DV", "assets/fonts/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", "assets/fonts/DejaVuSans-Bold.ttf"))
W, H = A4
c = canvas.Canvas("forms/kosgeb-ornek-basvuru-formu.pdf", pagesize=A4)
c.setTitle("Örnek Destek Başvuru Formu")
c.setFillColorRGB(.72, .51, .16); c.rect(0, H-8, W, 8, fill=1, stroke=0)
c.setFillColorRGB(.07, .2, .23)
c.setFont("DVB", 15); c.drawString(40, H-50, "DESTEK PROGRAMI BAŞVURU FORMU")
c.setFont("DV", 8.5); c.setFillColorRGB(.55, .2, .2)
c.drawString(40, H-66, "ÖRNEK FORMDUR – sistem testi içindir, gerçek KOSGEB formu değildir.")
fields = [
 ("A. İŞLETME BİLGİLERİ", None),
 ("Firma ünvanı", "firma_unvani"), ("Vergi kimlik no", "vergi_no"), ("Vergi dairesi", "vergi_dairesi"),
 ("Şirket türü", "sirket_turu"), ("Kuruluş yılı", "kurulus_yili"), ("NACE kodu", "nace_kodu"),
 ("Çalışan sayısı", "calisan_sayisi"), ("Yıllık net satış (TL)", "yillik_ciro"), ("İşletme ölçeği", "olcek"),
 ("B. İLETİŞİM", None),
 ("Yetkili adı soyadı", "yetkili_adi"), ("Telefon", "telefon"), ("E-posta", "eposta"), ("İl", "il"), ("Adres", "adres"),
 ("C. PROJE", None),
 ("Proje adı", "proje_adi"), ("Proje süresi (ay)", "proje_suresi"), ("Proje bütçesi (TL)", "proje_butcesi"), ("Talep edilen destek (TL)", "talep_tutari"),
]
y = H-100; form = c.acroForm
for label, name in fields:
    if name is None:
        y -= 8; c.setFont("DVB", 10.5); c.setFillColorRGB(.07, .2, .23); c.drawString(40, y, label); y -= 20; continue
    c.setFont("DV", 9.5); c.setFillColorRGB(.2, .25, .27); c.drawString(40, y+5, label)
    form.textfield(name=name, x=200, y=y, width=355, height=18, borderWidth=0.6, borderColor=None, fillColor=colors.white, fontName="Helvetica", fontSize=10)
    y -= 26
c.setFont("DV", 9.5); c.drawString(40, y+5, "Proje özeti")
form.textfield(name="proje_ozeti", x=200, y=y-80, width=355, height=98, borderWidth=0.6, fillColor=colors.white, fontName="Helvetica", fontSize=9, fieldFlags="multiline")
y -= 120
c.drawString(40, y+5, "Tarih"); form.textfield(name="tarih", x=200, y=y, width=150, height=18, borderWidth=0.6, fillColor=colors.white, fontName="Helvetica", fontSize=10)
c.drawString(370, y+5, "İmza / Kaşe"); c.rect(440, y-30, 115, 48)
c.save()
json.dump({"firma_unvani":"firmaUnvani","vergi_no":"vkn","vergi_dairesi":"vergiDairesi","sirket_turu":"sirketTuru","kurulus_yili":"kurulusYili",
 "nace_kodu":"naceKodu","calisan_sayisi":"calisan","yillik_ciro":"ciro","olcek":"olcekAdi","yetkili_adi":"yetkili","telefon":"telefon","eposta":"eposta",
 "il":"il","adres":"adres","proje_adi":"projeAdi","proje_suresi":"projeSuresi","proje_butcesi":"projeButcesi","talep_tutari":"talepTutari",
 "proje_ozeti":"projeOzeti","tarih":"bugun"}, open("forms/maps/kosgeb-ornek-basvuru-formu.json","w"), ensure_ascii=False, indent=1)
print("ok")
