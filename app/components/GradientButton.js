import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";

const variants = {
  primary:
    "bg-white text-zinc-950 shadow-lg shadow-violet-500/15 hover:bg-zinc-100",
  secondary:
    "border border-white/15 bg-white/[0.04] text-zinc-100 backdrop-blur-sm hover:border-white/25",
};

export function GradientButton({
  href,
  children,
  variant = "primary",
  className = "",
  ...rest
}) {
  const cls = `${base} ${variants[variant] ?? variants.primary} px-6 py-3 text-sm ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
