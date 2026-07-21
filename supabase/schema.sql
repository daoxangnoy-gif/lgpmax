-- ============================================================
-- FootyTeam — Database schema (v1)
-- วิธีใช้: เปิด Supabase → SQL Editor → วางทั้งไฟล์นี้ → Run
-- v1 เปิดใช้แบบไม่ต้อง login: RLS เปิดอยู่ แต่ policy อนุญาต anon ทั้ง read/write
-- เมื่อจะเพิ่ม auth/role ทีหลัง ค่อยแก้ policy ให้รัดกุมขึ้น (ดูหมายเหตุท้ายไฟล์)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tables ----------
create table if not exists public.players (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  jersey_number integer,
  position      text,                       -- GK / DF / MF / FW หรือกำหนดเอง
  status        text not null default 'available', -- available / injured / unavailable / resting
  photo_url     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  match_date     date not null,
  match_time     time,
  venue_id       uuid references public.venues(id) on delete set null,
  venue_name     text,                       -- เก็บชื่อสนามแบบพิมพ์เองด้วย (เผื่อไม่ผูก venue)
  opponent       text,
  score_us       integer,
  score_opponent integer,
  created_at     timestamptz not null default now()
);

create table if not exists public.match_registrations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  status     text not null default 'going',  -- going / not_going
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists public.story_photos (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  photo_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);

create table if not exists public.formations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                  -- เช่น 4-4-2, 4-3-3
  match_id   uuid references public.matches(id) on delete set null,
  data       jsonb not null default '{"positions":[]}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists idx_matches_date on public.matches(match_date desc);
create index if not exists idx_reg_match on public.match_registrations(match_id);
create index if not exists idx_reg_player on public.match_registrations(player_id);
create index if not exists idx_story_match on public.story_photos(match_id);
create index if not exists idx_formations_match on public.formations(match_id);

-- ---------- RLS (v1: เปิดให้ anon ทำได้ทุกอย่าง) ----------
alter table public.players             enable row level security;
alter table public.venues              enable row level security;
alter table public.matches             enable row level security;
alter table public.match_registrations enable row level security;
alter table public.story_photos        enable row level security;
alter table public.formations          enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'players','venues','matches','match_registrations','story_photos','formations'
  ] loop
    execute format('drop policy if exists "anon_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "anon_all_%1$s" on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------- Storage bucket สำหรับรูปภาพ ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos_anon_read"   on storage.objects;
drop policy if exists "photos_anon_write"  on storage.objects;
drop policy if exists "photos_anon_delete" on storage.objects;

create policy "photos_anon_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'photos');
create policy "photos_anon_write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "photos_anon_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'photos');

-- ============================================================
-- หมายเหตุ (เฟส 2 — เมื่อเพิ่ม auth/role):
--   เปลี่ยน policy จาก to anon เป็น to authenticated และเช็ค role
--   เช่น: using (auth.role() = 'authenticated')
--   หรือทำตาราง profiles(role) แล้วเช็ค role = 'admin' สำหรับ write
-- ============================================================
