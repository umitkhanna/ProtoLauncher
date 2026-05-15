"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";

export function FloatingMockupCard({
  title,
  className = "",
  delay = 0,
  floating = true,
  children,
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard
        className={`relative overflow-hidden p-4 ${
          floating ? "animate-float" : ""
        }`}
        hoverGlow={false}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Live
          </span>
        </div>
        <div className="mb-3 h-1 w-16 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" />
        {children ?? (
          <>
            <div className="space-y-2">
              <div className="h-2 w-full rounded bg-zinc-700/60" />
              <div className="h-2 w-4/5 rounded bg-zinc-800/80" />
              <div className="h-2 w-3/5 rounded bg-zinc-800/60" />
            </div>
            {title ? (
              <p className="mt-3 text-xs text-zinc-500">{title}</p>
            ) : null}
          </>
        )}
      </GlassCard>
    </motion.div>
  );
}
