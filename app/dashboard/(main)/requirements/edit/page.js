import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectForRequirementsSession } from "@/lib/projects";
import { normalizeRole, ROLES } from "@/lib/roles";
import { GlassCard } from "@/app/components/GlassCard";
import { RequirementsEditor } from "./RequirementsEditor";

export const metadata = {
  title: "Edit requirements",
};

export default async function RequirementsEditPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/requirements/edit");
  }

  const userId = Number(session.user.id);
  if (normalizeRole(session.user.role) !== ROLES.CLIENT) {
    redirect("/dashboard");
  }

  const row = await getProjectForRequirementsSession(userId);
  if (!row?.requirements_document) {
    redirect("/dashboard/onboarding");
  }

  const finalized = Boolean(row.requirements_finalized_at);

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Requirements specification
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
            Edit document
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Review the AI-generated product document (overview, personas, MVP,
            stories, backlog, roadmap, architecture), adjust as needed, then save
            a draft or finalize.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          ← Overview
        </Link>
      </div>

      <RequirementsEditor
        initialHtml={row.requirements_document}
        finalized={finalized}
        projectName={row.name}
      />
    </GlassCard>
  );
}
