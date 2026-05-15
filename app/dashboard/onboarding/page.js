import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { userHasGeneratedRequirements } from "@/lib/projects";
import { canAccessOnboardingFlow } from "@/lib/roles";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = {
  title: "Product discovery",
  robots: { index: false, follow: false },
};

export default async function DashboardOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/onboarding");
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (!canAccessOnboardingFlow(session.user)) {
    redirect("/dashboard");
  }

  if (await userHasGeneratedRequirements(userId)) {
    redirect("/dashboard");
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <p className="sr-only">
        Product discovery. Complete the form below to generate your product document.
      </p>
      <OnboardingForm />
      <p className="mx-auto max-w-lg px-6 pb-10 text-center text-xs text-zinc-600 sm:px-8">
        Need to leave? You can{" "}
        <Link href="/logout" className="text-zinc-400 underline hover:text-zinc-300">
          sign out
        </Link>{" "}
        and return later—your account stays safe.
      </p>
    </div>
  );
}
