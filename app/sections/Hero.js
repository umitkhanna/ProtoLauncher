"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { Aurora } from "../components/Aurora";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { GradientButton } from "../components/GradientButton";

const ease = [0.22, 1, 0.36, 1];

function PromptCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ delay: 0.15, duration: 0.7, ease }}
      className="absolute left-0 top-2 w-[78%] origin-bottom-left animate-float-slow rounded-xl border border-white/[0.08] bg-zinc-900/70 p-4 shadow-glass backdrop-blur-xl sm:left-2"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20 text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-medium text-zinc-400">
          ProtoLauncher · MVP brief
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-zinc-300">
        Build an AI-native analytics dashboard with auth, billing, and a
        notebook-style report builder. Ship to prod in 6 weeks.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Next.js", "Postgres", "OpenAI", "Stripe"].map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-zinc-400"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function DashboardCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ delay: 0.3, duration: 0.7, ease }}
      className="absolute bottom-12 right-0 w-[86%] origin-bottom-right rounded-2xl border border-white/[0.08] bg-zinc-950/85 p-4 shadow-glass backdrop-blur-xl sm:right-2"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Weekly active users
          </p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-white">
            12,840
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          <Zap className="h-3 w-3" />
          +38%
        </span>
      </div>

      <div className="relative h-24 overflow-hidden rounded-lg border border-white/[0.05] bg-black/30 p-2 text-violet-400">
        <svg viewBox="0 0 200 80" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="hero-spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 60 L20 50 L40 55 L60 38 L80 42 L100 28 L120 35 L140 20 L160 24 L180 12 L200 18 L200 80 L0 80 Z"
            fill="url(#hero-spark)"
          />
          <path
            d="M0 60 L20 50 L40 55 L60 38 L80 42 L100 28 L120 35 L140 20 L160 24 L180 12 L200 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        {[
          { label: "Sessions", value: "48.2k" },
          { label: "Latency", value: "118ms" },
          { label: "Uptime", value: "99.99%" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-white/[0.05] bg-white/[0.02] p-2"
          >
            <p className="text-zinc-500">{s.label}</p>
            <p className="mt-0.5 font-medium text-zinc-200">{s.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DeployPill() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.55, duration: 0.5, ease }}
      className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-medium text-emerald-200 shadow-glass backdrop-blur-md"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/25">
        <Check className="h-2.5 w-2.5" />
      </span>
      Deployed to production · 47s
    </motion.div>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28"
    >
      <Aurora />
      <BackgroundGrid />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:px-8">
        <div>
          <AnimatedReveal>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden />
              AI-native startup studio
            </p>
          </AnimatedReveal>

          <AnimatedReveal delay={0.05}>
            <h1
              id="hero-heading"
              className="text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]"
            >
              <span className="text-gradient-violet">Launch AI-powered</span>
              <br />
              products faster.
            </h1>
          </AnimatedReveal>

          <AnimatedReveal delay={0.1}>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl">
              We design, build, and ship MVPs and SaaS products with founders—
              lean teams, AI-accelerated workflows, production from day one.
            </p>
          </AnimatedReveal>

          <AnimatedReveal delay={0.18}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <GradientButton href="#contact" variant="primary">
                Book Discovery Call
                <ArrowRight className="h-4 w-4" aria-hidden />
              </GradientButton>
              <GradientButton href="#services" variant="secondary">
                Explore Services
              </GradientButton>
            </div>
          </AnimatedReveal>

          <AnimatedReveal delay={0.28}>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2" aria-hidden>
                {[
                  "from-violet-500 to-fuchsia-500",
                  "from-sky-500 to-indigo-500",
                  "from-emerald-500 to-teal-500",
                  "from-amber-500 to-orange-500",
                ].map((g, i) => (
                  <span
                    key={i}
                    className={`h-7 w-7 rounded-full border-2 border-zinc-950 bg-gradient-to-br ${g}`}
                  />
                ))}
              </div>
              <p className="text-sm text-zinc-400">
                <span className="font-semibold text-zinc-200">12 MVPs</span>{" "}
                shipped this year with founders.
              </p>
            </div>
          </AnimatedReveal>
        </div>

        <div
          className="relative mx-auto h-[420px] w-full max-w-lg lg:mx-0 lg:h-[460px] lg:max-w-none"
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/70 to-zinc-950/95 shadow-glass"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease }}
          />
          <div
            className="pointer-events-none absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
            aria-hidden
          />
          <PromptCard />
          <DashboardCard />
          <DeployPill />
        </div>
      </div>
    </section>
  );
}
