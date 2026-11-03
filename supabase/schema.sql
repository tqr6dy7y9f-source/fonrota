-- Supabase > SQL Editor'de bir kez çalıştırın.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  ad text,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  notify_email boolean default true,
  updated_at timestamptz default now()
);
create table if not exists applications (
  user_id uuid references auth.users on delete cascade,
  program_id text not null,
  status text default 'Hazırlanıyor',
  values jsonb default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, program_id)
);
create table if not exists notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  program_id text not null,
  read boolean default false,
  created_at timestamptz default now(),
  unique (user_id, program_id)
);
create table if not exists push_subscriptions (
  user_id uuid references auth.users on delete cascade,
  endpoint text primary key,
  keys jsonb not null
);
alter table profiles enable row level security;
alter table applications enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;
create policy "kendi profilim" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "kendi başvurularım" on applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "kendi bildirimlerim" on notifications for select using (auth.uid() = user_id);
create policy "bildirim okundu" on notifications for update using (auth.uid() = user_id);
create policy "kendi aboneliklerim" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- notify.py service_role anahtarıyla çalışır; RLS'yi aşar ve bildirimleri ekler.

-- Daha önce eski şemayı çalıştırdıysanız eksik sütunları ekler.
alter table profiles add column if not exists email text;
alter table profiles add column if not exists ad text;
alter table profiles add column if not exists created_at timestamptz default now();

-- Her yeni kayıtta profil satırını otomatik oluşturur (e-posta onayı beklenirken de çalışır).
create or replace function public.yeni_kullanici() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, ad, data, notify_email)
  values (
    new.id, new.email, new.raw_user_meta_data->>'ad',
    coalesce(new.raw_user_meta_data->'profil', '{}'::jsonb),
    coalesce((new.raw_user_meta_data->'profil'->>'bildirimEposta')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists kullanici_olusunca on auth.users;
create trigger kullanici_olusunca after insert on auth.users
  for each row execute function public.yeni_kullanici();

-- Tüm kayıtlı hesapları görmek için (SQL Editor'de):
--   select email, ad, data->>'firmaUnvani' as firma, data->>'telefon' as telefon, created_at
--   from profiles order by created_at desc;
