import { Suspense } from "react";
import { auth } from "@/auth";
import { canManageGitDeploy, sessionAccessContext } from "@/lib/project-access";
import { normalizeRole, ROLES } from "@/lib/roles";
import { ProjectsWorkspaceClient } from "./ProjectsWorkspaceClient";

export const metadata = {
  title: "Projects & backlog",
};

export default async function DashboardProjectsPage() {
  const session = await auth();
  const ctx = sessionAccessContext(session);
  const role = normalizeRole(session.user?.role);
  const canManageAssignments =
    role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.CLIENT;

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 text-center text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <ProjectsWorkspaceClient
        canManageGitDeploy={canManageGitDeploy(ctx)}
        canManageAssignments={canManageAssignments}
        viewerRole={role}
      />
    </Suspense>
  );
}
