import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  parseProjectIdFromRequirementsJobId,
  requirementsJobIdForProject,
} from "@/lib/requirements-job-id";
import { getProjectByIdAndUser } from "@/lib/projects";
import { GeneratingClient } from "./GeneratingClient";

export const metadata = {
  title: "Generating requirements",
  robots: { index: false, follow: false },
};

export default async function GeneratingPage({ searchParams }) {
  const sp = await searchParams;
  const jobId = sp?.jobId;
  if (!jobId || typeof jobId !== "string") {
    redirect("/dashboard/onboarding");
  }

  const projectIdFromJob = parseProjectIdFromRequirementsJobId(jobId);
  if (projectIdFromJob == null) {
    redirect("/dashboard/onboarding");
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/onboarding/generating");
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (jobId !== requirementsJobIdForProject(projectIdFromJob)) {
    redirect("/dashboard/onboarding");
  }

  const projectIdParam = sp?.projectId;
  if (projectIdParam != null && projectIdParam !== "") {
    const n = Number(projectIdParam);
    if (!Number.isFinite(n) || n !== projectIdFromJob) {
      redirect("/dashboard/onboarding");
    }
  }

  const project = await getProjectByIdAndUser(projectIdFromJob, userId);
  if (!project) {
    redirect("/dashboard/onboarding");
  }

  if (
    project.requirements_document &&
    String(project.requirements_document).trim()
  ) {
    redirect("/dashboard/requirements/edit");
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <GeneratingClient jobId={jobId} projectId={projectIdFromJob} />
      <p className="mx-auto max-w-lg px-6 pb-10 text-center text-xs text-zinc-600 sm:px-8">
        <Link href="/logout" className="text-zinc-400 underline hover:text-zinc-300">
          Sign out
        </Link>
      </p>
    </div>
  );
}
