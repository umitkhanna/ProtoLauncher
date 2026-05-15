/**
 * Layered, soft aurora gradient backdrop driven by theme CSS variables.
 * Tuned via `--aurora-intensity` for stronger color in dark, softer in light.
 */
export function Aurora({ className = "", intensity = "default" }) {
  const baseOpacity = intensity === "soft" ? 0.55 : 0.85;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute -top-40 left-1/2 h-[560px] w-[640px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          opacity: `calc(${baseOpacity} * var(--aurora-intensity, 1))`,
          background:
            "radial-gradient(closest-side, rgb(var(--aurora-violet) / 0.55), rgb(var(--aurora-violet) / 0.18) 60%, transparent 80%)",
        }}
      />
      <div
        className="absolute top-32 right-0 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{
          opacity: `calc(${baseOpacity * 0.7} * var(--aurora-intensity, 1))`,
          background:
            "radial-gradient(closest-side, rgb(var(--aurora-cyan) / 0.35), transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-20 left-0 h-[380px] w-[460px] rounded-full blur-3xl"
        style={{
          opacity: `calc(${baseOpacity * 0.6} * var(--aurora-intensity, 1))`,
          background:
            "radial-gradient(closest-side, rgb(var(--aurora-fuchsia) / 0.30), transparent 70%)",
        }}
      />
    </div>
  );
}
