import Link from "next/link";
import { auth } from "@/auth";
import { GlassCard } from "@/app/components/GlassCard";
import { getLatestProjectForOverview } from "@/lib/projects";

export const metadata = {
  title: "Overview",
};

export default async function DashboardOverviewPage() {
  const session = await auth();
  const user = session?.user;
  const displayName = user?.name?.trim() || user?.email || "there";

  const row = user?.id ? await getLatestProjectForOverview(Number(user.id)) : null;
  const projectName = row?.name?.trim();

  return (
    <GlassCard className="p-8 sm:p-10">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Overview
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
        Welcome back, {displayName}
      </h1>
      {projectName ? (
        <p className="mt-2 text-sm text-zinc-400">
          Active project:{" "}
          <span className="font-medium text-zinc-200">{projectName}</span>
        </p>
      ) : null}
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
        You are signed in as{" "}
        <span className="font-medium text-zinc-200">{user?.email}</span>. Use
        the left menu to open other sections, or jump into projects below.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {row?.requirements_document ? (
          <Link
            href="/dashboard/requirements/edit"
            className="inline-flex items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-100 backdrop-blur-sm transition hover:border-violet-400/40 hover:bg-violet-500/15"
          >
            View requirements document
          </Link>
        ) : null}
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-100 backdrop-blur-sm transition hover:border-white/25"
        >
          Open Projects
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-violet-500/15 transition hover:bg-zinc-100"
        >
          View marketing site
        </Link>
      </div>
    </GlassCard>
  );
}
