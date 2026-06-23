-- 0002_demo_roles.sql — make the demo accounts' roles automatic + self-healing.
--
-- Why: assigning the demo roles was a manual post-setup step (the commented UPDATEs at the
-- end of 0001_init.sql). It's easy to miss, so the demo admin/moderator can end up as a plain
-- 'viewer' — or with no profiles row at all, which shows as "no role" in the UI and blocks
-- every moderation action. This bakes the demo roles into the signup trigger AND backfills
-- the existing demo users so it's correct now and stays correct if the users are recreated.
--
-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).

-- 1. The signup trigger now grants the two demo accounts their roles automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case new.email
      when 'admin@demo.test' then 'admin'
      when 'mod@demo.test'   then 'moderator'
      else 'viewer'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Backfill the existing demo users — insert a profiles row if it's missing, or correct
--    the role if it's stuck at 'viewer'. Idempotent: safe to re-run.
insert into public.profiles (id, email, role)
select id, email, 'admin' from auth.users where email = 'admin@demo.test'
on conflict (id) do update set role = excluded.role, email = excluded.email;

insert into public.profiles (id, email, role)
select id, email, 'moderator' from auth.users where email = 'mod@demo.test'
on conflict (id) do update set role = excluded.role, email = excluded.email;
