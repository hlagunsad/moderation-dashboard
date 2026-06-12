-- Moderation dashboard — schema, role helper, RLS policies, and seed data.
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).

-- ========================= Tables =========================

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'viewer' check (role in ('viewer','moderator','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.flagged_items (
  id           uuid primary key default gen_random_uuid(),
  content      text not null,
  content_type text not null default 'comment' check (content_type in ('post','comment','profile')),
  author       text,                       -- the user who created the flagged content
  reason       text not null,              -- why it was flagged
  reporter     text,                       -- who reported it (or 'auto-filter')
  severity     text not null default 'low'     check (severity in ('low','medium','high')),
  status       text not null default 'pending' check (status in ('pending','approved','removed','escalated')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references public.profiles(id)
);

create table if not exists public.moderation_actions (   -- the append-only audit log
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references public.flagged_items(id) on delete set null,
  actor_id    uuid references public.profiles(id),
  actor_email text,
  action      text not null check (action in ('approve','remove','escalate','ban')),
  note        text,
  created_at  timestamptz not null default now()
);

-- ===================== Role helper ========================
-- SECURITY DEFINER so it can read profiles without tripping RLS (avoids recursion).
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============ Auto-create a profile on signup =============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================= RLS ============================
alter table public.profiles          enable row level security;
alter table public.flagged_items     enable row level security;
alter table public.moderation_actions enable row level security;

-- profiles: any signed-in user can read (to show actor names in the audit log)
create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

-- flagged_items: signed-in users can read; only moderators/admins can act (update status)
create policy "items readable by authenticated"
  on public.flagged_items for select to authenticated using (true);

create policy "items updatable by moderators and admins"
  on public.flagged_items for update to authenticated
  using      (public.app_role() in ('moderator','admin'))
  with check (public.app_role() in ('moderator','admin'));

-- moderation_actions: signed-in users can read the audit log;
-- moderators/admins can insert actions, but 'ban' is admin-only.
create policy "actions readable by authenticated"
  on public.moderation_actions for select to authenticated using (true);

create policy "actions insertable by moderators and admins"
  on public.moderation_actions for insert to authenticated
  with check (
    public.app_role() in ('moderator','admin')
    and (action <> 'ban' or public.app_role() = 'admin')
  );

-- ===================== Seed sample data ===================
insert into public.flagged_items (content, content_type, author, reason, reporter, severity, status) values
  ('Buy cheap followers at spammy-link.example — limited time!', 'comment', 'user_8842', 'Spam / advertising',     'user_2201',   'medium', 'pending'),
  ('You are an idiot and should quit.',                          'comment', 'user_5530', 'Harassment',              'user_9012',   'high',   'pending'),
  ('Check out my totally legit crypto giveaway!!!',              'post',    'user_7781', 'Scam',                    'auto-filter', 'high',   'pending'),
  ('lol this is fine, not sure why anyone reported it',          'comment', 'user_3340', 'Reported by mistake',     'user_1199',   'low',    'pending'),
  ('Selling concert tickets, DM me to arrange payment',          'post',    'user_6610', 'Off-platform sales',      'user_4455',   'low',    'pending'),
  ('Here is their home address and phone number: ...',           'comment', 'user_2093', 'Doxxing / personal info', 'user_7788',   'high',   'pending')
on conflict do nothing;

-- ============ After creating the two demo users ===========
-- Create them in Auth (Dashboard → Authentication → Add user), then grant roles:
--   update public.profiles set role = 'admin'     where email = 'admin@demo.test';
--   update public.profiles set role = 'moderator' where email = 'mod@demo.test';
