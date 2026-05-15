import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import { ProjectMessagesClient } from "./ProjectMessagesClient";

export async function generateMetadata({ params }) {
  const { projectId } = await params;
  return { title: `Messages · ${projectId}` };
}

export default async function ProjectMessagesPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/projects");
  }
  const { projectId: raw } = await params;
  const projectId = Number(raw);
  if (!Number.isFinite(projectId)) redirect("/dashboard/projects");

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) redirect("/dashboard/projects");

  return <ProjectMessagesClient projectId={projectId} />;
}
