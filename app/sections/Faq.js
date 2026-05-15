"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { JsonLd } from "../components/JsonLd";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";

export const faqs = [
  {
    q: "How quickly can you start?",
    a: "We typically kick off within 1–2 weeks. Discovery Sprints often start the same week if scope is clear.",
  },
  {
    q: "What does a typical engagement look like?",
    a: "Most founders begin with a 1-week Discovery Sprint, then move into a 6–10 week MVP Build. Some continue with Fractional CTO support after launch.",
  },
  {
    q: "Do you work with non-technical founders?",
    a: "Absolutely. A lot of our clients are first-time or non-technical founders. We translate product vision into architecture, scope, and a roadmap you can defend to investors.",
  },
  {
    q: "How do you handle IP and code ownership?",
    a: "You own 100% of the code, designs, and IP we produce. We hand over clean repos, documentation, and infra access at every milestone.",
  },
  {
    q: "Are you remote or in-person?",
    a: "We're a remote-first studio working across time zones, with overlap windows for daily syncs. We can travel for kickoffs or launch weeks if useful.",
  },
  {
    q: "What happens after the MVP ships?",
    a: "Most teams continue with a Fractional CTO engagement or a focused growth-build retainer. We can also help you hire and onboard an in-house team.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function FaqItem({ q, a, open, onToggle, id }) {
  return (
    <li className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-content`}
        className="flex w-full items-center justify-between gap-6 py-6 text-left transition hover:text-white"
      >
        <span className="text-base font-medium text-white sm:text-lg">{q}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300">
          {open ? (
            <Minus className="h-4 w-4" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-content`}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-3xl pb-6 pr-8 text-[15px] leading-relaxed text-zinc-400">
              {a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <SectionWrapper
      aria-labelledby="faq-heading"
      className="py-24 sm:py-32"
    >
      <JsonLd data={faqSchema} />
      <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <AnimatedReveal>
          <SectionLabel>FAQ</SectionLabel>
          <h2
            id="faq-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Answers, before you ask.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Still curious? Bring your weirdest, most specific question to a
            discovery call.
          </p>
        </AnimatedReveal>

        <AnimatedReveal delay={0.05}>
          <ul className="rounded-2xl border border-white/[0.06] bg-zinc-900/30 px-6 sm:px-8">
            {faqs.map((f, i) => (
              <FaqItem
                key={f.q}
                id={`faq-${i}`}
                q={f.q}
                a={f.a}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            ))}
          </ul>
        </AnimatedReveal>
      </div>
    </SectionWrapper>
  );
}
