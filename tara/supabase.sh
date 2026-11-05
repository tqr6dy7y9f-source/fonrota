#!/bin/bash
# profiles tablosunda e-posta/ad sütunları var mı? (herkese açık anahtarla, veri okumadan: limit=0)
U="https://gebuzyferpvlzturxoyu.supabase.co"; K="sb_publishable_pI798Yv3sQ47VMbJE7yuhw_-y-ct6TF"
{
for c in id email ad data notify_email created_at updated_at; do
  echo "== profiles.$c"; curl -s -m 30 -w " [%{http_code}]" "$U/rest/v1/profiles?select=$c&limit=0" -H "apikey: $K" -H "Authorization: Bearer $K"; echo
done
echo "== auth/settings"; curl -s -m 30 "$U/auth/v1/settings" -H "apikey: $K" | grep -o '"disable_signup":[a-z]*\|"mailer_autoconfirm":[a-z]*'
} > tara/supabase.txt 2>&1
cat tara/supabase.txt
