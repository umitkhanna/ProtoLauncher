"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Hammer, Lightbulb, Rocket, Search } from "lucide-react";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";

const steps = [
  {
    title: "Discover",
    duration: "Week 1",
    body: "Align on users, constraints, and the fastest path to signal.",
    deliverables: ["Product brief", "Architecture sketch", "Success metrics"],
    icon: Search,
  },
  {
    title: "Prototype",
    duration: "Weeks 2–3",
    body: "Validate UX and architecture with interactive, shippable slices.",
    deliverables: ["Clickable UX", "Backend skeleton", "Demo to stakeholders"],
    icon: Lightbulb,
  },
  {
    title: "Build",
    duration: "Weeks 3–5",
    body: "Production engineering with clean APIs, observability, and AI hooks.",
    deliverables: ["Auth + billing", "Core flows", "Test + observability"],
    icon: Hammer,
  },
  {
    title: "Launch",
    duration: "Week 6+",
    body: "Ship, measure, and iterate with a roadmap investors understand.",
    deliverables: ["Public launch", "Analytics dashboard", "Iteration plan"],
    icon: Rocket,
  },
];

export function Process() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 60%"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <SectionWrapper
      id="process"
      aria-labelledby="process-heading"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <AnimatedReveal>
        <SectionLabel>Process</SectionLabel>
        <h2
          id="process-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          A timeline your team can trust.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Four phases, weekly demos, and clear definitions of done. No
          surprises on Friday.
        </p>
      </AnimatedReveal>

      <div ref={ref} className="relative mt-16">
        <div
          className="absolute left-[22px] top-0 bottom-0 w-px bg-white/[0.07] lg:left-0 lg:right-0 lg:top-[22px] lg:bottom-auto lg:h-px lg:w-auto"
          aria-hidden
        />
        <motion.div
          className="absolute left-[22px] top-0 w-px bg-gradient-to-b from-violet-500 via-indigo-400 to-violet-500/0 lg:hidden"
          style={{ height: progress }}
          aria-hidden
        />
        <motion.div
          className="absolute left-0 top-[22px] hidden h-px bg-gradient-to-r from-violet-500 via-indigo-400 to-violet-500/0 lg:block"
          style={{ width: progress }}
          aria-hidden
        />

        <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
          {steps.map((step, idx) => (
            <li
              key={step.title}
              className="relative pl-14 lg:pl-0 lg:pt-0"
            >
              <div className="absolute left-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-violet-300 shadow-lg shadow-violet-500/15 lg:relative lg:mb-6">
                <step.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Step 0{idx + 1}
                </span>
                <span className="text-[11px] font-medium text-violet-300/90">
                  {step.duration}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                {step.body}
              </p>
              <ul className="mt-4 space-y-1.5">
                {step.deliverables.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-2 text-xs text-zinc-500"
                  >
                    <span
                      aria-hidden
                      className="h-1 w-1 rounded-full bg-violet-400/70"
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </SectionWrapper>
  );
}
