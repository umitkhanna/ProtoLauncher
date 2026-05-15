"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/app/components/GlassCard";
import { Loader2 } from "lucide-react";

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function ClientTeamPageClient() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const data = await fetchJson("/api/dashboard/client/team-members");
    setMembers(data.members || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await fetchJson("/api/dashboard/client/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      setEmail("");
      setPassword("");
      setName("");
      await load();
    } catch (e) {
      setError(e.message || "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 p-12 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading…
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-50">Your team</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Invite collaborators who can work on sprints and message boards only on projects you assign
          to them.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={onCreate} className="mt-6 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-2">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <input
            required
            type="password"
            placeholder="Password (8+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:col-span-2 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="submit"
            disabled={creating}
            className="sm:col-span-2 inline-flex max-w-xs items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create collaborator account"}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Collaborators</p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-200">
          {members.length === 0 ? (
            <li className="text-zinc-500">None yet.</li>
          ) : (
            members.map((m) => (
              <li key={m.id} className="flex justify-between gap-2 border-b border-white/[0.05] py-2">
                <span>{m.email}</span>
                <span className="text-zinc-500">{m.name || "—"}</span>
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
