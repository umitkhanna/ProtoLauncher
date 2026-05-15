"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { AuthMarketingPanel } from "./AuthMarketingPanel";

const ease = [0.22, 1, 0.36, 1];

export function AuthShell({ children }) {
  return (
    <>
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-4 pt-8 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white transition hover:text-zinc-100"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-violet-300 shadow-inner shadow-black/20">
            PL
          </span>
          ProtoLauncher
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm text-zinc-400 transition hover:text-white sm:inline"
          >
            Back to site
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 gap-10 px-6 pb-16 pt-2 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-16 lg:px-10 xl:grid-cols-[1.1fr_minmax(0,28rem)]"
      >
        <AuthMarketingPanel />
        <motion.div
          className="w-full lg:justify-self-end"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease, delay: 0.08 }}
        >
          {children}
        </motion.div>
      </main>
    </>
  );
}
