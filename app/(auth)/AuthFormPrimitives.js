import { GlassCard } from "@/app/components/GlassCard";

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-950/40 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 shadow-inner shadow-black/20 outline-none transition focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/20";

export function AuthCard({ title, subtitle, children }) {
  return (
    <GlassCard className="p-8 sm:p-10">
      <div className="mb-8 space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm leading-relaxed text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </GlassCard>
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

export function AuthSubmitButton({ children, pending, className = "" }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-violet-500/15 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export { inputClass };
