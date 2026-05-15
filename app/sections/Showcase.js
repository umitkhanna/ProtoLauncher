"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { showcaseItems } from "../showcase/data";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";
import { ShowcaseMockup } from "../showcase/Mockup";

export function Showcase() {
  return (
    <SectionWrapper
      id="showcase"
      aria-labelledby="showcase-heading"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <AnimatedReveal>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Showcase</SectionLabel>
            <h2
              id="showcase-heading"
              className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Interfaces that feel inevitable—not improvised.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-zinc-400">
              Real product surfaces—no stock imagery, only product-native
              layouts.
            </p>
          </div>
          <a
            href="#contact"
            className="hidden text-sm font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline sm:inline-flex"
          >
            Talk to us about your build →
          </a>
        </div>
      </AnimatedReveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {showcaseItems.map((item, i) => (
          <AnimatedReveal key={item.id} delay={0.08 * (i + 1)}>
            <motion.article
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/30 shadow-glass transition hover:border-white/[0.12]"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {item.category}
                  </p>
                  <ArrowUpRight className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
                {item.tags ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] text-zinc-400"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="mt-6 p-6 pt-0">
                <ShowcaseMockup variant={item.variant} />
              </div>
            </motion.article>
          </AnimatedReveal>
        ))}
      </div>
    </SectionWrapper>
  );
}
