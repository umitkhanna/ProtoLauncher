"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";

// NOTE: Replace these with real founder testimonials before launch.
const testimonials = [
  {
    quote:
      "We had a clickable prototype in week one and a paying customer in week six. The bar for craft was higher than our previous in-house team.",
    name: "Maya Chen",
    role: "Co-founder, Loomline",
    avatar: "from-violet-500 to-fuchsia-500",
  },
  {
    quote:
      "They think like operators, not contractors. Every sprint shipped something I could put in front of investors and customers.",
    name: "Jordan Patel",
    role: "Founder, Northcurrent",
    avatar: "from-sky-500 to-indigo-500",
  },
  {
    quote:
      "The AI integrations actually work in production—evals, guardrails, and cost dashboards from day one. Best technical partner we've worked with.",
    name: "Sara Ahmadi",
    role: "CTO, Quanta Labs",
    avatar: "from-emerald-500 to-teal-500",
  },
];

export function Testimonials() {
  return (
    <SectionWrapper
      aria-labelledby="testimonials-heading"
      className="py-24 sm:py-32"
    >
      <AnimatedReveal>
        <SectionLabel>Founder voices</SectionLabel>
        <h2
          id="testimonials-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          The kind of partner you wish you had on day one.
        </h2>
      </AnimatedReveal>

      <ul className="mt-14 grid gap-5 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <AnimatedReveal key={t.name} delay={0.06 * (i + 1)}>
            <motion.li
              whileHover={{ y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-8 transition hover:border-white/[0.12]"
            >
              <Quote
                className="h-6 w-6 text-violet-400/60"
                strokeWidth={1.5}
                aria-hidden
              />
              <blockquote className="mt-5 grow text-[15px] leading-relaxed text-zinc-200">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-6 border-t border-white/[0.05]">
                <span
                  aria-hidden
                  className={`h-10 w-10 rounded-full border-2 border-zinc-950 bg-gradient-to-br ${t.avatar}`}
                />
                <span className="text-sm">
                  <span className="block font-medium text-white">{t.name}</span>
                  <span className="block text-zinc-500">{t.role}</span>
                </span>
              </figcaption>
            </motion.li>
          </AnimatedReveal>
        ))}
      </ul>
    </SectionWrapper>
  );
}
