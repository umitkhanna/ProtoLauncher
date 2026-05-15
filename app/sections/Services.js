"use client";

import { Bot, Check, Cloud, Cpu, UsersRound } from "lucide-react";
import { motion } from "framer-motion";
import { services } from "../services/data";
import { AnimatedReveal } from "../components/AnimatedReveal";
import { SectionLabel } from "../components/SectionLabel";
import { SectionWrapper } from "../components/SectionWrapper";
import { Spotlight } from "../components/Spotlight";

const icons = [Cpu, Cloud, Bot, UsersRound];

export function Services() {
  return (
    <SectionWrapper
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-24 py-24 sm:py-32"
    >
      <AnimatedReveal>
        <SectionLabel>Services</SectionLabel>
        <h2
          id="services-heading"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          End-to-end execution for ambitious teams.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Lean pods, modern stacks, AI where it compounds—without the agency
          overhead.
        </p>
      </AnimatedReveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {services.map((s, i) => {
          const Icon = icons[i] ?? Cpu;
          return (
            <AnimatedReveal key={s.id} delay={0.06 * (i + 1)}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <Spotlight className="group h-full rounded-2xl border border-white/[0.06] bg-zinc-900/40 transition hover:border-white/[0.12]">
                  <div className="relative h-full p-8">
                    <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-300">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                      {s.description}
                    </p>
                    {s.bullets ? (
                      <ul className="mt-5 space-y-2">
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-2 text-sm text-zinc-300"
                          >
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </Spotlight>
              </motion.article>
            </AnimatedReveal>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
