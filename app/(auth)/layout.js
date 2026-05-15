import Link from "next/link";
import { Aurora } from "@/app/components/Aurora";
import { BackgroundGrid } from "@/app/components/BackgroundGrid";
import { ThemeToggle } from "@/app/components/ThemeToggle";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <BackgroundGrid className="opacity-80" />
        <Aurora intensity="soft" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between px-6 pb-2 pt-8 sm:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-100 transition hover:text-white"
        >
          ProtoLauncher
        </Link>
        <ThemeToggle />
      </header>

      <main
        id="main-content"
        className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-16 pt-4 sm:px-8"
      >
        {children}
      </main>
    </div>
  );
}
