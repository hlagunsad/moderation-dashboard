"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { can, ACTION_RESULT, ACTION_LABELS } from "@/lib/permissions";
import type {
  FlaggedItem,
  ModerationAction,
  Profile,
  ActionType,
  Severity,
  Status,
} from "@/lib/types";

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const ACTIONS: ActionType[] = ["approve", "remove", "escalate", "ban"];

export default function Dashboard({ session, profile }: { session: Session; profile: Profile | null }) {
  const role = profile?.role ?? null;
  const userId = session.user.id;
  const email = session.user.email ?? "";

  const [tab, setTab] = useState<"queue" | "audit">("queue");
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function refresh() {
    const supabase = getSupabase();
    const [{ data: it }, { data: ac }] = await Promise.all([
      supabase.from("flagged_items").select("*"),
      supabase.from("moderation_actions").select("*").order("created_at", { ascending: false }),
    ]);
    const sorted = ((it as FlaggedItem[]) ?? []).sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        a.created_at.localeCompare(b.created_at),
    );
    setItems(sorted);
    setActions((ac as ModerationAction[]) ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (statusFilter === "all" || i.status === statusFilter) &&
          (severityFilter === "all" || i.severity === severityFilter),
      ),
    [items, statusFilter, severityFilter],
  );
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const canAct = can(role, "approve");

  async function act(item: FlaggedItem, action: ActionType) {
    if (!can(role, action)) {
      setMsg({ kind: "error", text: `Your role (${role ?? "none"}) can't ${action}.` });
      return;
    }
    const supabase = getSupabase();
    const { error: e1 } = await supabase
      .from("flagged_items")
      .update({ status: ACTION_RESULT[action], resolved_at: new Date().toISOString(), resolved_by: userId })
      .eq("id", item.id);
    const { error: e2 } = await supabase
      .from("moderation_actions")
      .insert({ item_id: item.id, actor_id: userId, actor_email: email, action });
    if (e1 || e2) {
      setMsg({ kind: "error", text: `Blocked by the database: ${(e1 ?? e2)?.message}` });
    } else {
      setMsg({ kind: "info", text: `${ACTION_LABELS[action]} recorded.` });
    }
    setSelected(new Set());
    await refresh();
  }

  async function bulk(action: ActionType) {
    const targets = items.filter((i) => selected.has(i.id));
    for (const item of targets) {
      await act(item, action);
    }
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Moderation Dashboard</h1>
          <p className="text-xs text-slate-500">Trust &amp; Safety review queue</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <RoleBadge role={role} />
          <span className="text-slate-500">{email}</span>
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="mt-4 flex gap-1">
        <Tab active={tab === "queue"} onClick={() => setTab("queue")}>
          Review queue
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">{pendingCount}</span>
          )}
        </Tab>
        <Tab active={tab === "audit"} onClick={() => setTab("audit")}>
          Audit log
        </Tab>
      </nav>

      {msg && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
        >
          {msg.text}
        </div>
      )}

      {tab === "queue" ? (
        <section className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as Status | "all")} options={["all", "pending", "approved", "removed", "escalated"]} />
            <Filter label="Severity" value={severityFilter} onChange={(v) => setSeverityFilter(v as Severity | "all")} options={["all", "high", "medium", "low"]} />
            <div className="grow" />
            {canAct && selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{selected.size} selected</span>
                <button onClick={() => bulk("approve")} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">Approve</button>
                <button onClick={() => bulk("remove")} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50">Remove</button>
              </div>
            )}
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {canAct && <th className="w-8 px-3 py-2"></th>}
                  <th className="px-3 py-2">Content</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Severity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top last:border-0">
                    {canAct && (
                      <td className="px-3 py-3">
                        {item.status === "pending" && (
                          <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                        )}
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <p className="max-w-md text-slate-800">{item.content}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.content_type} · by {item.author ?? "unknown"} · reported by {item.reporter ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.reason}</td>
                    <td className="px-3 py-3"><SeverityBadge s={item.severity} /></td>
                    <td className="px-3 py-3"><StatusBadge s={item.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {item.status === "pending" ? (
                          ACTIONS.filter((a) => can(role, a)).map((a) => (
                            <button
                              key={a}
                              onClick={() => act(item, a)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${a === "ban" ? "bg-red-600 text-white hover:bg-red-700" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                            >
                              {ACTION_LABELS[a]}
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">resolved</span>
                        )}
                        {item.status === "pending" && !canAct && <span className="text-xs text-slate-400">view only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">No items match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Moderator</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Item</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-500">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-700">{a.actor_email ?? a.actor_id ?? "—"}</td>
                  <td className="px-3 py-2"><ActionBadge a={a.action} /></td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.item_id?.slice(0, 8) ?? "—"}</td>
                </tr>
              ))}
              {actions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-400">No actions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs capitalize text-slate-700"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  const map: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    moderator: "bg-blue-100 text-blue-700",
    viewer: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[role ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
      {role ?? "no role"}
    </span>
  );
}

function SeverityBadge({ s }: { s: Severity }) {
  const map: Record<Severity, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[s]}`}>{s}</span>;
}

function StatusBadge({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    removed: "bg-red-100 text-red-700",
    escalated: "bg-purple-100 text-purple-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[s]}`}>{s}</span>;
}

function ActionBadge({ a }: { a: ActionType }) {
  const map: Record<ActionType, string> = {
    approve: "bg-emerald-100 text-emerald-700",
    remove: "bg-red-100 text-red-700",
    escalate: "bg-purple-100 text-purple-700",
    ban: "bg-red-600 text-white",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[a]}`}>{a}</span>;
}
