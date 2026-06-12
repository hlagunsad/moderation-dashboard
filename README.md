# Moderation Dashboard

A Trust &amp; Safety **review queue** for user-generated content — flag, review, act, and keep an **audit log** — with **role-based access** enforced at the database via Supabase Row-Level Security.

**Live demo:** https://moderation-dashboard-one.vercel.app (demo logins shown on the sign-in page)
**Full write-up:** [EXPLAINER.md](./EXPLAINER.md)

## What it is (short version)
Any app with posts, comments, or profiles collects bad content — spam, harassment, scams. Reported or auto-flagged items land in a **queue**; **moderators** review each one and **approve / remove / escalate** it (admins can also **ban** the author). Every action is written to an append-only **audit log**.

**Core loop:** report → review in the queue → take an action → recorded in the audit log → resolved.

## Roles
| Role | Can do |
|------|--------|
| **Viewer** | Read-only (queue + audit log). New sign-ups start here. |
| **Moderator** | Approve / remove / escalate. |
| **Admin** | Everything, plus ban users. |

Roles are enforced by **Postgres Row-Level Security**, so the database refuses disallowed actions even if the UI is bypassed — hiding the buttons is just a convenience on top of the real guard.

## Tech
Next.js (App Router) · TypeScript · Supabase (Postgres + Auth + RLS) · Tailwind CSS · Vitest (unit) · Playwright (E2E).

## Run locally
```bash
npm install

# 1. Create .env.local with your Supabase credentials:
#    NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
#    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# 2. In the Supabase SQL Editor, run supabase/migrations/0001_init.sql
#    (creates the tables, RLS policies, and seed data)

npm run dev     # http://localhost:3000
npm test        # unit tests (Vitest)
```

## Tests
- **Unit (Vitest):** the role-permission logic in `src/lib/permissions.ts` — verifies that viewers can't act, moderators can't ban, and admins can. Mirrors the database RLS policy.
- **End-to-end (Playwright):** sign in → act on a flagged item → see the audit entry. _(in progress)_
