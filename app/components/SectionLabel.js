export function SectionLabel({ children, className = "" }) {
  return (
    <p
      className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300/90 ${className}`}
    >
      <span
        aria-hidden
        className="inline-block h-1 w-1 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.55)]"
      />
      {children}
    </p>
  );
}
