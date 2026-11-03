-- Supabase > SQL Editor'de bir kez çalıştırın.
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}',
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
