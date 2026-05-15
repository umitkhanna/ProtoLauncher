export function AuthDivider({ label = "or" }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-white/[0.08]" />
      </div>
      <p className="relative flex justify-center text-xs font-medium uppercase tracking-wider text-zinc-500">
        <span className="bg-transparent px-3">{label}</span>
      </p>
    </div>
  );
}
