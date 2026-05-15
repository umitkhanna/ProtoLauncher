"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/app/components/GlassCard";
import {
  ArrowRight,
  ClipboardList,
  Download,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { BacklogIssueModal } from "./BacklogIssueModal";

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.code = data.code;
    throw err;
  }
  return data;
}

const PRIORITY_OPTIONS = [
  { value: "lowest", label: "Lowest" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "highest", label: "Highest" },
];

const PRIORITY_VALUES = new Set(PRIORITY_OPTIONS.map((o) => o.value));

function normalizePriority(p) {
  return PRIORITY_VALUES.has(String(p)) ? String(p) : "medium";
}

function formatStatus(status) {
  return String(status || "todo")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ProductBacklogClient({ projectId }) {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [savingIssueId, setSavingIssueId] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setError("");
    const data = await fetchJson(
      `/api/dashboard/projects/${projectId}/workspace`,
    );
    setWorkspace(data);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load backlog.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onPriorityChange = useCallback(
    async (issueId, nextPriority, previousPriority) => {
      setListError("");
      setSavingIssueId(issueId);
      setWorkspace((w) => {
        if (!w?.backlog) return w;
        return {
          ...w,
          backlog: w.backlog.map((row) =>
            row.id === issueId ? { ...row, priority: nextPriority } : row,
          ),
        };
      });
      try {
        await fetchJson(
          `/api/dashboard/projects/${projectId}/issues/${issueId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority: nextPriority }),
          },
        );
      } catch (e) {
        setWorkspace((w) => {
          if (!w?.backlog) return w;
          return {
            ...w,
            backlog: w.backlog.map((row) =>
              row.id === issueId ? { ...row, priority: previousPriority } : row,
            ),
          };
        });
        setListError(e.message || "Could not update priority.");
      } finally {
        setSavingIssueId(null);
      }
    },
    [projectId],
  );

  const onDeleteIssue = useCallback(
    async (row) => {
      const ok = window.confirm(
        `Delete issue ${row.issue_key}? This cannot be undone.`,
      );
      if (!ok) return;
      setListError("");
      try {
        await fetchJson(
          `/api/dashboard/projects/${projectId}/issues/${row.id}`,
          { method: "DELETE" },
        );
        await load();
      } catch (e) {
        setListError(e.message || "Could not delete issue.");
      }
    },
    [projectId, load],
  );

  const project = workspace?.project;
  const backlog = workspace?.backlog || [];
  const planningHref = `/dashboard/projects/backlog?projectId=${projectId}`;
  const hubHref = `/dashboard/projects?projectId=${projectId}`;
  const boardHref = `/dashboard/projects/board?projectId=${projectId}`;
  const exportHref = `/api/dashboard/projects/${projectId}/export/jira?scope=backlog`;

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 p-12 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading backlog…
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-8">
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/dashboard/projects" className="mt-4 text-sm text-violet-400">
          ← Projects
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {modal != null ? (
        <BacklogIssueModal
          projectId={projectId}
          issue={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      ) : null}

      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Product backlog
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
              {project?.name || "Project"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              All issues that are not yet in a sprint. Create, edit, or delete
              items here; priority and details stay in sync with sprint planning
              and the board.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModal("create")}
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/35 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add issue
            </button>
            <Link
              href={planningHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.08]"
            >
              Sprint planning
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={boardHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.08]"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Board
            </Link>
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.08]"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export Jira CSV
            </a>
            <Link
              href={hubHref}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-300"
            >
              Workspace
            </Link>
          </div>
        </div>

        {backlog.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-zinc-950/40 p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-zinc-600" aria-hidden />
            <p className="mt-4 text-sm text-zinc-400">
              {project?.backlog_generated_at
                ? "Nothing left in the product backlog—issues may all be in sprints. Open sprint planning or the board, or move work back from a sprint if needed."
                : "No items in the product backlog yet. Generate a backlog from the workspace, or add an issue with the button above."}
            </p>
            <button
              type="button"
              onClick={() => setModal("create")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add backlog issue
            </button>
            <Link
              href={
                project?.backlog_generated_at ? planningHref : hubHref
              }
              className="mt-3 block text-sm font-medium text-zinc-500 hover:text-zinc-300"
            >
              {project?.backlog_generated_at
                ? "Open sprint planning"
                : "Go to workspace"}
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.06]">
            {listError ? (
              <p className="mb-2 px-4 pt-2 text-sm text-red-400" role="alert">
                {listError}
              </p>
            ) : null}
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {backlog.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-zinc-950/30 hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-violet-300/90">
                      {row.issue_key}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs uppercase text-zinc-500">
                      {row.issue_type}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-200 sm:max-w-md">
                      <span className="font-medium">{row.summary}</span>
                      {row.epic_summary ? (
                        <span className="mt-1 block text-xs text-zinc-500">
                          Epic: {row.epic_summary}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">
                      {formatStatus(row.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <label className="sr-only" htmlFor={`priority-${row.id}`}>
                        Priority for {row.issue_key}
                      </label>
                      <select
                        id={`priority-${row.id}`}
                        value={normalizePriority(row.priority)}
                        disabled={savingIssueId === row.id}
                        onChange={(e) => {
                          const next = e.target.value;
                          const prev = normalizePriority(row.priority);
                          if (next === prev) return;
                          void onPriorityChange(row.id, next, row.priority);
                        }}
                        className="max-w-[10.5rem] cursor-pointer rounded-lg border border-white/10 bg-zinc-950/80 px-2 py-1.5 text-xs font-medium text-zinc-200 outline-none ring-violet-500/30 focus:ring-2 disabled:cursor-wait disabled:opacity-50"
                      >
                        {PRIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-400">
                      {row.story_points != null ? row.story_points : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setModal(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-violet-500/30 hover:text-violet-200"
                          aria-label={`Edit ${row.issue_key}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteIssue(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:border-red-500/40 hover:text-red-300"
                          aria-label={`Delete ${row.issue_key}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-white/[0.06] px-4 py-3 text-xs text-zinc-500">
              {backlog.length} issue{backlog.length === 1 ? "" : "s"} in product
              backlog
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-violet-500/5 p-5">
          <div>
            <p className="text-sm font-medium text-zinc-100">Next step</p>
            <p className="mt-1 text-sm text-zinc-400">
              Choose a sprint and move selected issues from this list into it.
            </p>
          </div>
          <Link
            href={planningHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
          >
            Open sprint planning
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
