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

export function ManagerTeamClient() {
  const [members, setMembers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberId, setMemberId] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const [t, c] = await Promise.all([
      fetchJson("/api/dashboard/manager/team"),
      fetchJson("/api/dashboard/manager/assignable-users"),
    ]);
    setMembers(t.members || []);
    setCandidates(c.users || []);
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

  async function onAdd(e) {
    e.preventDefault();
    const id = Number(memberId);
    if (!Number.isFinite(id)) return;
    setAdding(true);
    setError("");
    try {
      await fetchJson("/api/dashboard/manager/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberUserId: id }),
      });
      setMemberId("");
      await load();
    } catch (e) {
      setError(e.message || "Add failed.");
    } finally {
      setAdding(false);
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
        <h1 className="text-xl font-semibold text-zinc-50">My team</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Add internal <strong>team_member</strong> accounts you manage. Then assign them to customer
          projects from the project workspace (assignments API / UI).
        </p>
        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={onAdd} className="mt-6 flex flex-wrap items-end gap-3 border-t border-white/[0.06] pt-6">
          <label className="block text-sm text-zinc-300">
            <span className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
              Add team member
            </span>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="min-w-[14rem] rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Select user…</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} {u.name ? `(${u.name})` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={!memberId || adding}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add to my roster"}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Roster</p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-200">
          {members.length === 0 ? (
            <li className="text-zinc-500">No team members yet.</li>
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
