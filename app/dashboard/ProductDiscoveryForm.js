"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthCard,
  AuthField,
  AuthSubmitButton,
  inputClass,
} from "@/app/(auth)/AuthFormPrimitives";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import {
  INTAKE_POLICY_ERROR,
  validateProjectIntakePolicy,
} from "@/lib/project-intake-policy";

/**
 * @param {{ variant: "standalone" | "embedded", additionalProject?: boolean }} props
 */
export function ProductDiscoveryForm({
  variant,
  additionalProject = false,
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [startupIdea, setStartupIdea] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [businessGoals, setBusinessGoals] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const policy = validateProjectIntakePolicy({
      name: projectName.trim(),
      startupIdea: startupIdea.trim(),
      targetAudience: targetAudience.trim(),
      businessGoals: businessGoals.trim(),
      intakeNotes: intakeNotes.trim(),
    });
    if (!policy.ok) {
      setError(INTAKE_POLICY_ERROR);
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/dashboard/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          startupIdea,
          targetAudience,
          businessGoals,
          intakeNotes,
          ...(additionalProject ? { additionalProject: true } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setPending(false);
        return;
      }
      const qp = new URLSearchParams();
      if (data.jobId) qp.set("jobId", String(data.jobId));
      if (data.projectId != null) qp.set("projectId", String(data.projectId));
      if (data.projectId != null) {
        try {
          sessionStorage.setItem("pl:openNewProject", String(data.projectId));
        } catch {
          /* ignore */
        }
      }
      const next =
        data.redirect ||
        `/dashboard/onboarding/generating?${qp.toString()}`;
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  const title = additionalProject
    ? "New project — product discovery"
    : "Product discovery";

  const subtitle = additionalProject
    ? "Same intake as your first project: we generate the HTML requirements document, then you can finalize it, generate a backlog, and plan sprints."
    : "Share your startup idea, audience, and goals. We enqueue a BullMQ job; your worker (Claude or OpenAI) generates a full HTML product document—overview, personas, MVP, stories, backlog, roadmap, and architecture—then saves it when ready.";

  const form = (
    <AuthCard title={title} subtitle={subtitle}>
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthField
          label="Product or project name"
          id="project-name"
          name="projectName"
          type="text"
          autoComplete="organization"
          required
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          maxLength={200}
          placeholder="e.g. Northstar CRM"
        />
        <div>
          <label
            htmlFor="startup-idea"
            className="mb-2 block text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Startup idea
          </label>
          <textarea
            id="startup-idea"
            name="startupIdea"
            required
            rows={5}
            value={startupIdea}
            onChange={(e) => setStartupIdea(e.target.value)}
            maxLength={12000}
            placeholder="What you are building, core insight, and how it wins."
            className={`${inputClass} min-h-[120px] resize-y`}
          />
        </div>
        <div>
          <label
            htmlFor="target-audience"
            className="mb-2 block text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Target audience
          </label>
          <textarea
            id="target-audience"
            name="targetAudience"
            required
            rows={4}
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            maxLength={12000}
            placeholder="Who they are, context, jobs-to-be-done, channels…"
            className={`${inputClass} min-h-[100px] resize-y`}
          />
        </div>
        <div>
          <label
            htmlFor="business-goals"
            className="mb-2 block text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Business goals
          </label>
          <textarea
            id="business-goals"
            name="businessGoals"
            required
            rows={4}
            value={businessGoals}
            onChange={(e) => setBusinessGoals(e.target.value)}
            maxLength={12000}
            placeholder="Revenue, growth, retention, partnerships, milestones…"
            className={`${inputClass} min-h-[100px] resize-y`}
          />
        </div>
        <div>
          <label
            htmlFor="intake-notes"
            className="mb-2 block text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Optional notes
          </label>
          <textarea
            id="intake-notes"
            name="intakeNotes"
            rows={3}
            value={intakeNotes}
            onChange={(e) => setIntakeNotes(e.target.value)}
            maxLength={12000}
            placeholder="Constraints, competitors, tech preferences, compliance…"
            className={`${inputClass} min-h-[80px] resize-y`}
          />
        </div>
        {error ? (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <AuthSubmitButton pending={pending}>
          <span className="text-center leading-snug">
            Generate product document
          </span>
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );

  if (variant === "embedded") {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link
          href="/dashboard/projects"
          className="inline-flex text-sm font-medium text-zinc-500 hover:text-zinc-300"
        >
          ← Back to projects
        </Link>
        {form}
      </div>
    );
  }

  return (
    <>
      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between px-6 pb-4 pt-8 sm:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-100 transition hover:text-white"
        >
          ProtoLauncher
        </Link>
        <ThemeToggle />
      </header>

      <div className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 pb-16 sm:px-8">
        {form}
      </div>
    </>
  );
}
