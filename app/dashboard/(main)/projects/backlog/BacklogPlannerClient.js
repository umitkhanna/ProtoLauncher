"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/app/components/GlassCard";
import { ChevronRight, Loader2 } from "lucide-react";

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function fetchWorkspace(projectId, sprintId) {
  const q =
    sprintId != null
      ? `?sprintId=${encodeURIComponent(String(sprintId))}`
      : "";
  return fetchJson(`/api/dashboard/projects/${projectId}/workspace${q}`);
}

export function BacklogPlannerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = Number(searchParams.get("projectId"));

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sprintName, setSprintName] = useState("Sprint 1");
  const [sprintGoal, setSprintGoal] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [selectedIssueIds, setSelectedIssueIds] = useState(() => new Set());
  const [planning, setPlanning] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(projectId)) return;
    setError("");
    const data = await fetchWorkspace(projectId, null);
    setWorkspace(data);
  }, [projectId]);

  useEffect(() => {
    if (!Number.isFinite(projectId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, projectId]);

  const plannable = useMemo(() => {
    const bl = workspace?.backlog || [];
    return bl.filter((i) => i.issue_type !== "epic");
  }, [workspace]);

  const sprints = workspace?.sprints || [];
  const projectMeta = workspace?.project;

  function toggleIssue(id) {
    setSelectedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createSprint() {
    if (!Number.isFinite(projectId) || !sprintName.trim()) return;
    setCreatingSprint(true);
    setError("");
    try {
      const res = await fetchJson(
        `/api/dashboard/projects/${projectId}/sprints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: sprintName.trim(), goal: sprintGoal }),
        },
      );
      setSelectedSprintId(String(res.sprintId));
      await load();
    } catch (e) {
      setError(e.message || "Could not create sprint.");
    } finally {
      setCreatingSprint(false);
    }
  }

  async function planSprint() {
    if (!Number.isFinite(projectId) || !selectedSprintId) {
      setError("Pick a target sprint.");
      return;
    }
    const ids = [...selectedIssueIds];
    if (!ids.length) {
      setError("Select at least one backlog item (Epics stay in the portfolio list).");
      return;
    }
    setPlanning(true);
    setError("");
    try {
      await fetchJson(`/api/dashboard/projects/${projectId}/backlog/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId: Number(selectedSprintId),
          issueIds: ids,
        }),
      });
      setSelectedIssueIds(new Set());
      await load();
      router.push(
        `/dashboard/projects/board?projectId=${projectId}&sprintId=${selectedSprintId}`,
      );
      router.refresh();
    } catch (e) {
      setError(e.message || "Could not plan sprint.");
    } finally {
      setPlanning(false);
    }
  }

  if (!Number.isFinite(projectId)) {
    return (
      <GlassCard className="p-8">
        <p className="text-sm text-zinc-400">Missing projectId in the URL.</p>
        <Link
          href="/dashboard/projects"
          className="mt-3 inline-block text-sm text-violet-400 hover:text-violet-300"
        >
          Choose a project
        </Link>
      </GlassCard>
    );
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 p-12 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading backlog…
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Guided sprint planning
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
              Pull backlog into a sprint
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Jira-style flow: create a sprint container, select the issues that
              fit capacity, then confirm. Epics stay in the backlog list so you
              can track themes without dragging them into execution.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Link
              href={`/dashboard/projects/${projectId}/product-backlog`}
              className="text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              View full backlog list
            </Link>
            <Link
              href={`/dashboard/projects?projectId=${projectId}`}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-300"
            >
              ← Project workspace
            </Link>
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <ol className="mt-8 space-y-10">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
              1
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="font-medium text-zinc-100">Create or pick a sprint</p>
              <p className="text-sm text-zinc-500">
                Sprints behave like Jira timeboxes. Only one sprint can be
                active at a time (set that on the board).
              </p>
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="min-w-[12rem] rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">Select sprint…</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.state})
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  New sprint
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    placeholder="Sprint name"
                    className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100"
                  />
                  <input
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    placeholder="Goal (optional)"
                    className="rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <button
                  type="button"
                  disabled={creatingSprint || !sprintName.trim()}
                  onClick={createSprint}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/[0.1] disabled:opacity-40"
                >
                  {creatingSprint ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  )}
                  Create sprint
                </button>
              </div>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
              2
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="font-medium text-zinc-100">Select backlog work</p>
              <p className="text-sm text-zinc-500">
                {plannable.length} items can move into a sprint (Epics excluded).
              </p>
              <ul className="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-zinc-950/40 p-3">
                {plannable.length === 0 ? (
                  <li className="py-6 text-center text-sm text-zinc-500">
                    {projectMeta?.backlog_generated_at
                      ? "No plannable backlog items. Work may already live in sprints—open the board, or move issues back to the product backlog."
                      : "No plannable backlog items. Generate a backlog once from the project workspace."}
                  </li>
                ) : (
                  plannable.map((issue) => (
                    <li key={issue.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                        <input
                          type="checkbox"
                          checked={selectedIssueIds.has(issue.id)}
                          onChange={() => toggleIssue(issue.id)}
                          className="mt-1 rounded border-white/20 bg-zinc-900"
                        />
                        <span className="min-w-0">
                          <span className="text-xs font-mono text-violet-300/90">
                            {issue.issue_key}
                          </span>
                          <span className="ml-2 text-xs uppercase text-zinc-500">
                            {issue.issue_type}
                          </span>
                          <span className="mt-0.5 block text-sm text-zinc-200">
                            {issue.summary}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200">
              3
            </span>
            <div className="space-y-3">
              <p className="font-medium text-zinc-100">Confirm</p>
              <p className="text-sm text-zinc-500">
                Moves selected issues from the product backlog into the sprint
                you picked. You can refine status on the sprint board.
              </p>
              <button
                type="button"
                disabled={
                  planning || !selectedSprintId || selectedIssueIds.size === 0
                }
                onClick={planSprint}
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/35 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-100 hover:border-violet-400/45 disabled:opacity-40"
              >
                {planning ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Add to sprint &amp; open board
              </button>
            </div>
          </li>
        </ol>
      </GlassCard>
    </div>
  );
}
