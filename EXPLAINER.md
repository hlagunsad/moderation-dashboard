# Moderation Dashboard — what it is & how it works

A plain-English explainer of this project.

## In one paragraph
A **moderation dashboard** is the internal control room a **Trust & Safety** team uses to keep a product clean. Any app with user-generated content — posts, comments, profiles, messages — collects bad content: spam, harassment, scams, policy violations. Those items get **flagged** (a user reports them, or an automated filter catches them) and pile up in a **queue**. Human **moderators** work through the queue, review each item, and decide what to do: leave it up (approve), take it down (remove), escalate it, or ban the user. Every decision is **logged** so there's an accountable record of who did what and why.

**The core loop:** report comes in → a moderator reviews it in a queue → takes an action → the action is recorded in an audit log → the item is resolved.

## Who uses it & the day-to-day workflow
1. **Something gets flagged.** A row appears in the **review queue** with the content, the reason, who reported it, a **severity** (low / medium / high), and a status of **Pending**.
2. **A moderator signs in** and lands on the queue. They **filter** (by status or severity) to triage the worst first.
3. **They review an item** and choose an action:
   - **Approve** — it's fine; dismiss the report.
   - **Remove** — take the content down.
   - **Escalate** — hand it to a senior admin.
   - **Ban user** — *(admins only)* remove the content and ban the author.

   Several items can be handled at once with **bulk actions**.
4. **The system records it.** The item flips from Pending → Resolved, and an **audit-log entry** is written: who acted, what they did, on which item, and when.
5. **Accountability.** Anyone with access can open the **Audit log** to see the full history — essential for appeals, oversight, and compliance.

## Roles (and why the security is real)
Three roles, each with different powers:

| Role | Can do |
|------|--------|
| **Viewer** | Read-only — see the queue and the audit log, but can't act. |
| **Moderator** | Everything a viewer can, plus approve / remove / escalate. |
| **Admin** | Everything, plus **ban users**. |

The important part: these roles are enforced **at the database level** with Supabase **Row-Level Security (RLS)** — not just by hiding buttons on the screen. Even if someone bypassed the UI and called the database directly, it would refuse any action their role isn't allowed to perform. (A moderator literally cannot insert a "ban" action — the database rejects it.) Hiding the buttons in the UI is just a convenience layered on top of that real guard.

## The data behind it (three tables)
- **profiles** — one row per user; holds their **role**. A new sign-up automatically becomes a *viewer*.
- **flagged_items** — the content under review: the text, its type, who posted it, why it was flagged, its severity, and its current **status**.
- **moderation_actions** — the **audit log**: every action taken (actor, action, item, timestamp). Append-only — entries are never edited or deleted.

## Why this project exists
It's a portfolio piece that proves real skills in working, inspectable code:
- **Trust & Safety / moderation workflows** with **logging** — the exact thing on the résumé.
- **Security hygiene** — authentication, role-based access control, row-level security, an audit trail.
- **Quality** — built with unit tests (Vitest) and end-to-end tests (Playwright).

## Tech
Next.js + TypeScript · Supabase (Postgres + Auth + RLS) · Tailwind CSS · Vitest + Playwright · deployed on Vercel.
