import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Aurora } from "@/app/components/Aurora";
import { BackgroundGrid } from "@/app/components/BackgroundGrid";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <BackgroundGrid className="opacity-80" />
        <Aurora intensity="soft" />
      </div>
      {children}
    </div>
  );
}
