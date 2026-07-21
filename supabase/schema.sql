-- ============================================================
-- FootyTeam — Database schema (v1)
-- ตารางขึ้นต้นด้วย prefix ft_ เพื่อกันชนกับแอปอื่นใน database เดียวกัน
-- วิธีใช้: เปิด Supabase → SQL Editor → วางทั้งไฟล์นี้ → Run
-- v1 เปิดใช้แบบไม่ต้อง login: RLS เปิดอยู่ แต่ policy อนุญาต anon ทั้ง read/write
-- เมื่อจะเพิ่ม auth/role ทีหลัง ค่อยแก้ policy ให้รัดกุมขึ้น (ดูหมายเหตุท้ายไฟล์)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tables ----------
create table if not exists public.ft_players (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  jersey_number integer,
  position      text,                       -- GK / DF / MF / FW หรือกำหนดเอง
  status        text not null default 'available', -- available / injured / unavailable / resting
  photo_url     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.ft_venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);

create table if not exists public.ft_matches (
  id             uuid primary key default gen_random_uuid(),
  match_date     date not null,
  match_time     time,
  venue_id       uuid references public.ft_venues(id) on delete set null,
  venue_name     text,                       -- เก็บชื่อสนามแบบพิมพ์เองด้วย (เผื่อไม่ผูก venue)
  opponent       text,
  score_us       integer,
  score_opponent integer,
  created_at     timestamptz not null default now()
);

create table if not exists public.ft_match_registrations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.ft_matches(id) on delete cascade,
  player_id  uuid not null references public.ft_players(id) on delete cascade,
  status     text not null default 'going',  -- going / not_going
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table if not exists public.ft_story_photos (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.ft_matches(id) on delete cascade,
  photo_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);

create table if not exists public.ft_formations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                  -- เช่น 4-4-2, 4-3-3
  match_id   uuid references public.ft_matches(id) on delete set null,
  data       jsonb not null default '{"positions":[]}'::jsonb,
  created_at timestamptz not null default now()
);

-- โซเชียลของสตอรี่ (ไลค์/รีแอค + คอมเมนต์) — v1 ใช้ device_id แทน user
create table if not exists public.ft_reactions (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.ft_matches(id) on delete cascade,
  device_id  text not null,
  type       text not null default 'like',   -- like/love/haha/wow/sad/angry
  created_at timestamptz not null default now(),
  unique (match_id, device_id)
);

create table if not exists public.ft_comments (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.ft_matches(id) on delete cascade,
  parent_id   uuid references public.ft_comments(id) on delete cascade, -- reply
  device_id   text,
  author_name text not null default 'ผู้เล่น',
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists idx_ft_matches_date on public.ft_matches(match_date desc);
create index if not exists idx_ft_reg_match on public.ft_match_registrations(match_id);
create index if not exists idx_ft_reg_player on public.ft_match_registrations(player_id);
create index if not exists idx_ft_story_match on public.ft_story_photos(match_id);
create index if not exists idx_ft_formations_match on public.ft_formations(match_id);
create index if not exists idx_ft_reactions_match on public.ft_reactions(match_id);
create index if not exists idx_ft_comments_match on public.ft_comments(match_id);
create index if not exists idx_ft_comments_parent on public.ft_comments(parent_id);

-- ---------- RLS (v1: เปิดให้ anon ทำได้ทุกอย่าง) ----------
alter table public.ft_players             enable row level security;
alter table public.ft_venues              enable row level security;
alter table public.ft_matches             enable row level security;
alter table public.ft_match_registrations enable row level security;
alter table public.ft_story_photos        enable row level security;
alter table public.ft_formations          enable row level security;
alter table public.ft_reactions           enable row level security;
alter table public.ft_comments            enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ft_players','ft_venues','ft_matches','ft_match_registrations','ft_story_photos','ft_formations',
    'ft_reactions','ft_comments'
  ] loop
    execute format('drop policy if exists "anon_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "anon_all_%1$s" on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------- Table privileges (GRANT) ----------
-- จำเป็นนอกเหนือจาก RLS: บาง project ตั้ง default ให้ anon แค่ SELECT
-- ต้อง grant write ให้ครบ ไม่งั้น insert/update/delete จะโดน "permission denied" (42501)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.ft_players,
  public.ft_venues,
  public.ft_matches,
  public.ft_match_registrations,
  public.ft_story_photos,
  public.ft_formations,
  public.ft_reactions,
  public.ft_comments
  to anon, authenticated;

-- ---------- Storage bucket สำหรับรูปภาพ ----------
insert into storage.buckets (id, name, public)
values ('ft_photos', 'ft_photos', true)
on conflict (id) do update set public = true;

drop policy if exists "ft_photos_anon_read"   on storage.objects;
drop policy if exists "ft_photos_anon_write"  on storage.objects;
drop policy if exists "ft_photos_anon_delete" on storage.objects;

create policy "ft_photos_anon_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'ft_photos');
create policy "ft_photos_anon_write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'ft_photos');
create policy "ft_photos_anon_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'ft_photos');

-- ============================================================
-- หมายเหตุ (เฟส 2 — เมื่อเพิ่ม auth/role):
--   เปลี่ยน policy จาก to anon เป็น to authenticated และเช็ค role
--   เช่น: using (auth.role() = 'authenticated')
--   หรือทำตาราง profiles(role) แล้วเช็ค role = 'admin' สำหรับ write
-- ============================================================
