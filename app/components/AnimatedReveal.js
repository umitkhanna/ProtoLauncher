"use client";

import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export function AnimatedReveal({
  children,
  className = "",
  delay = 0,
  once = true,
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px", amount: 0.2 }}
      transition={{ duration: 0.5, ease, delay }}
    >
      {children}
    </motion.div>
  );
}
