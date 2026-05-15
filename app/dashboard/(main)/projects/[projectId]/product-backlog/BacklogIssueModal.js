"use client";

import { useEffect, useState } from "react";
import { inputClass } from "@/app/(auth)/AuthFormPrimitives";
import {
  INTAKE_POLICY_ERROR,
  validateIssueContentPolicy,
} from "@/lib/project-intake-policy";

const ISSUE_TYPES = [
  { value: "story", label: "Story" },
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "epic", label: "Epic" },
  { value: "subtask", label: "Subtask" },
];

const STATUSES = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const PRIORITIES = [
  { value: "lowest", label: "Lowest" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "highest", label: "Highest" },
];

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

function defaultsFromIssue(issue) {
  if (!issue) {
    return {
      issue_type: "story",
      summary: "",
      description: "",
      acceptance_criteria: "",
      priority: "medium",
      status: "todo",
      story_points: "",
      labels: "",
    };
  }
  return {
    issue_type: String(issue.issue_type || "story"),
    summary: issue.summary || "",
    description: issue.description ?? "",
    acceptance_criteria: issue.acceptance_criteria ?? "",
    priority: String(issue.priority || "medium"),
    status: String(issue.status || "todo"),
    story_points:
      issue.story_points != null && issue.story_points !== ""
        ? String(issue.story_points)
        : "",
    labels: issue.labels ?? "",
  };
}

/**
 * @param {{ projectId: number, issue: object | null, onClose: () => void, onSaved: () => Promise<void> | void }} props
 */
export function BacklogIssueModal({ projectId, issue, onClose, onSaved }) {
  const isEdit = Boolean(issue);
  const [fields, setFields] = useState(() => defaultsFromIssue(issue));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFields(defaultsFromIssue(issue));
    setError("");
  }, [issue]);

  function setField(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const summary = fields.summary.trim();
    if (!summary) {
      setError("Summary is required.");
      return;
    }

    const policyPayload = {
      summary,
      description: fields.description.trim() || undefined,
      acceptance_criteria: fields.acceptance_criteria.trim() || undefined,
      labels: fields.labels.trim() || undefined,
    };
    const pol = validateIssueContentPolicy(policyPayload);
    if (!pol.ok) {
      setError(INTAKE_POLICY_ERROR);
      return;
    }

    const storyPointsRaw = fields.story_points.trim();
    const story_points =
      storyPointsRaw === "" ? null : Number(storyPointsRaw);
    if (storyPointsRaw !== "" && !Number.isFinite(story_points)) {
      setError("Story points must be a number.");
      return;
    }

    setPending(true);
    try {
      if (isEdit) {
        await fetchJson(
          `/api/dashboard/projects/${projectId}/issues/${issue.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issue_type: fields.issue_type,
              summary,
              description: fields.description.trim() || null,
              acceptance_criteria: fields.acceptance_criteria.trim() || null,
              priority: fields.priority,
              status: fields.status,
              story_points,
              labels: fields.labels.trim() || null,
            }),
          },
        );
      } else {
        await fetchJson(`/api/dashboard/projects/${projectId}/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issue_type: fields.issue_type,
            summary,
            description: fields.description.trim() || null,
            acceptance_criteria: fields.acceptance_criteria.trim() || null,
            priority: fields.priority,
            story_points,
            labels: fields.labels.trim() || null,
          }),
        });
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="backlog-issue-modal-title"
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-6 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="backlog-issue-modal-title"
            className="text-lg font-semibold text-zinc-50"
          >
            {isEdit ? `Edit ${issue.issue_key}` : "New backlog issue"}
          </h2>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-zinc-300">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Type
            </span>
            <select
              value={fields.issue_type}
              onChange={(e) => setField("issue_type", e.target.value)}
              className={inputClass}
            >
              {ISSUE_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-zinc-300">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Summary
            </span>
            <input
              type="text"
              required
              maxLength={500}
              value={fields.summary}
              onChange={(e) => setField("summary", e.target.value)}
              className={inputClass}
              placeholder="Short title"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Description
            </span>
            <textarea
              rows={4}
              value={fields.description}
              onChange={(e) => setField("description", e.target.value)}
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder="Context, links, notes…"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Acceptance criteria
            </span>
            <textarea
              rows={3}
              value={fields.acceptance_criteria}
              onChange={(e) => setField("acceptance_criteria", e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Optional checklist-style criteria"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-zinc-300">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Status
              </span>
              <select
                value={fields.status}
                onChange={(e) => setField("status", e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-zinc-300">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Priority
              </span>
              <select
                value={fields.priority}
                onChange={(e) => setField("priority", e.target.value)}
                className={inputClass}
              >
                {PRIORITIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-zinc-300">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Story points
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={fields.story_points}
                onChange={(e) => setField("story_points", e.target.value)}
                className={inputClass}
                placeholder="—"
              />
            </label>
            <label className="block text-sm text-zinc-300">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Labels
              </span>
              <input
                type="text"
                maxLength={500}
                value={fields.labels}
                onChange={(e) => setField("labels", e.target.value)}
                className={inputClass}
                placeholder="comma-separated"
              />
            </label>
          </div>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400 disabled:opacity-50"
            >
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
