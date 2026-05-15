import { Aurora } from "@/app/components/Aurora";
import { BackgroundGrid } from "@/app/components/BackgroundGrid";
import { AuthShell } from "./AuthShell";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <BackgroundGrid className="opacity-80" />
        <Aurora intensity="soft" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />
      <AuthShell>{children}</AuthShell>
    </div>
  );
}
