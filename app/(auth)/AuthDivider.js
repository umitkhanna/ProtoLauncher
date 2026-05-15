export function AuthDivider({ label = "or" }) {
  return (
    <div className="relative my-7" role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-white/[0.08]" />
      </div>
      <p className="relative flex justify-center text-xs font-medium uppercase tracking-wider text-zinc-500">
        <span className="rounded-full border border-white/[0.06] bg-zinc-950/80 px-3 py-0.5 backdrop-blur-sm">
          {label}
        </span>
      </p>
    </div>
  );
}
