"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Moderation Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Trust &amp; Safety review queue</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Demo logins — try it</p>
          <p className="mt-1">
            <span className="font-mono text-slate-700">admin@demo.test</span> / <span className="font-mono text-slate-700">lolom0panot123</span>
            <span className="text-slate-400"> — full access (incl. ban)</span>
          </p>
          <p className="mt-0.5">
            <span className="font-mono text-slate-700">mod@demo.test</span> / <span className="font-mono text-slate-700">lolom0panot098</span>
            <span className="text-slate-400"> — can act, can&rsquo;t ban</span>
          </p>
        </div>
      </div>
    </div>
  );
}
