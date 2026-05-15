import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import { ProductBacklogClient } from "./ProductBacklogClient";

export async function generateMetadata({ params }) {
  const { projectId } = await params;
  return {
    title: `Backlog · Project ${projectId}`,
  };
}

export default async function ProductBacklogPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/projects");
  }

  const { projectId: projectIdRaw } = await params;
  const projectId = Number(projectIdRaw);
  if (!Number.isFinite(projectId)) {
    redirect("/dashboard/projects");
  }

  const project = await assertProjectAccess(
    projectId,
    sessionAccessContext(session),
  );
  if (!project) {
    redirect("/dashboard/projects");
  }

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-10 text-center text-sm text-zinc-400">
          Loading…
        </div>
      }
    >
      <ProductBacklogClient projectId={projectId} />
    </Suspense>
  );
}
