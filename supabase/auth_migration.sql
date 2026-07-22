-- ============================================================
-- LGP MAX — Auth & Permissions migration (เฟส 2)
-- เปลี่ยนจาก "เปิดให้ทุกคน (anon)" → ต้อง login + เช็คสิทธิ์รายคน
--
-- วิธีใช้:
--   1) Supabase → SQL Editor → วางทั้งไฟล์นี้ → Run
--   2) Supabase → Authentication → Providers → Email → ปิด "Confirm email"
--      (เพราะใช้ synthetic email <username>@lgpmax.local ยืนยันไม่ได้)
--   3) สมัคร user แรกในแอป แล้วรัน bootstrap ท้ายไฟล์ (แก้ username) เพื่อตั้งตัวเองเป็นแอดมิน
-- ============================================================

-- ---------- ตารางโปรไฟล์ผู้ใช้ ----------
create table if not exists public.ft_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  role         text not null default 'member',   -- 'admin' | 'member'
  status       text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
  player_id    uuid references public.ft_players(id) on delete set null,
  perms        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ---------- Trigger: สร้าง profile อัตโนมัติเมื่อสมัคร ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ft_profiles (user_id, username, display_name, perms)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name',
             new.raw_user_meta_data->>'username',
             split_part(new.email, '@', 1)),
    '{"players":{"view":true,"create":true,"edit":true,"delete":false},
      "matches":{"view":true,"create":true,"edit":true,"delete":false},
      "story":{"view":true,"create":true,"edit":true,"delete":false},
      "formation":{"view":true,"create":true,"edit":true,"delete":false}}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper functions (SECURITY DEFINER, bypass RLS) ----------
create or replace function public.ft_is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from ft_profiles where user_id = auth.uid() and status = 'approved');
$$;

create or replace function public.ft_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from ft_profiles
                where user_id = auth.uid() and status = 'approved' and role = 'admin');
$$;

create or replace function public.ft_my_player()
returns uuid language sql stable security definer set search_path = public as $$
  select player_id from ft_profiles where user_id = auth.uid();
$$;

create or replace function public.ft_can(_menu text, _action text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from ft_profiles
    where user_id = auth.uid() and status = 'approved'
      and (role = 'admin' or (perms -> _menu ->> _action)::boolean is true)
  );
$$;

grant execute on function public.ft_is_approved(), public.ft_is_admin(),
  public.ft_my_player(), public.ft_can(text, text) to anon, authenticated;

-- แอดมินตั้งรหัสผ่านใหม่ให้ผู้ใช้ (เช็คสิทธิ์ในฟังก์ชัน, อัปเดต auth.users โดยตรง)
create or replace function public.ft_admin_set_password(_user_id uuid, _new_password text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not ft_is_admin() then
    raise exception 'ต้องเป็นแอดมินเท่านั้น';
  end if;
  if length(_new_password) < 6 then
    raise exception 'รหัสผ่านอย่างน้อย 6 ตัว';
  end if;
  update auth.users
    set encrypted_password = crypt(_new_password, gen_salt('bf')),
        updated_at = now()
  where id = _user_id;
end;
$$;
grant execute on function public.ft_admin_set_password(uuid, text) to authenticated;

-- ---------- RLS: rewrite ทุกตาราง ft_* (authenticated + สิทธิ์) ----------
do $$
declare r record;
begin
  for r in select * from (values
    ('ft_players','players'),
    ('ft_venues','matches'),
    ('ft_matches','matches'),
    ('ft_match_registrations','matches'),
    ('ft_story_photos','story'),
    ('ft_reactions','story'),
    ('ft_comments','story'),
    ('ft_formations','formation')
  ) as t(tbl, menu) loop
    execute format('drop policy if exists "anon_all_%1$s" on public.%1$s;', r.tbl);
    execute format('drop policy if exists "sel_%1$s" on public.%1$s;', r.tbl);
    execute format('drop policy if exists "ins_%1$s" on public.%1$s;', r.tbl);
    execute format('drop policy if exists "upd_%1$s" on public.%1$s;', r.tbl);
    execute format('drop policy if exists "del_%1$s" on public.%1$s;', r.tbl);
    execute format(
      'create policy "sel_%1$s" on public.%1$s for select to authenticated using (ft_can(%2$L, ''view''));',
      r.tbl, r.menu);
    execute format(
      'create policy "ins_%1$s" on public.%1$s for insert to authenticated with check (ft_can(%2$L, ''create''));',
      r.tbl, r.menu);
    execute format(
      'create policy "upd_%1$s" on public.%1$s for update to authenticated using (ft_can(%2$L, ''edit'')) with check (ft_can(%2$L, ''edit''));',
      r.tbl, r.menu);
    execute format(
      'create policy "del_%1$s" on public.%1$s for delete to authenticated using (ft_can(%2$L, ''delete''));',
      r.tbl, r.menu);
  end loop;
end $$;

-- พิเศษ: ft_players update = แอดมิน หรือ แก้เฉพาะนักเตะที่ผูกกับตัวเอง
drop policy if exists "upd_ft_players" on public.ft_players;
create policy "upd_ft_players" on public.ft_players for update to authenticated
  using (ft_is_admin() or (ft_can('players','edit') and id = ft_my_player()))
  with check (ft_is_admin() or (ft_can('players','edit') and id = ft_my_player()));

-- ---------- RLS: ft_profiles ----------
alter table public.ft_profiles enable row level security;
drop policy if exists "sel_ft_profiles" on public.ft_profiles;
drop policy if exists "upd_ft_profiles" on public.ft_profiles;
-- เห็นเฉพาะโปรไฟล์ตัวเอง (แอดมินเห็นทั้งหมด)
create policy "sel_ft_profiles" on public.ft_profiles for select to authenticated
  using (user_id = auth.uid() or ft_is_admin());
-- แก้ไขได้เฉพาะแอดมิน (อนุมัติ/ผูกนักเตะ/ตั้งสิทธิ์/เปลี่ยน role)
create policy "upd_ft_profiles" on public.ft_profiles for update to authenticated
  using (ft_is_admin()) with check (ft_is_admin());

-- ---------- Grants ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.ft_players, public.ft_venues, public.ft_matches, public.ft_match_registrations,
  public.ft_story_photos, public.ft_reactions, public.ft_comments, public.ft_formations
  to authenticated;
grant select, update on public.ft_profiles to authenticated;
-- ปิดสิทธิ์ anon กับตารางข้อมูล (ต้อง login เท่านั้น)
revoke all on public.ft_players, public.ft_venues, public.ft_matches, public.ft_match_registrations,
  public.ft_story_photos, public.ft_reactions, public.ft_comments, public.ft_formations,
  public.ft_profiles from anon;

-- ---------- Storage: ft_photos (upload/delete ต้อง login+approved, อ่านผ่าน public URL) ----------
drop policy if exists "ft_photos_anon_read"   on storage.objects;
drop policy if exists "ft_photos_anon_write"  on storage.objects;
drop policy if exists "ft_photos_anon_delete" on storage.objects;
drop policy if exists "ft_photos_write"       on storage.objects;
drop policy if exists "ft_photos_delete"      on storage.objects;
create policy "ft_photos_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'ft_photos' and ft_is_approved());
create policy "ft_photos_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'ft_photos' and ft_is_approved());

-- ============================================================
-- BOOTSTRAP (รันครั้งเดียว หลังสมัคร user แรกในแอป — แก้ 'myusername'):
-- update public.ft_profiles
--   set role = 'admin', status = 'approved'
--   where username = 'myusername';
-- ============================================================
