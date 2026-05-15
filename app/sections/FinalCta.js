"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GradientButton } from "../components/GradientButton";

export function FinalCta() {
  return (
    <section className="relative py-28">
      <div className="pointer-events-none absolute inset-0 bg-cta-radial" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/95 p-10 shadow-glass backdrop-blur-xl sm:p-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to launch faster?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Let’s build your next AI-powered product.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <GradientButton href="#contact" variant="primary">
              Book a Call
              <ArrowRight className="h-4 w-4" aria-hidden />
            </GradientButton>
            <GradientButton href="#contact" variant="secondary">
              Start a Project
            </GradientButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
