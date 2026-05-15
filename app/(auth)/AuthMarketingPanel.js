"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const perks = [
  "AI-guided requirements and home-screen previews",
  "Sprint boards and project messaging in one place",
  "Secure sign-in with Google or email",
];

export function AuthMarketingPanel() {
  return (
    <div className="hidden flex-col justify-center lg:flex lg:pr-8 xl:pr-12">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md"
      >
        <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden />
        Client workspace
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease, delay: 0.05 }}
        className="text-balance text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl"
      >
        <span className="text-gradient-violet">Ship faster</span> with your
        ProtoLauncher dashboard.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease, delay: 0.1 }}
        className="mt-5 max-w-md text-pretty text-base leading-relaxed text-zinc-400"
      >
        Capture requirements, preview your product home screen, and collaborate
        with our team—from brief to production-ready MVP.
      </motion.p>

      <motion.ul
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease, delay: 0.15 }}
        className="mt-8 space-y-3"
      >
        {perks.map((text) => (
          <li key={text} className="flex items-start gap-3 text-sm text-zinc-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
              <Check className="h-3 w-3" aria-hidden />
            </span>
            {text}
          </li>
        ))}
      </motion.ul>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease, delay: 0.25 }}
        className="relative mt-12 h-44 w-full max-w-md"
        aria-hidden
      >
        <motion.div
          className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/70 to-zinc-950/95 shadow-glass"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
        />
        <div className="absolute left-4 top-4 w-[72%] rounded-xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-glass backdrop-blur-xl">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Active sprint
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-100">MVP · Week 4</p>
          <motion.div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          </motion.div>
        </div>
        <motion.div
          className="absolute bottom-3 right-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-200 backdrop-blur-md"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45, ease }}
        >
          <Zap className="h-3 w-3" aria-hidden />
          Preview ready
        </motion.div>
      </motion.div>
    </div>
  );
}
