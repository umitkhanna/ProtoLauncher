"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/app/components/GlassCard";
import { Loader2 } from "lucide-react";
import { ROLES } from "@/lib/roles";

const ROLES_LIST = [
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.TEAM_MEMBER,
  ROLES.CLIENT,
  ROLES.CLIENT_TEAM_MEMBER,
];

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export function AdminUsersClient() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState(ROLES.TEAM_MEMBER);
  const [newParent, setNewParent] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const data = await fetchJson("/api/dashboard/admin/users");
    setUsers(data.users || []);
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

  async function onRoleChange(userId, role) {
    setBusyId(userId);
    setError("");
    try {
      await fetchJson(`/api/dashboard/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (e) {
      setError(e.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const body = {
        email: newEmail,
        password: newPassword,
        name: newName || undefined,
        role: newRole,
      };
      if (newRole === ROLES.CLIENT_TEAM_MEMBER) {
        body.parentClientId = Number(newParent);
        if (!Number.isFinite(body.parentClientId)) {
          throw new Error("Parent client user id is required for client team members.");
        }
      }
      await fetchJson("/api/dashboard/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewParent("");
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
        <h1 className="text-xl font-semibold text-zinc-50">Users &amp; roles</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Admins can create staff (managers, team members), customer accounts, and link client
          collaborators to a paying customer via parent client id.
        </p>

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={onCreate} className="mt-6 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm font-medium text-zinc-200">Create user</p>
          <input
            required
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <input
            required
            type="password"
            placeholder="Password (8+ chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          >
            {ROLES_LIST.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {newRole === ROLES.CLIENT_TEAM_MEMBER ? (
            <input
              required
              type="number"
              min={1}
              placeholder="Parent client user id"
              value={newParent}
              onChange={(e) => setNewParent(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 sm:col-span-2"
            />
          ) : null}
          <button
            type="submit"
            disabled={creating}
            className="sm:col-span-2 inline-flex max-w-xs items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create user"}
          </button>
        </form>
      </GlassCard>

      <GlassCard className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500">
              <th className="pb-2 pr-3">Id</th>
              <th className="pb-2 pr-3">Email</th>
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Role</th>
              <th className="pb-2">Parent</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.05] text-zinc-200">
                <td className="py-2 pr-3 font-mono text-xs text-zinc-400">{u.id}</td>
                <td className="py-2 pr-3">{u.email}</td>
                <td className="py-2 pr-3 text-zinc-400">{u.name || "—"}</td>
                <td className="py-2 pr-3">
                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => onRoleChange(u.id, e.target.value)}
                    className="rounded-lg border border-white/10 bg-zinc-950/80 px-2 py-1 text-xs"
                  >
                    {ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 text-xs text-zinc-500">{u.parent_client_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
