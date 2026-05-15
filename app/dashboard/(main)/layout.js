import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { userHasGeneratedRequirements } from "@/lib/projects";
import { canAccessOnboardingFlow } from "@/lib/roles";
import { DashboardShell } from "../DashboardShell";

export default async function DashboardMainLayout({ children }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (
    canAccessOnboardingFlow(session.user) &&
    !(await userHasGeneratedRequirements(userId))
  ) {
    redirect("/dashboard/onboarding");
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
