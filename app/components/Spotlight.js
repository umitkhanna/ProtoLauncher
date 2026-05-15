"use client";

import { useRef } from "react";

/**
 * Mouse-follow spotlight wrapper. Renders children + a radial highlight that
 * tracks the cursor over the element. No re-renders (writes directly to CSS vars).
 * Falls back gracefully on touch and reduced-motion devices.
 */
export function Spotlight({
  children,
  className = "",
  color = "rgba(139, 92, 246, 0.18)",
  size = 360,
  as: Tag = "div",
}) {
  const ref = useRef(null);

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
    el.style.setProperty("--spot-opacity", "1");
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--spot-opacity", "0");
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative isolate ${className}`}
      style={{
        "--spot-x": "50%",
        "--spot-y": "50%",
        "--spot-opacity": "0",
        "--spot-size": `${size}px`,
        "--spot-color": color,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: "var(--spot-opacity)",
          background:
            "radial-gradient(var(--spot-size) circle at var(--spot-x) var(--spot-y), var(--spot-color), transparent 60%)",
        }}
      />
      {children}
    </Tag>
  );
}
