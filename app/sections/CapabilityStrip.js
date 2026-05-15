"use client";

import { motion } from "framer-motion";

const items = [
  "AI MVP Development",
  "SaaS Engineering",
  "AI Automation",
  "Startup Tech Partner",
  "Rapid Product Launches",
];

export function CapabilityStrip() {
  return (
    <section
      aria-label="Capabilities"
      className="relative border-y border-white/[0.06] bg-zinc-950/55"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />

      <div className="mx-auto max-w-6xl overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <motion.ul
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 36,
              ease: "linear",
            },
          }}
        >
          {[...items, ...items].map((label, i) => (
            <li
              key={`${label}-${i}`}
              className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-zinc-300"
            >
              {label}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
