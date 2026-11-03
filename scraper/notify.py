"""Yeni desteklere uygun kullanıcıları bulur; site içi bildirim, e-posta ve anlık bildirim gönderir.
GitHub Actions'ta scrape.py'den sonra çalışır. Gerekli gizli anahtarlar (Settings > Secrets > Actions):
SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, MAIL_FROM, SITE_URL, VAPID_PRIVATE_KEY, VAPID_SUBJECT
Eksik anahtar olan kanal atlanır."""
import json, os
from datetime import date
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent
ENV = os.environ.get
SB, KEY = ENV("SUPABASE_URL"), ENV("SUPABASE_SERVICE_KEY")
H = {"apikey": KEY or "", "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
SITE = (ENV("SITE_URL") or "https://tqr6dy7y9f-source.github.io/fonrota").rstrip("/")


def fits(x, p):
    """Sitedeki check() ile aynı mantık: kesin koşullar sağlanmalı."""
    if p.get("olcek") and p["olcek"] not in x["olcek"]: return False
    if p.get("il") and "tumu" not in x["il"] and p["il"] not in x["il"]: return False
    sek = p.get("sektorler") or []
    if sek and "tumu" not in x["sektor"] and not set(sek) & set(x["sektor"]): return False
    yil = str(p.get("kurulusYili") or "")
    if x.get("firma_yasi_max") and yil.isdigit() and date.today().year - int(yil) > x["firma_yasi_max"]: return False
    return True


def mail(to, items):
    if not ENV("RESEND_API_KEY") or not to: return
    rows = "".join(f'<li><a href="{SITE}/destek.html?id={x["id"]}">{x["ad"]}</a> – {x["kurum"]}</li>' for x in items)
    requests.post("https://api.resend.com/emails", headers={"Authorization": f"Bearer {ENV('RESEND_API_KEY')}"}, json={
        "from": ENV("MAIL_FROM"), "to": [to], "subject": f"Sana uygun {len(items)} yeni destek",
        "html": f"<p>Merhaba,</p><p>Profiline uyan yeni destekler yayımlandı:</p><ul>{rows}</ul><p><a href='{SITE}/hesap.html?sekme=bildirimler'>Tümünü gör</a></p>"}, timeout=20)


def push(user_id, items):
    if not ENV("VAPID_PRIVATE_KEY"): return
    from pywebpush import webpush, WebPushException
    subs = requests.get(f"{SB}/rest/v1/push_subscriptions?user_id=eq.{user_id}", headers=H, timeout=20).json()
    body = json.dumps({"title": "Sana uygun yeni destek", "body": items[0]["ad"] + (f" ve {len(items) - 1} destek daha" if len(items) > 1 else ""), "url": f"{SITE}/destek.html?id={items[0]['id']}"})
    for s in subs:
        try:
            webpush({"endpoint": s["endpoint"], "keys": s["keys"]}, body, vapid_private_key=ENV("VAPID_PRIVATE_KEY"), vapid_claims={"sub": ENV("VAPID_SUBJECT", "mailto:info@example.com")})
        except WebPushException as e:
            if e.response is not None and e.response.status_code in (404, 410):  # abonelik süresi dolmuş
                requests.delete(f"{SB}/rest/v1/push_subscriptions?endpoint=eq.{s['endpoint']}", headers=H, timeout=20)


def main():
    new_ids = json.loads((ROOT / "new_ids.json").read_text()) if (ROOT / "new_ids.json").exists() else []
    if not new_ids or not SB or not KEY:
        print("Bildirim yok (yeni destek yok veya Supabase ayarlanmamış)."); return
    data = {x["id"]: x for x in json.loads((ROOT.parent / "data.json").read_text(encoding="utf-8"))["destekler"]}
    new = [data[i] for i in new_ids if i in data]
    profiles = requests.get(f"{SB}/rest/v1/profiles?select=id,data,notify_email", headers=H, timeout=30).json()
    sent = 0
    for pr in profiles:
        p = pr["data"] or {}
        items = [x for x in new if fits(x, p)]
        if not items: continue
        requests.post(f"{SB}/rest/v1/notifications", headers={**H, "Prefer": "resolution=ignore-duplicates"},
                      json=[{"user_id": pr["id"], "program_id": x["id"]} for x in items], timeout=20)
        if pr.get("notify_email"): mail(p.get("eposta"), items)
        if p.get("bildirimAnlik"): push(pr["id"], items)
        sent += 1
    print(f"{len(new)} yeni destek, {sent} kullanıcıya bildirildi.")


if __name__ == "__main__":
    main()
