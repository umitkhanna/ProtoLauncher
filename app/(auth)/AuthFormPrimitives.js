"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/app/components/GlassCard";

const ease = [0.22, 1, 0.36, 1];

export const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/50 px-4 py-3.5 text-sm text-zinc-50 placeholder:text-zinc-500 shadow-inner shadow-black/25 outline-none transition focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20";

export function AuthCard({ badge, title, subtitle, children, footer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
    >
    <GlassCard className="relative overflow-hidden border-white/[0.09] p-8 shadow-glass sm:p-10">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        {badge ? (
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md">
            {badge}
          </p>
        ) : null}

        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}

        {footer ? (
          <div className="mt-8 border-t border-white/[0.06] pt-6">{footer}</div>
        ) : null}
      </div>
    </GlassCard>
    </motion.div>
  );
}

export function AuthField({ label, id, error, className = "", ...props }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        {label}
      </label>
      <input id={id} className={inputClass} {...props} />
      {error ? (
        <p className="mt-2 text-left text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  pending,
  variant = "primary",
  className = "",
}) {
  const variants = {
    primary:
      "bg-white text-zinc-950 shadow-lg shadow-violet-500/20 hover:bg-zinc-100 hover:shadow-violet-500/25",
    secondary:
      "border border-white/15 bg-white/[0.04] text-zinc-100 backdrop-blur-sm hover:border-white/25 hover:bg-white/[0.07]",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] ?? variants.primary} ${className}`}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function AuthAlert({ variant = "info", children }) {
  const styles = {
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/25 bg-red-500/10 text-red-100",
    info: "border-violet-500/20 bg-violet-500/10 text-violet-100",
  };

  return (
    <p
      className={`rounded-xl border px-3.5 py-2.5 text-center text-sm leading-relaxed ${styles[variant] ?? styles.info}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

export function AuthTextLink({ href, children }) {
  return (
    <Link
      href={href}
      className="font-medium text-violet-400 underline-offset-4 transition hover:text-violet-300 hover:underline"
    >
      {children}
    </Link>
  );
}
