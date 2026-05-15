"use client";

import { motion } from "framer-motion";
import { Gauge, Rocket, Shapes, Sparkles } from "lucide-react";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { BackgroundGrid } from "../components/BackgroundGrid";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";

function AiWorkflowVisual() {
  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4">
      <BackgroundGrid />
      <div className="relative grid grid-cols-3 gap-3">
        {["Plan", "Build", "Ship"].map((label, i) => (
          <div
            key={label}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
              <span className="h-1 w-1 rounded-full bg-violet-400" />
              Step 0{i + 1}
            </div>
            <p className="mt-1.5 text-sm font-medium text-zinc-200">{label}</p>
            <div className="mt-3 space-y-1">
              <div className="h-1 w-full rounded bg-zinc-800" />
              <div className="h-1 w-2/3 rounded bg-zinc-800/70" />
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-violet-500/15 bg-violet-500/[0.06] p-3 text-[11px] text-violet-200">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        AI assists at every step — specs, code review, test generation, release notes.
      </div>
    </div>
  );
}

function SprintVisual() {
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
  return (
    <div className="mt-6 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
        <span>Discovery</span>
        <span>Launch</span>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {weeks.map((w, i) => (
          <div key={w} className="space-y-1.5">
            <div
              className={`h-2 rounded-full ${
                i < 4 ? "bg-gradient-to-r from-violet-500 to-indigo-400" : "bg-zinc-800"
              }`}
            />
            <p className="text-center text-[10px] text-zinc-500">{w}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-400">
        Sprint-based delivery with weekly demos and clear definitions of done.
      </p>
    </div>
  );
}

function TokensVisual() {
  return (
    <div className="mt-6 rounded-xl border border-white/[0.06] bg-zinc-950/50 p-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        Design tokens
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          "from-violet-500 to-fuchsia-500",
          "from-sky-500 to-indigo-500",
          "from-emerald-500 to-teal-500",
          "from-amber-500 to-orange-500",
          "from-zinc-700 to-zinc-900",
          "from-rose-500 to-pink-500",
          "from-cyan-400 to-blue-500",
          "from-violet-600 to-indigo-600",
        ].map((g, i) => (
          <div
            key={i}
            className={`aspect-square rounded-md border border-white/[0.06] bg-gradient-to-br ${g}`}
          />
        ))}
      </div>
    </div>
  );
}

function TeamVisual() {
  const roles = [
    { label: "Product", g: "from-violet-500 to-fuchsia-500" },
    { label: "Design", g: "from-sky-500 to-indigo-500" },
    { label: "Eng", g: "from-emerald-500 to-teal-500" },
    { label: "AI/ML", g: "from-amber-500 to-orange-500" },
  ];
  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-2">
      {roles.map((r) => (
        <div
          key={r.label}
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <span
            className={`h-8 w-8 rounded-full border-2 border-zinc-950 bg-gradient-to-br ${r.g}`}
            aria-hidden
          />
          <div className="text-xs">
            <p className="font-medium text-zinc-200">{r.label} lead</p>
            <p className="text-zinc-500">10+ yrs shipping product</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const tiles = [
  {
    title: "AI-native by default",
    body: "AI assists at every step—specs, scaffolding, code review, test generation. We treat it like infrastructure, not novelty.",
    icon: Shapes,
    span: "lg:col-span-2",
    visual: AiWorkflowVisual,
  },
  {
    title: "Startup-focused execution",
    body: "Built for speed and iteration. Weekly demos, lean scope, no agency-style billable theater.",
    icon: Rocket,
    span: "lg:col-span-1",
    visual: SprintVisual,
  },
  {
    title: "Product-first mindset",
    body: "We think like operators—UX, growth, and engineering as one team, not silos.",
    icon: Gauge,
    span: "lg:col-span-1",
    visual: TokensVisual,
  },
  {
    title: "Senior team you can trust",
    body: "Every engagement is led by senior product engineers and designers. No juniors learning on your dime.",
    icon: Sparkles,
    span: "lg:col-span-2",
    visual: TeamVisual,
  },
];

export function WhyProtoLauncher() {
  return (
    <SectionWrapper
      aria-labelledby="why-heading"
      className="relative py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <AnimatedReveal>
        <SectionLabel>Why ProtoLauncher</SectionLabel>
        <h2
          id="why-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Built like an in-house team. Shipped like a product company.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          A studio designed for founders who care about velocity and craft in
          equal measure.
        </p>
      </AnimatedReveal>

      <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {tiles.map((t, i) => {
          const Visual = t.visual;
          return (
            <AnimatedReveal key={t.title} delay={0.05 * i}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-zinc-900/55 to-zinc-950/90 p-6 transition hover:border-white/[0.12] sm:p-8 ${t.span}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-300">
                    <t.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                      {t.body}
                    </p>
                  </div>
                </div>
                <Visual />
              </motion.div>
            </AnimatedReveal>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
