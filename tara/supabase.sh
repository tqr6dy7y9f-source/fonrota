#!/bin/bash
# Supabase projesi açık mı, tablolar var mı, e-posta onayı gerekiyor mu? (yalnızca herkese açık anahtarla okuma)
U="https://gebuzyferpvlzturxoyu.supabase.co"; K="sb_publishable_pI798Yv3sQ47VMbJE7yuhw_-y-ct6TF"
{
echo "== auth/settings"; curl -s -m 30 "$U/auth/v1/settings" -H "apikey: $K"; echo
echo "== health"; curl -s -m 30 -o /dev/null -w "%{http_code}" "$U/auth/v1/health" -H "apikey: $K"; echo
for t in profiles applications notifications push_subscriptions; do
  echo "== $t"; curl -s -m 30 -w " [%{http_code}]" "$U/rest/v1/$t?select=*&limit=1" -H "apikey: $K" -H "Authorization: Bearer $K"; echo
done
} > tara/supabase.txt 2>&1
cat tara/supabase.txt
