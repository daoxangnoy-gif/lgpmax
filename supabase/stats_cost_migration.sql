-- ============================================================
-- LGP MAX — สถิติผู้เล่น + หารค่าใช้จ่าย
-- รันใน Supabase → SQL Editor → Run
-- ============================================================

-- ---------- สถิติต่อนัดต่อผู้เล่น (ประตู/assist/ใบเหลือง/ใบแดง) ----------
create table if not exists public.ft_match_stats (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.ft_matches(id) on delete cascade,
  player_id  uuid not null references public.ft_players(id) on delete cascade,
  goals      integer not null default 0,
  assists    integer not null default 0,
  yellow     integer not null default 0,
  red        integer not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);
create index if not exists idx_ft_match_stats_match  on public.ft_match_stats(match_id);
create index if not exists idx_ft_match_stats_player on public.ft_match_stats(player_id);

-- ---------- ค่าใช้จ่ายต่อนัด (ค่าสนาม/ลูกบอล ฯลฯ) ----------
alter table public.ft_matches add column if not exists cost numeric not null default 0;

-- ---------- RLS + grants (map → เมนู matches) ----------
alter table public.ft_match_stats enable row level security;
drop policy if exists "sel_ft_match_stats" on public.ft_match_stats;
drop policy if exists "ins_ft_match_stats" on public.ft_match_stats;
drop policy if exists "upd_ft_match_stats" on public.ft_match_stats;
drop policy if exists "del_ft_match_stats" on public.ft_match_stats;
create policy "sel_ft_match_stats" on public.ft_match_stats for select to authenticated
  using (ft_can('matches','view'));
create policy "ins_ft_match_stats" on public.ft_match_stats for insert to authenticated
  with check (ft_can('matches','edit'));
create policy "upd_ft_match_stats" on public.ft_match_stats for update to authenticated
  using (ft_can('matches','edit')) with check (ft_can('matches','edit'));
create policy "del_ft_match_stats" on public.ft_match_stats for delete to authenticated
  using (ft_can('matches','edit'));

grant select, insert, update, delete on public.ft_match_stats to authenticated;
revoke all on public.ft_match_stats from anon;
