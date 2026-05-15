"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/app/components/GlassCard";
import {
  Download,
  GripVertical,
  LayoutGrid,
  List,
  Loader2,
  Search,
} from "lucide-react";

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function fetchWorkspace(projectId, sprintId) {
  const q = `?sprintId=${encodeURIComponent(String(sprintId))}`;
  return fetchJson(`/api/dashboard/projects/${projectId}/workspace${q}`);
}

const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

export function SprintBoardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = Number(searchParams.get("projectId"));
  const sprintIdParam = searchParams.get("sprintId");
  const sprintIdFromUrl = sprintIdParam ? Number(sprintIdParam) : null;

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patching, setPatching] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [viewMode, setViewMode] = useState("board");
  const [dragOverCol, setDragOverCol] = useState(null);
  const [draggingIssueId, setDraggingIssueId] = useState(null);

  const refreshBoard = useCallback(
    async (pid, sid) => {
      if (!Number.isFinite(pid) || !Number.isFinite(sid)) return;
      const data = await fetchWorkspace(pid, sid);
      setWorkspace(data);
    },
    [],
  );

  useEffect(() => {
    if (!Number.isFinite(projectId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const base = await fetchJson(
          `/api/dashboard/projects/${projectId}/workspace`,
        );
        if (cancelled) return;
        const sprints = base.sprints || [];
        let sid = Number.isFinite(sprintIdFromUrl) ? sprintIdFromUrl : null;
        if (!sid && sprints[0]?.id) {
          router.replace(
            `/dashboard/projects/board?projectId=${projectId}&sprintId=${sprints[0].id}`,
          );
          return;
        }
        if (sid) {
          await refreshBoard(projectId, sid);
        } else {
          setWorkspace(base);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, sprintIdFromUrl, router, refreshBoard]);

  const sprintId = Number.isFinite(sprintIdFromUrl)
    ? sprintIdFromUrl
    : (workspace?.sprints?.[0]?.id != null ? Number(workspace.sprints[0].id) : null);

  const sprint = useMemo(() => {
    const list = workspace?.sprints || [];
    if (!Number.isFinite(sprintId)) return null;
    return list.find((s) => Number(s.id) === sprintId) || null;
  }, [workspace, sprintId]);

  const rawIssues = useMemo(
    () => workspace?.sprintIssues || [],
    [workspace],
  );

  const filteredIssues = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return rawIssues;
    return rawIssues.filter((issue) => {
      const blob = [
        issue.issue_key,
        issue.summary,
        issue.issue_type,
        issue.status,
        issue.epic_summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rawIssues, filterText]);

  const grouped = useMemo(() => {
    const g = { todo: [], in_progress: [], blocked: [], done: [] };
    for (const issue of filteredIssues) {
      const col = g[issue.status] ? issue.status : "todo";
      g[col].push(issue);
    }
    return g;
  }, [filteredIssues]);

  const sprintIssueCount = rawIssues.length;
  const filteredCount = filteredIssues.length;

  async function setIssueStatus(issueId, status) {
    if (!Number.isFinite(projectId) || !Number.isFinite(sprintId)) return;
    setPatching(issueId);
    setError("");
    try {
      await fetchJson(
        `/api/dashboard/projects/${projectId}/sprints/${sprintId}/issues/${issueId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      await refreshBoard(projectId, sprintId);
    } catch (e) {
      setError(e.message || "Update failed.");
    } finally {
      setPatching(null);
    }
  }

  async function setSprintState(state) {
    if (!Number.isFinite(projectId) || !Number.isFinite(sprintId)) return;
    setError("");
    try {
      await fetchJson(
        `/api/dashboard/projects/${projectId}/sprints/${sprintId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        },
      );
      await refreshBoard(projectId, sprintId);
    } catch (e) {
      setError(e.message || "Could not update sprint.");
    }
  }

  function onSprintChange(e) {
    const id = e.target.value;
    if (!id || !Number.isFinite(projectId)) return;
    router.push(
      `/dashboard/projects/board?projectId=${projectId}&sprintId=${encodeURIComponent(id)}`,
    );
  }

  function onDragStartIssue(e, issueId) {
    setDraggingIssueId(issueId);
    try {
      e.dataTransfer.setData("text/plain", String(issueId));
      e.dataTransfer.effectAllowed = "move";
    } catch {
      /* ignore */
    }
  }

  function onDragEndIssue() {
    setDraggingIssueId(null);
    setDragOverCol(null);
  }

  function onDragOverCol(e, colId) {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
      /* ignore */
    }
    setDragOverCol(colId);
  }

  function onDragLeaveCol() {
    setDragOverCol(null);
  }

  function onDropCol(e, colId) {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingIssueId(null);
    let issueId = draggingIssueId;
    try {
      const fromData = e.dataTransfer.getData("text/plain");
      if (fromData) issueId = Number(fromData);
    } catch {
      /* ignore */
    }
    if (!Number.isFinite(issueId)) return;
    const targetStatus = colId;
    const issue = rawIssues.find((i) => Number(i.id) === Number(issueId));
    if (!issue || issue.status === targetStatus) return;
    void setIssueStatus(issueId, targetStatus);
  }

  const awaitingWorkspace =
    Number.isFinite(projectId) &&
    Number.isFinite(sprintIdFromUrl) &&
    !workspace;

  if (!Number.isFinite(projectId)) {
    return (
      <GlassCard className="p-8">
        <p className="text-sm text-zinc-400">Missing projectId.</p>
        <Link href="/dashboard/projects" className="mt-3 text-sm text-violet-400">
          Project hub
        </Link>
      </GlassCard>
    );
  }

  if ((loading || awaitingWorkspace) && !error) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 p-12 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading board…
      </GlassCard>
    );
  }

  const sprints = workspace?.sprints || [];
  const exportHref =
    Number.isFinite(projectId) && Number.isFinite(sprintId)
      ? `/api/dashboard/projects/${projectId}/export/jira?scope=sprint&sprintId=${sprintId}`
      : null;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Sprint board
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
              {sprint?.name || "Sprint"}
            </h1>
            {sprint?.goal ? (
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">{sprint.goal}</p>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Drag cards between columns or use list view. Filter by key, summary,
                type, or status.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              <span className="mb-1 block">Sprint</span>
              <select
                value={Number.isFinite(sprintId) ? String(sprintId) : ""}
                onChange={onSprintChange}
                className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
              >
                {sprints.length === 0 ? (
                  <option value="">No sprints</option>
                ) : (
                  sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.state})
                    </option>
                  ))
                )}
              </select>
            </label>
            {exportHref ? (
              <a
                href={exportHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/[0.08]"
              >
                <Download className="h-4 w-4" aria-hidden />
                Export sprint (CSV)
              </a>
            ) : null}
            <Link
              href={`/dashboard/projects?projectId=${projectId}`}
              className="text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Hub
            </Link>
            <Link
              href={`/dashboard/projects/backlog?projectId=${projectId}`}
              className="text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Plan backlog
            </Link>
          </div>
        </div>

        {sprint ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-zinc-500">
              State: <strong className="text-zinc-300">{sprint.state}</strong>
            </span>
            {sprint.state !== "active" ? (
              <button
                type="button"
                onClick={() => setSprintState("active")}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/15"
              >
                Start sprint
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSprintState("closed")}
                className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-500/15"
              >
                Close sprint
              </button>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter issues…"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 py-2.5 pl-10 pr-3 text-sm text-zinc-100 outline-none ring-violet-500/30 focus:ring-2"
              aria-label="Filter issues"
            />
          </div>
          <div
            className="inline-flex rounded-xl border border-white/10 bg-zinc-950/50 p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                viewMode === "board"
                  ? "bg-violet-500/20 text-violet-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                viewMode === "list"
                  ? "bg-violet-500/20 text-violet-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <List className="h-4 w-4" aria-hidden />
              List
            </button>
          </div>
        </div>

        {filterText.trim() ? (
          <p className="mt-2 text-xs text-zinc-500">
            Showing {filteredCount} of {sprintIssueCount} issue
            {sprintIssueCount === 1 ? "" : "s"}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {sprints.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            No sprints yet. Create one from{" "}
            <Link
              href={`/dashboard/projects/backlog?projectId=${projectId}`}
              className="text-violet-400 underline"
            >
              Plan backlog
            </Link>
            .
          </p>
        ) : !Number.isFinite(sprintId) ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            Pick a sprint from the menu above.
          </p>
        ) : sprintIssueCount === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            No issues in this sprint yet. Use{" "}
            <Link
              href={`/dashboard/projects/backlog?projectId=${projectId}`}
              className="text-violet-400 underline"
            >
              Plan backlog
            </Link>{" "}
            to pull work in.
          </p>
        ) : viewMode === "list" ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-zinc-500"
                    >
                      No issues match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id} className="bg-zinc-950/30">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-violet-300/90">
                        {issue.issue_key}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs uppercase text-zinc-500">
                        {issue.issue_type}
                      </td>
                      <td className="max-w-md px-4 py-3 text-zinc-200">
                        {issue.summary}
                        {issue.epic_summary ? (
                          <span className="mt-1 block text-xs text-zinc-500">
                            Epic: {issue.epic_summary}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <select
                          value={issue.status}
                          disabled={patching === issue.id}
                          onChange={(e) =>
                            setIssueStatus(issue.id, e.target.value)
                          }
                          className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
                          aria-label={`Status for ${issue.issue_key}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-4">
            {STATUSES.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => onDragOverCol(e, col.id)}
                onDragLeave={onDragLeaveCol}
                onDrop={(e) => onDropCol(e, col.id)}
                className={[
                  "flex min-h-[12rem] flex-col rounded-2xl border bg-zinc-950/50 transition-colors",
                  dragOverCol === col.id
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-white/[0.06]",
                ].join(" ")}
              >
                <div className="border-b border-white/[0.06] px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    {col.label}
                  </p>
                  <p className="text-[11px] text-zinc-600">
                    {grouped[col.id]?.length ?? 0} issues
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-2 p-2">
                  {(grouped[col.id] || []).length === 0 ? (
                    <li className="rounded-lg border border-dashed border-white/10 px-2 py-6 text-center text-[11px] text-zinc-600">
                      Drop here
                    </li>
                  ) : (
                    (grouped[col.id] || []).map((issue) => (
                      <li
                        key={issue.id}
                        draggable
                        onDragStart={(e) => onDragStartIssue(e, issue.id)}
                        onDragEnd={onDragEndIssue}
                        className={[
                          "cursor-grab rounded-xl border border-white/[0.06] bg-zinc-900/80 p-3 shadow-sm active:cursor-grabbing",
                          draggingIssueId === issue.id ? "opacity-60" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical
                            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[11px] text-violet-300/90">
                              {issue.issue_key}
                            </p>
                            <p className="mt-1 text-sm font-medium text-zinc-100">
                              {issue.summary}
                            </p>
                            {issue.epic_summary ? (
                              <p className="mt-1 text-[11px] text-zinc-500">
                                Epic: {issue.epic_summary}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
