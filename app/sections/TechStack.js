"use client";

import { motion } from "framer-motion";

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind",
  "PostgreSQL",
  "Prisma",
  "OpenAI",
  "Anthropic",
  "LangGraph",
  "Vercel",
  "AWS",
  "Stripe",
  "Supabase",
  "Cloudflare",
];

export function TechStack() {
  return (
    <section
      aria-label="Engineering stack"
      className="relative border-y border-white/[0.06] bg-zinc-950/55"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Built with the modern, production-grade stack
        </p>

        <div className="relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />

          <motion.ul
            className="flex gap-10"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 32,
                ease: "linear",
              },
            }}
          >
            {[...stack, ...stack].map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="shrink-0 text-base font-medium tracking-tight text-zinc-500 transition-colors hover:text-zinc-200"
                aria-hidden={i >= stack.length}
              >
                {name}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
