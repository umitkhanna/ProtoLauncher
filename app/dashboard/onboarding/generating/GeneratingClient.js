"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export function GeneratingClient({ jobId, projectId }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const readyUrl =
      projectId != null
        ? `/api/dashboard/requirements/ready?projectId=${encodeURIComponent(String(projectId))}`
        : "/api/dashboard/requirements/ready";

    const interval = setInterval(async () => {
      try {
        const [readyRes, jobRes] = await Promise.all([
          fetch(readyUrl, { cache: "no-store" }),
          fetch(
            `/api/dashboard/requirements/job/${encodeURIComponent(jobId)}`,
            { cache: "no-store" },
          ),
        ]);

        const ready = await readyRes.json().catch(() => ({}));
        if (ready.complete) {
          clearInterval(interval);
          router.push("/dashboard/requirements/edit");
          router.refresh();
          return;
        }

        const job = await jobRes.json().catch(() => ({}));
        if (job.state === "failed") {
          clearInterval(interval);
          setError(
            job.failedReason ||
              "Generation failed. Fix API keys on the worker and try again.",
          );
        }
      } catch {
        setError("Lost connection while checking status.");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, projectId, router]);

  return (
    <>
      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between px-6 pb-4 pt-8 sm:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-100 transition hover:text-white"
        >
          ProtoLauncher
        </Link>
        <ThemeToggle />
      </header>

      <div className="relative z-10 mx-auto w-full max-w-lg flex-1 px-6 pb-16 text-center sm:px-8">
        <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 shadow-glass backdrop-blur-xl">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Product document
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-50">
            Generating your product document
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Your request is in the <strong className="text-zinc-300">BullMQ</strong>{" "}
            queue on Redis. A worker (this repo&apos;s{" "}
            <code className="rounded bg-zinc-950 px-1 py-0.5 text-xs text-violet-300">
              npm run worker:requirements
            </code>
            ) calls <strong className="text-zinc-300">Claude</strong> or OpenAI to
            write the full HTML product document (overview through architecture)
            and saves it. This page updates automatically.
          </p>
          <div className="mt-8 flex justify-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400"
              aria-hidden
            />
          </div>
          {error ? (
            <p className="mt-8 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {error ? (
            <p className="mt-6">
              <Link
                href="/dashboard/onboarding"
                className="text-sm font-medium text-violet-400 hover:text-violet-300"
              >
                Back to project form
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
