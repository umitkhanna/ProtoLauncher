"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/app/components/GlassCard";
import {
  Loader2,
  Kanban,
  ListChecks,
  Download,
  ClipboardList,
  GitBranch,
  CloudUpload,
  MessageSquare,
} from "lucide-react";

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

export function ProjectsWorkspaceClient({
  canManageGitDeploy = false,
  canManageAssignments = false,
  viewerRole = "client",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [repoBusy, setRepoBusy] = useState(false);
  const [deployBusy, setDeployBusy] = useState(false);
  const [info, setInfo] = useState("");

  const loadProjects = useCallback(async () => {
    setError("");
    const data = await fetchJson("/api/dashboard/projects");
    setProjects(data.projects || []);
    return data.projects || [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await loadProjects();
        if (cancelled) return;
        if (!projectIdParam && list.length && list[0]?.id) {
          router.replace(
            `/dashboard/projects?projectId=${encodeURIComponent(String(list[0].id))}`,
          );
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load projects.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProjects, projectIdParam, router]);

  const projectId = projectIdParam ? Number(projectIdParam) : null;
  const current = useMemo(
    () => projects.find((p) => Number(p.id) === projectId) || null,
    [projects, projectId],
  );

  useEffect(() => {
    if (!projectId || !canManageAssignments) {
      setAssignments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJson(`/api/dashboard/projects/${projectId}/assignments`);
        if (!cancelled) setAssignments(data.assignments || []);
      } catch {
        if (!cancelled) setAssignments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, canManageAssignments]);

  async function onGenerate() {
    if (!projectId) return;
    setGenBusy(true);
    setError("");
    try {
      await fetchJson(`/api/dashboard/projects/${projectId}/backlog/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadProjects();
      router.push(`/dashboard/projects/${projectId}/product-backlog`);
      router.refresh();
    } catch (e) {
      if (e.code === "BACKLOG_ALREADY_GENERATED" || e.code === "ISSUES_EXIST") {
        setError(
          "A backlog has already been generated for this project. Open the product backlog or sprint planning to continue.",
        );
      } else {
        setError(e.message || "Generation failed.");
      }
    } finally {
      setGenBusy(false);
    }
  }

  async function onAddAssignee(e) {
    e.preventDefault();
    const uid = Number(assignUserId);
    if (!projectId || !Number.isFinite(uid)) return;
    setAssignBusy(true);
    setError("");
    try {
      await fetchJson(`/api/dashboard/projects/${projectId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      setAssignUserId("");
      const data = await fetchJson(`/api/dashboard/projects/${projectId}/assignments`);
      setAssignments(data.assignments || []);
    } catch (e) {
      setError(e.message || "Could not assign.");
    } finally {
      setAssignBusy(false);
    }
  }

  async function onRemoveAssignee(uid) {
    if (!projectId) return;
    setError("");
    try {
      await fetchJson(
        `/api/dashboard/projects/${projectId}/assignments?userId=${encodeURIComponent(String(uid))}`,
        { method: "DELETE" },
      );
      const data = await fetchJson(`/api/dashboard/projects/${projectId}/assignments`);
      setAssignments(data.assignments || []);
    } catch (e) {
      setError(e.message || "Could not remove.");
    }
  }

  async function onRequestRepo() {
    if (!projectId) return;
    setRepoBusy(true);
    setError("");
    setInfo("");
    try {
      await fetchJson(`/api/dashboard/projects/${projectId}/repo`, {
        method: "POST",
      });
      setInfo("Git repo provisioning queued (stub).");
      await loadProjects();
    } catch (e) {
      setError(e.message || "Request failed.");
    } finally {
      setRepoBusy(false);
    }
  }

  async function onRequestDeploy() {
    if (!projectId) return;
    setDeployBusy(true);
    setError("");
    setInfo("");
    try {
      await fetchJson(`/api/dashboard/projects/${projectId}/deploy`, {
        method: "POST",
      });
      setInfo("Deploy to VPS queued (stub).");
      await loadProjects();
    } catch (e) {
      setError(e.message || "Request failed.");
    } finally {
      setDeployBusy(false);
    }
  }

  function onProjectChange(e) {
    const id = e.target.value;
    if (!id) {
      router.push("/dashboard/projects");
      return;
    }
    router.push(`/dashboard/projects?projectId=${encodeURIComponent(id)}`);
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center gap-3 p-12 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Loading projects…
      </GlassCard>
    );
  }

  if (!projects.length) {
    const staff = viewerRole !== "client";
    return (
      <GlassCard className="p-8 sm:p-10">
        <p className="text-sm text-zinc-400">
          {staff
            ? "No projects are visible for your account yet. Ask an admin or manager to assign you to a project."
            : "No projects yet. Complete onboarding so a project (and requirements) exist, then return here to generate a Jira-style backlog."}
        </p>
        {!staff ? (
          <Link
            href="/dashboard/onboarding"
            className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Go to onboarding
          </Link>
        ) : null}
      </GlassCard>
    );
  }

  const exportBacklogHref =
    projectId != null
      ? `/api/dashboard/projects/${projectId}/export/jira?scope=backlog`
      : null;

  const backlogAlreadyGenerated =
    Boolean(current?.backlog_generated_at) || Number(current?.issue_count) > 0;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Project workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
          Backlog &amp; sprints
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Structure matches Jira: Epics, Stories, Tasks, Bugs, priorities, story
          points, and sprint planning. Generate work items from your finalized
          requirements, plan them into sprints, manage status on a board, and
          export CSV for Jira Cloud import.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block min-w-[200px] flex-1 text-sm text-zinc-300">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Active project
            </span>
            <select
              value={projectId != null ? String(projectId) : ""}
              onChange={onProjectChange}
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.issue_count ?? 0} issues)
                </option>
              ))}
            </select>
          </label>
        </div>

        {current ? (
          <p className="mt-3 text-xs text-zinc-500">
            {current.backlog_generated_at
              ? `Last AI backlog run: ${new Date(current.backlog_generated_at).toLocaleString()}.`
              : "No AI backlog generated yet for this project."}
          </p>
        ) : null}

        {canManageAssignments && projectId ? (
          <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-6">
            <p className="text-sm font-medium text-zinc-200">Assignees</p>
            <p className="text-xs text-zinc-500">
              Internal team members or customer collaborators who can access this project.
            </p>
            <ul className="space-y-1 text-sm text-zinc-300">
              {assignments.length === 0 ? (
                <li className="text-zinc-500">No assignees yet.</li>
              ) : (
                assignments.map((a) => (
                  <li key={a.user_id} className="flex items-center justify-between gap-2">
                    <span>
                      {a.email}
                      {a.name ? ` · ${a.name}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => void onRemoveAssignee(a.user_id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
            <form onSubmit={onAddAssignee} className="flex flex-wrap items-end gap-2">
              <input
                type="number"
                min={1}
                placeholder="User id"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="w-32 rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-1.5 text-sm text-zinc-100"
              />
              <button
                type="submit"
                disabled={assignBusy}
                className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-zinc-100 disabled:opacity-50"
              >
                {assignBusy ? "…" : "Add assignee"}
              </button>
            </form>
          </div>
        ) : null}

        {canManageGitDeploy && projectId ? (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/[0.06] pt-6">
            <button
              type="button"
              disabled={repoBusy}
              onClick={() => void onRequestRepo()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-violet-500/35 disabled:opacity-50"
            >
              <GitBranch className="h-4 w-4" aria-hidden />
              {repoBusy ? "Queuing…" : "Start Git repo"}
            </button>
            <button
              type="button"
              disabled={deployBusy}
              onClick={() => void onRequestDeploy()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-violet-500/35 disabled:opacity-50"
            >
              <CloudUpload className="h-4 w-4" aria-hidden />
              {deployBusy ? "Queuing…" : "Deploy to VPS"}
            </button>
            {current ? (
              <p className="w-full text-xs text-zinc-500">
                Repo: {current.git_repo_status ?? "—"} · Deploy: {current.deploy_status ?? "—"}
              </p>
            ) : null}
          </div>
        ) : null}

        {info ? (
          <p className="mt-4 text-sm text-emerald-300/90" role="status">
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.06] pt-6">
          <p className="text-sm font-medium text-zinc-200">1. Generate backlog</p>
          {backlogAlreadyGenerated ? (
            <>
              <p className="text-sm text-zinc-400">
                Backlog generation already ran for this project. Use the product
                backlog, sprint planning, and board to manage work.
              </p>
              <Link
                href={
                  projectId != null
                    ? `/dashboard/projects/${projectId}/product-backlog`
                    : "#"
                }
                className={`inline-flex max-w-md items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08] ${
                  !projectId ? "pointer-events-none opacity-40" : ""
                }`}
              >
                View product backlog
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-500">
                Uses your requirements document and your configured AI provider
                (same keys as requirements generation). You can only run this once
                per project.
              </p>
              <button
                type="button"
                disabled={!projectId || genBusy}
                onClick={onGenerate}
                className="inline-flex max-w-md items-center justify-center gap-2 rounded-full border border-violet-500/35 bg-violet-500/15 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/45 disabled:opacity-40"
              >
                {genBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Generate backlog from requirements
              </button>
            </>
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Link
            href={
              projectId != null
                ? `/dashboard/projects/${projectId}/product-backlog`
                : "#"
            }
            className={`flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm font-medium text-zinc-100 transition hover:border-violet-500/30 hover:bg-white/[0.05] ${
              !projectId ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <ClipboardList className="h-5 w-5 text-violet-400" aria-hidden />
            View product backlog
          </Link>
          <Link
            href={
              projectId != null
                ? `/dashboard/projects/backlog?projectId=${projectId}`
                : "#"
            }
            className={`flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm font-medium text-zinc-100 transition hover:border-violet-500/30 hover:bg-white/[0.05] ${
              !projectId ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <ListChecks className="h-5 w-5 text-violet-400" aria-hidden />
            Plan backlog → sprint
          </Link>
          <Link
            href={
              projectId != null
                ? `/dashboard/projects/board?projectId=${projectId}`
                : "#"
            }
            className={`flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm font-medium text-zinc-100 transition hover:border-violet-500/30 hover:bg-white/[0.05] ${
              !projectId ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <Kanban className="h-5 w-5 text-violet-400" aria-hidden />
            Sprint board
          </Link>
          <Link
            href={
              projectId != null
                ? `/dashboard/projects/${projectId}/messages`
                : "#"
            }
            className={`flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm font-medium text-zinc-100 transition hover:border-violet-500/30 hover:bg-white/[0.05] ${
              !projectId ? "pointer-events-none opacity-40" : ""
            }`}
          >
            <MessageSquare className="h-5 w-5 text-violet-400" aria-hidden />
            Message board
          </Link>
          {exportBacklogHref ? (
            <a
              href={exportBacklogHref}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm font-medium text-zinc-100 transition hover:border-violet-500/30 hover:bg-white/[0.05]"
            >
              <Download className="h-5 w-5 text-violet-400" aria-hidden />
              Export backlog (Jira CSV)
            </a>
          ) : null}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-zinc-600">
          Jira Cloud: Settings → System → Import and export → External system
          import → CSV. Map columns Summary, Issue Type, Status, Priority, Epic
          Name, Story Points, Sprint. For sprint exports, use the board view
          download.
        </p>
      </GlassCard>
    </div>
  );
}
