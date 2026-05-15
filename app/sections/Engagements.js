"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";

const tiers = [
  {
    name: "Discovery Sprint",
    pitch: "Pressure-test an AI product idea in one focused week.",
    duration: "1 week",
    bestFor: "Pre-seed founders, idea validation",
    includes: [
      "Customer + market interviews",
      "Product brief and architecture sketch",
      "Clickable prototype of the core flow",
      "Investor-ready technical narrative",
    ],
    cta: { label: "Start a Sprint", href: "#contact" },
    highlight: false,
  },
  {
    name: "MVP Build",
    pitch: "Ship a credible v1 with paying users in 6–10 weeks.",
    duration: "6–10 weeks",
    bestFor: "Seed/Series A teams shipping the first product",
    includes: [
      "Full-stack product engineering",
      "Auth, billing, observability, analytics",
      "AI integrations (RAG, agents, evals)",
      "Public launch + onboarding flow",
    ],
    cta: { label: "Plan a Build", href: "#contact" },
    highlight: true,
  },
  {
    name: "Fractional CTO",
    pitch: "Senior technical leadership without the full-time hire.",
    duration: "Ongoing, monthly",
    bestFor: "Funded teams without an in-house CTO",
    includes: [
      "Architecture + hiring strategy",
      "Sprint planning + code review",
      "Vendor + cost decisions",
      "Board-grade technical updates",
    ],
    cta: { label: "Hire a Fractional CTO", href: "#contact" },
    highlight: false,
  },
];

export function Engagements() {
  return (
    <SectionWrapper
      id="engagements"
      aria-labelledby="engagements-heading"
      className="relative scroll-mt-24 py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <AnimatedReveal>
        <SectionLabel>Engagements</SectionLabel>
        <h2
          id="engagements-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Three ways founders work with us.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Scoped engagements with clear deliverables. No hourly billing, no
          surprise change orders.
        </p>
      </AnimatedReveal>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {tiers.map((tier, i) => (
          <AnimatedReveal key={tier.name} delay={0.06 * (i + 1)}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex h-full flex-col rounded-2xl border p-8 transition ${
                tier.highlight
                  ? "border-violet-500/30 bg-gradient-to-b from-violet-500/[0.08] to-zinc-950/90 shadow-ring-violet"
                  : "border-white/[0.06] bg-zinc-900/35 hover:border-white/[0.12]"
              }`}
            >
              {tier.highlight ? (
                <span className="absolute -top-3 left-8 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-200 backdrop-blur-md">
                  Most popular
                </span>
              ) : null}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {tier.duration}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                  {tier.pitch}
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Best for:</span>{" "}
                {tier.bestFor}
              </div>

              <ul className="mt-6 space-y-2.5">
                {tier.includes.map((inc) => (
                  <li
                    key={inc}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {inc}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                <Link
                  href={tier.cta.href}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    tier.highlight
                      ? "bg-white text-zinc-950 hover:bg-zinc-100"
                      : "border border-white/15 bg-white/[0.04] text-zinc-100 hover:border-white/25"
                  }`}
                >
                  {tier.cta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </AnimatedReveal>
        ))}
      </div>
    </SectionWrapper>
  );
}
